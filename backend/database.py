import pandas as pd
import os
import json

# Paths configuration
CSV_PATH = "../xiaohongshu_full_topics.csv"
TITLES_ABSTRACTS_PATH = "../extracted_titles_abstracts.json"
KEYWORDS_PATH = "../keywords_with_keybert.json"
INTERACTIONS_FILE = "interactions.json"
COMMENTS_FILE = "comments.json"

class DataManager:
    def __init__(self):
        self.df = self.load_data()
        self.interactions = self.load_json_file(INTERACTIONS_FILE, {"likes": {}, "saves": {}})
        self.comments = self.load_json_file(COMMENTS_FILE, {})

    def load_data(self):
        """Merges CSV, extended abstracts, and KeyBERT keywords into a single DataFrame."""
        try:
            # 1. Load Keywords (Main source for IDs)
            if not os.path.exists(KEYWORDS_PATH):
                print(f"Critical Error: {KEYWORDS_PATH} not found.")
                return pd.DataFrame()
            
            with open(KEYWORDS_PATH, 'r', encoding='utf-8') as f:
                kw_data = json.load(f)
            df = pd.DataFrame(kw_data)
            df['id'] = df['id'].astype(str)
            # rename dynamic_keywords to keywords for API consistency
            df = df.rename(columns={'dynamic_keywords': 'keywords'})

            # 2. Load and Merge CSV (For authors, categories, citations)
            if os.path.exists(CSV_PATH):
                csv_df = pd.read_csv(CSV_PATH)
                # Join on 'title' as IDs might not exist in original CSV
                df = df.merge(
                    csv_df[['title', 'authors', 'category', 'update_date', 'citations']], 
                    on='title', 
                    how='left'
                )

            # 3. Load and Merge Detailed Abstracts
            if os.path.exists(TITLES_ABSTRACTS_PATH):
                with open(TITLES_ABSTRACTS_PATH, 'r', encoding='utf-8') as f:
                    abs_data = json.load(f)
                abs_df = pd.DataFrame(abs_data)
                # Merge based on title
                df = df.merge(abs_df[['title', 'abstract']], on='title', how='left', suffixes=('_csv', ''))
                # If extended abstract exists, use it; otherwise use CSV abstract
                if 'abstract_csv' in df.columns:
                    df['abstract'] = df['abstract'].fillna(df['abstract_csv'])
                    df = df.drop(columns=['abstract_csv'])

            # 4. Data Refinement & Author Synthesis
            # Map 'innovation' logic or other placeholders if needed
            df['ai_summary'] = df['abstract'].apply(lambda x: str(x)[:200] + "..." if pd.notnull(x) else "")

            def format_author(row):
                raw = row.get('authors', 'Anonymous')
                # Basic parsing for "First Author, Second Author" or "Author and Author"
                if isinstance(raw, str):
                    name = raw.replace(' and ', ', ').split(',')[0].strip()
                else:
                    name = 'Anonymous'
                
                return {
                    "name": name,
                    "username": name.lower().replace(" ", "_"),
                    "avatar": None
                }
            
            df['author'] = df.apply(format_author, axis=1)

            # 5. Global interaction counts defaults
            df['likes_count'] = 0
            df['saves_count'] = 0
            
            # Ensure update_date exists
            df['update_date'] = df['update_date'].fillna('2026-02-13')

            print(f"Database initialized with {len(df)} papers.")
            return df

        except Exception as e:
            print(f"Data merge error: {e}")
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
        # UTF-8 is critical for supporting Emojis sent from the frontend
        with open(COMMENTS_FILE, "w", encoding='utf-8') as f:
            json.dump(self.comments, f, indent=4, ensure_ascii=False)

db_manager = DataManager()