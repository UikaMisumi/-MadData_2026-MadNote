
import json
import os
from pathlib import Path

import pandas as pd

# File path configurations (resolved relative to this file, not process cwd)
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = BACKEND_DIR / "database"
DATA_DIR.mkdir(exist_ok=True)

INTERACTIONS_FILE = DATA_DIR / "interactions.json"
COMMENTS_FILE = DATA_DIR / "comments.json"


def resolve_data_file(name: str):
    candidates = [
        DATA_DIR / name,
        PROJECT_ROOT / name,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None

class DataManager:
    def __init__(self):
        self.df = self.load_data()
        self.interactions = self.load_json_file(INTERACTIONS_FILE, {"likes": {}, "saves": {}})
        self.comments = self.load_json_file(COMMENTS_FILE, {})

    def load_data(self):
        """Merges multiple data sources, ensuring fields match the frontend UI mapping."""
        try:
            csv_path = resolve_data_file("xiaohongshu_full_topics.csv")
            titles_abstracts_path = resolve_data_file("extracted_titles_abstracts.json")
            keywords_path = resolve_data_file("keywords_with_keybert.json")
            final_posts_path = resolve_data_file("final_posts_en.json")

            # 1. Base data on Keywords file (contains IDs and key points data)
            if keywords_path is None:
                print("Error: keywords_with_keybert.json not found.")
                return pd.DataFrame()
            
            with open(keywords_path, 'r', encoding='utf-8') as f:
                df = pd.DataFrame(json.load(f))
            df['id'] = df['id'].astype(str)
            # Map dynamic_keywords -> keywords (Frontend 'Key Points' section)
            df = df.rename(columns={'dynamic_keywords': 'keywords'})

            # 2. Merge AI Summary (TL;DR) - retrieved from final_posts_en.json's innovation field
            if final_posts_path is not None:
                with open(final_posts_path, 'r', encoding='utf-8') as f:
                    final_df = pd.DataFrame(json.load(f))
                final_df['id'] = final_df['id'].astype(str)
                # Map innovation -> ai_summary
                final_df = final_df.rename(columns={
                    'innovation': 'ai_summary',
                    'likesCount': 'likes_count_init',
                    'imageUrl': 'image_url'
                })
                # Merge by ID
                df = df.merge(final_df[['id', 'ai_summary', 'likes_count_init', 'image_url']], on='id', how='left')

            # 3. Merge Original Abstract - retrieved from extracted_titles_abstracts.json
            if titles_abstracts_path is not None:
                with open(titles_abstracts_path, 'r', encoding='utf-8') as f:
                    abs_df = pd.DataFrame(json.load(f))
                # Match using titles (strip whitespace and convert to lowercase to improve match rate)
                abs_df['title_clean'] = abs_df['title'].str.strip().str.lower()
                df['title_clean'] = df['title'].str.strip().str.lower()
                
                df = df.merge(abs_df[['title_clean', 'abstract']], on='title_clean', how='left')
                df = df.drop(columns=['title_clean'])

            # 4. Merge Authors and Metadata - retrieved from xiaohongshu_full_topics.csv
            if csv_path is not None:
                csv_df = pd.read_csv(csv_path)
                csv_df['title_clean'] = csv_df['title'].str.strip().str.lower()
                df['title_clean'] = df['title'].str.strip().str.lower()
                
                df = df.merge(
                    csv_df[['title_clean', 'authors', 'category', 'update_date', 'citations']], 
                    on='title_clean', 
                    how='left'
                )
                df = df.drop(columns=['title_clean'])

            # 5. Synthesize Author Object (Required for PostCard/PostModal rendering)
            def format_author(row):
                raw = row.get('authors', 'Anonymous')
                if pd.isna(raw) or not isinstance(raw, str):
                    name = 'Anonymous'
                else:
                    # Extract the first author's name
                    name = raw.replace(' and ', ', ').split(',')[0].strip()
                
                return {
                    "name": name,
                    "username": name.lower().replace(" ", "_"),
                    "avatar": None
                }
            df['author'] = df.apply(format_author, axis=1)

            # 6. Data cleaning and setting default values
            if 'likes_count_init' in df.columns:
                df['likes_count'] = df['likes_count_init'].fillna(0).astype(int)
            else:
                df['likes_count'] = 0
                
            df['saves_count'] = 0
            df['update_date'] = df['update_date'].fillna('2026-02-13')
            df['category'] = df['category'].fillna('General')
            
            if 'citations' in df.columns:
                df['citations'] = df['citations'].fillna(0).astype(int)
            else:
                df['citations'] = 0

            return df
        except Exception as e:
            print(f"DataManager Error: {e}")
            return pd.DataFrame()

    def load_json_file(self, filename, default_value):
        file_path = Path(filename)
        if file_path.exists():
            with file_path.open("r", encoding='utf-8') as f:
                try: 
                    return json.load(f)
                except: 
                    return default_value
        return default_value

    def save_interactions(self):
        with Path(INTERACTIONS_FILE).open("w", encoding='utf-8') as f:
            json.dump(self.interactions, f, indent=4)

    def save_comments(self):
        # ensure_ascii=False ensures that Emojis in comments are correctly saved in JSON
        with Path(COMMENTS_FILE).open("w", encoding='utf-8') as f:
            json.dump(self.comments, f, indent=4, ensure_ascii=False)

    def update_count(self, paper_id: str, field: str, delta: int):
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
