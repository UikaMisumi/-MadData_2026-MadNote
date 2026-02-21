
import pandas as pd
import os
import json

# File path configurations
CSV_PATH = "../xiaohongshu_full_topics.csv"
TITLES_ABSTRACTS_PATH = "../extracted_titles_abstracts.json"
KEYWORDS_PATH = "../keywords_with_keybert.json"
FINAL_POSTS_PATH = "../final_posts_en.json"
INTERACTIONS_FILE = "interactions.json"
COMMENTS_FILE = "comments.json"

class DataManager:
    def __init__(self):
        self.df = self.load_data()
        self.interactions = self.load_json_file(INTERACTIONS_FILE, {"likes": {}, "saves": {}})
        self.comments = self.load_json_file(COMMENTS_FILE, {})

    def load_data(self):
        """Merges multiple data sources, ensuring fields match the frontend UI mapping."""
        try:
            # 1. Base data on Keywords file (contains IDs and key points data)
            if not os.path.exists(KEYWORDS_PATH):
                print(f"Error: {KEYWORDS_PATH} not found.")
                return pd.DataFrame()
            
            with open(KEYWORDS_PATH, 'r', encoding='utf-8') as f:
                df = pd.DataFrame(json.load(f))
            df['id'] = df['id'].astype(str)
            # Map dynamic_keywords -> keywords (Frontend 'Key Points' section)
            df = df.rename(columns={'dynamic_keywords': 'keywords'})

            # 2. Merge AI Summary (TL;DR) - retrieved from final_posts_en.json's innovation field
            if os.path.exists(FINAL_POSTS_PATH):
                with open(FINAL_POSTS_PATH, 'r', encoding='utf-8') as f:
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
            if os.path.exists(TITLES_ABSTRACTS_PATH):
                with open(TITLES_ABSTRACTS_PATH, 'r', encoding='utf-8') as f:
                    abs_df = pd.DataFrame(json.load(f))
                # Match using titles (strip whitespace and convert to lowercase to improve match rate)
                abs_df['title_clean'] = abs_df['title'].str.strip().str.lower()
                df['title_clean'] = df['title'].str.strip().str.lower()
                
                df = df.merge(abs_df[['title_clean', 'abstract']], on='title_clean', how='left')
                df = df.drop(columns=['title_clean'])

            # 4. Merge Authors and Metadata - retrieved from xiaohongshu_full_topics.csv
            if os.path.exists(CSV_PATH):
                csv_df = pd.read_csv(CSV_PATH)
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
        if os.path.exists(filename):
            with open(filename, "r", encoding='utf-8') as f:
                try: 
                    return json.load(f)
                except: 
                    return default_value
        return default_value

    def save_interactions(self):
        with open(INTERACTIONS_FILE, "w", encoding='utf-8') as f:
            json.dump(self.interactions, f, indent=4)

    def save_comments(self):
        # ensure_ascii=False ensures that Emojis in comments are correctly saved in JSON
        with open(COMMENTS_FILE, "w", encoding='utf-8') as f:
            json.dump(self.comments, f, indent=4, ensure_ascii=False)

db_manager = DataManager()