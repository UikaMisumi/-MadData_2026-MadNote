from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = BACKEND_DIR / "database"
DATA_DIR.mkdir(exist_ok=True)


class DataManager:
    def __init__(self):
        self.df = self.load_data()
        self.interactions_path = DATA_DIR / "interactions.json"
        self.comments_path = DATA_DIR / "comments.json"
        self.interactions = self.load_json_file(self.interactions_path, {"likes": {}, "saves": {}})
        self.comments = self.load_json_file(self.comments_path, {})

    def _candidate_paths(self, filename: str):
        return [
            DATA_DIR / filename,
            PROJECT_ROOT / filename,
        ]

    def _resolve_existing(self, filename: str) -> Path | None:
        for path in self._candidate_paths(filename):
            if path.exists():
                return path
        return None

    def load_json_file(self, path: Path, default_value: Any):
        if path.exists():
            with path.open("r", encoding="utf-8") as f:
                try:
                    return json.load(f)
                except Exception:
                    return default_value
        return default_value

    def _split_authors(self, raw_value: Any):
        if isinstance(raw_value, list):
            return [str(v).strip() for v in raw_value if str(v).strip()]
        if not raw_value:
            return []
        text = str(raw_value)
        separator = ";" if ";" in text else ","
        return [v.strip() for v in text.split(separator) if v.strip()]

    def load_data(self):
        """Load and normalize paper data.

        Priority:
        1) backend/database/final_posts_en.json
        2) <project_root>/final_posts_en.json
        3) backend/database/xiaohongshu_full_topics.csv
        4) <project_root>/xiaohongshu_full_topics.csv
        """
        main_json_path = self._resolve_existing("final_posts_en.json")
        csv_path = self._resolve_existing("xiaohongshu_full_topics.csv")

        if main_json_path:
            with main_json_path.open("r", encoding="utf-8") as f:
                main_data = json.load(f)
            df = pd.DataFrame(main_data)
        elif csv_path:
            df = pd.read_csv(csv_path)
        else:
            print("Error: No supported paper data source found in backend/database or project root.")
            return pd.DataFrame()

        # Optional abstract enrichment by title.
        abstracts_path = self._resolve_existing("extracted_titles_abstracts.json")
        if abstracts_path:
            try:
                with abstracts_path.open("r", encoding="utf-8") as f:
                    abstracts_data = json.load(f)
                abs_df = pd.DataFrame(abstracts_data)
                if {"title", "abstract"}.issubset(abs_df.columns):
                    abs_df = abs_df.dropna(subset=["title"])
                    abstract_map = dict(zip(abs_df["title"].astype(str), abs_df["abstract"]))
                    if "title" in df.columns:
                        df["abstract_from_file"] = df["title"].astype(str).map(abstract_map)
            except Exception as exc:
                print(f"Warning: failed to load extracted_titles_abstracts.json: {exc}")

        # Optional keyword enrichment.
        keywords_path = self._resolve_existing("keywords_with_keybert.json")
        if keywords_path:
            try:
                with keywords_path.open("r", encoding="utf-8") as f:
                    keywords_data = json.load(f)
                kw_df = pd.DataFrame(keywords_data)
                if {"id", "dynamic_keywords"}.issubset(kw_df.columns):
                    kw_df["id"] = kw_df["id"].astype(str)
                    df["id"] = df.get("id", pd.Series(dtype=str)).astype(str)
                    df = df.merge(kw_df[["id", "dynamic_keywords"]], on="id", how="left")
            except Exception as exc:
                print(f"Warning: failed to load keywords_with_keybert.json: {exc}")

        # Normalize primary fields used by frontend.
        rename_map = {
            "display_title": "title",
            "innovation": "ai_summary",
            "imageUrl": "image_url",
            "likesCount": "likes_count",
            "savesCount": "saves_count",
            "dynamic_keywords": "keywords",
        }
        df = df.rename(columns=rename_map)

        if "id" not in df.columns:
            df["id"] = [f"paper-{i}" for i in range(len(df))]
        df["id"] = df["id"].astype(str)

        if "title" not in df.columns:
            df["title"] = "Untitled"

        if "abstract" not in df.columns:
            df["abstract"] = df.get("social_content", "")
        if "abstract_from_file" in df.columns:
            df["abstract"] = df["abstract_from_file"].fillna(df["abstract"]).fillna("")

        if "ai_summary" not in df.columns:
            df["ai_summary"] = ""

        if "update_date" not in df.columns:
            df["update_date"] = "1970-01-01"
        df["update_date"] = df["update_date"].fillna("1970-01-01").astype(str)

        if "category" not in df.columns:
            df["category"] = "General"
        df["category"] = df["category"].fillna("General").astype(str)

        if "likes_count" not in df.columns:
            df["likes_count"] = 0
        if "saves_count" not in df.columns:
            df["saves_count"] = 0
        df["likes_count"] = pd.to_numeric(df["likes_count"], errors="coerce").fillna(0).astype(int)
        df["saves_count"] = pd.to_numeric(df["saves_count"], errors="coerce").fillna(0).astype(int)

        # Normalize tags/keywords.
        if "tags" not in df.columns:
            df["tags"] = [[] for _ in range(len(df))]
        if "keywords" not in df.columns:
            df["keywords"] = [[] for _ in range(len(df))]

        def normalize_list(value):
            if isinstance(value, list):
                return [str(v) for v in value]
            if value is None or (isinstance(value, float) and pd.isna(value)):
                return []
            return [str(value)]

        df["tags"] = df["tags"].apply(normalize_list)
        df["keywords"] = df["keywords"].apply(normalize_list)

        # Normalize authors and synthesized author object.
        if "authors" not in df.columns:
            df["authors"] = [[] for _ in range(len(df))]
        df["authors"] = df["authors"].apply(self._split_authors)

        def synthesize_author(authors):
            first_author = authors[0] if authors else "Anonymous"
            username = first_author.lower().replace(" ", "_") if first_author else "anonymous"
            return {
                "name": first_author,
                "username": username,
                "avatar": None,
            }

        df["author"] = df["authors"].apply(synthesize_author)

        # Ensure stable shape for card/modal render paths.
        if "image_url" not in df.columns:
            df["image_url"] = None

        return df

    def save_interactions(self):
        with self.interactions_path.open("w", encoding="utf-8") as f:
            json.dump(self.interactions, f, indent=2, ensure_ascii=False)

    def save_comments(self):
        with self.comments_path.open("w", encoding="utf-8") as f:
            json.dump(self.comments, f, indent=2, ensure_ascii=False)

    def update_count(self, paper_id: str, field: str, delta: int) -> int:
        if self.df.empty or field not in self.df.columns:
            return 0
        idx = self.df.index[self.df["id"] == str(paper_id)]
        if len(idx) == 0:
            return 0
        row_idx = idx[0]
        next_value = max(0, int(self.df.at[row_idx, field]) + int(delta))
        self.df.at[row_idx, field] = next_value
        return next_value


db_manager = DataManager()
