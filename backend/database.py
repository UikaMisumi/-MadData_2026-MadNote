import pandas as pd
import os
import json

# Path configuration
JSON_PATH = "../final_posts_en.json"
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
        """Loads and merges data from multiple JSON sources."""
        if not os.path.exists(JSON_PATH):
            print(f"Error: {JSON_PATH} not found.")
            return pd.DataFrame()
        
        try:
            # Load main data
            with open(JSON_PATH, 'r', encoding='utf-8') as f:
                main_data = json.load(f)
            df = pd.DataFrame(main_data)

            # Load and merge abstracts from extracted_titles_abstracts.json
            if os.path.exists(TITLES_ABSTRACTS_PATH):
                with open(TITLES_ABSTRACTS_PATH, 'r', encoding='utf-8') as f:
                    abstracts_data = json.load(f)
                # Assuming abstracts_data is a list of dicts with 'id' or 'title'
                abs_df = pd.DataFrame(abstracts_data)
                if 'abstract' in abs_df.columns:
                    # Merge on 'id' if exists, otherwise you might need to map by title
                    df = df.merge(abs_df[['id', 'abstract']], on='id', how='left', suffixes=('', '_new'))
                    df['abstract'] = df['abstract_new'].fillna(df.get('social_content', ''))
            
            # Load and merge keywords from keywords_with_keybert.json
            if os.path.exists(KEYWORDS_PATH):
                with open(KEYWORDS_PATH, 'r', encoding='utf-8') as f:
                    keywords_data = json.load(f)
                # Map keywords to the dataframe using 'id'
                kw_df = pd.DataFrame(list(keywords_data.items()), columns=['id', 'keywords'])
                df = df.merge(kw_df, on='id', how='left')

            # Field Mapping & Stabilization
            df = df.rename(columns={
                'display_title': 'title',
                'innovation': 'ai_summary'
            })
            df['id'] = df['id'].astype(str)

            # Author Synthesis
            def format_author(row):
                raw_authors = row.get('authors', 'Anonymous')
                first_author = raw_authors[0] if isinstance(raw_authors, list) and len(raw_authors) > 0 else str(raw_authors).split(',')[0]
                return {
                    "name": first_author,
                    "username": first_author.lower().replace(" ", "_"),
                    "avatar": None
                }
            df['author'] = df.apply(format_author, axis=1)

            # Interaction Counts
            df['likes_count'] = df.get('likesCount', 0).fillna(0).astype(int)
            df['saves_count'] = df.get('savesCount', 0).fillna(0).astype(int)
            
            return df
        except Exception as e:
            print(f"Error loading data: {e}")
            return pd.DataFrame()

    def load_json_file(self, filename, default_value):
        if os.path.exists(filename):
            with open(filename, "r", encoding='utf-8') as f:
                try: return json.load(f)
                except: return default_value
        return default_value

    def save_interactions(self):
        with open(INTERACTIONS_FILE, "w", encoding='utf-8') as f:
            json.dump(self.interactions, f, indent=4)

    def save_comments(self):
        with open(COMMENTS_FILE, "w", encoding='utf-8') as f:
            json.dump(self.comments, f, indent=4)

db_manager = DataManager()