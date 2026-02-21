from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

# --- Directory Configuration ---
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
        """Looks for data files in both the database folder and the project root."""
        return [
            DATA_DIR / filename,
            PROJECT_ROOT / filename,
        ]

    def _resolve_existing(self, filename: str) -> Path | None:
        """Returns the first existing path, or None if the file is not found."""
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
        """Helper function to safely split various author string formats into a list."""
        if isinstance(raw_value, list):
            return [str(v).strip() for v in raw_value if str(v).strip()]
        if not raw_value or pd.isna(raw_value):
            return []
        text = str(raw_value)
        separator = ";" if ";" in text else ","
        return [v.strip() for v in text.split(separator) if v.strip()]

    def load_data(self):
        """
        Loads and merges data strictly adhering to the original mapping rules,
        but using robust file resolution and safe fallback mechanisms.
        """
        # 1. Load the Base Table (final_posts_en.json)
        main_json_path = self._resolve_existing("final_posts_en.json")
        if main_json_path:
            with main_json_path.open("r", encoding="utf-8") as f:
                df = pd.DataFrame(json.load(f))
        else:
            # Fallback: Try reading CSV if the JSON is missing to prevent total failure
            csv_path_fallback = self._resolve_existing("xiaohongshu_full_topics.csv")
            if csv_path_fallback:
                df = pd.read_csv(csv_path_fallback)
            else:
                return pd.DataFrame()

        # Ensure ID column exists
        if "id" not in df.columns:
            df["id"] = [f"paper-{i}" for i in range(len(df))]
        df["id"] = df["id"].astype(str)

        # Prepare a cleaned title for merging (lowercase, stripped)
        title_col = "display_title" if "display_title" in df.columns else "title"
        if title_col in df.columns:
            df["title_clean"] = df[title_col].astype(str).str.strip().str.lower()
        else:
            df["title_clean"] = ""

        # 2. Merge Keywords (dynamic_keywords -> keywords)
        keywords_path = self._resolve_existing("keywords_with_keybert.json")
        if keywords_path:
            try:
                with keywords_path.open("r", encoding="utf-8") as f:
                    kw_df = pd.DataFrame(json.load(f))
                if "id" in kw_df.columns and "dynamic_keywords" in kw_df.columns:
                    kw_df["id"] = kw_df["id"].astype(str)
                    df = df.merge(kw_df[["id", "dynamic_keywords"]], on="id", how="left")
            except Exception as e:
                print(f"Warning: Failed to merge keywords: {e}")

        # 3. Merge Abstract (abstract -> abstract)
        abstracts_path = self._resolve_existing("extracted_titles_abstracts.json")
        if abstracts_path:
            try:
                with abstracts_path.open("r", encoding="utf-8") as f:
                    abs_df = pd.DataFrame(json.load(f))
                if "title" in abs_df.columns and "abstract" in abs_df.columns:
                    abs_df["title_clean"] = abs_df["title"].astype(str).str.strip().str.lower()
                    abs_df = abs_df.drop_duplicates(subset=["title_clean"])
                    
                    df = df.merge(abs_df[["title_clean", "abstract"]], on="title_clean", how="left", suffixes=("", "_merged"))
                    
                    if "abstract_merged" in df.columns:
                        df["abstract"] = df["abstract_merged"]
                        df = df.drop(columns=["abstract_merged"])
            except Exception as e:
                print(f"Warning: Failed to merge abstracts: {e}")

        # 4. Merge CSV Metadata (Authors, Category, Citations, etc.)
        csv_path = self._resolve_existing("xiaohongshu_full_topics.csv")
        if csv_path:
            try:
                csv_df = pd.read_csv(csv_path)
                if "title" in csv_df.columns:
                    csv_df["title_clean"] = csv_df["title"].astype(str).str.strip().str.lower()
                    csv_df = csv_df.drop_duplicates(subset=["title_clean"])

                    cols_to_merge = ["title_clean"]
                    target_cols = ["authors", "category", "update_date", "citations"]
                    
                    for col in target_cols:
                        if col in csv_df.columns:
                            cols_to_merge.append(col)
                    
                    if len(cols_to_merge) > 1:
                        df = df.merge(csv_df[cols_to_merge], on="title_clean", how="left", suffixes=("_old", ""))
                        
                        # Clean up conflicting columns by trusting the CSV metadata
                        for col in target_cols:
                            if f"{col}_old" in df.columns:
                                df = df.drop(columns=[f"{col}_old"])
            except Exception as e:
                print(f"Warning: Failed to merge CSV data: {e}")

        # --- Rename Mappings ---
        
        if "display_title" in df.columns:
            df["title"] = df["display_title"]
        if "title" not in df.columns:
            df["title"] = "Untitled"

        if "innovation" in df.columns:
            df["ai_summary"] = df["innovation"]
        if "ai_summary" not in df.columns:
            df["ai_summary"] = ""
            
        if "dynamic_keywords" in df.columns:
            df["keywords"] = df["dynamic_keywords"]
        
        if "imageUrl" in df.columns:
            df["image_url"] = df["imageUrl"]
        if "image_url" not in df.columns:
            df["image_url"] = None

        if "likesCount" in df.columns:
            df["likes_count"] = df["likesCount"]
        
        # --- Default Values (Reverting to original script standards) ---

        if "abstract" not in df.columns:
            df["abstract"] = ""
        df["abstract"] = df["abstract"].fillna("")

        if "citations" not in df.columns:
            df["citations"] = 0
        df["citations"] = pd.to_numeric(df["citations"], errors='coerce').fillna(0).astype(int)

        if "update_date" not in df.columns:
            df["update_date"] = "2026-02-13"
        df["update_date"] = df["update_date"].fillna("2026-02-13").astype(str)

        if "category" not in df.columns:
            df["category"] = "General"
        df["category"] = df["category"].fillna("General").astype(str)

        if "likes_count" not in df.columns:
            df["likes_count"] = 0
        df["likes_count"] = pd.to_numeric(df["likes_count"], errors='coerce').fillna(0).astype(int)
        
        # Saves explicitly initialized to 0 based on original logic
        df["saves_count"] = 0

        # --- List Standardization ---
        
        if "keywords" not in df.columns:
            df["keywords"] = [[] for _ in range(len(df))]
        if "tags" not in df.columns:
            df["tags"] = [[] for _ in range(len(df))]
            
        def normalize_list(value):
            if isinstance(value, list):
                return [str(v) for v in value]
            if pd.isna(value) or value == "":
                return []
            return [str(value)]

        df["keywords"] = df["keywords"].apply(normalize_list)
        df["tags"] = df["tags"].apply(normalize_list)

        # Handle authors safely
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

        # --- Cleanup ---
        drop_cols = ["title_clean", "display_title", "innovation", "dynamic_keywords", "imageUrl", "likesCount"]
        df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")

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
        
        current_val = int(self.df.at[row_idx, field])
        next_value = max(0, current_val + int(delta))
        self.df.at[row_idx, field] = next_value
        
        return next_value

db_manager = DataManager()