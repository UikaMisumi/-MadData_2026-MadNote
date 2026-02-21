import pandas as pd
import os
import json

# Paths relative to the backend folder
# Ensure final_posts_en.json is in the project root directory
JSON_PATH = "../final_posts_en.json"
INTERACTIONS_FILE = "interactions.json"
COMMENTS_FILE = "comments.json"

class DataManager:
    def __init__(self):
        self.df = self.load_data()
        self.interactions = self.load_json_file(INTERACTIONS_FILE, {"likes": {}, "saves": {}})
        self.comments = self.load_json_file(COMMENTS_FILE, {})

    def load_data(self):
        """Loads and adapts the enriched JSON data for the API."""
        if not os.path.exists(JSON_PATH):
            print(f"Error: {JSON_PATH} not found. Please ensure it is in the root directory.")
            return pd.DataFrame()
        
        try:
            with open(JSON_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            df = pd.DataFrame(data)
            
            # Map JSON fields to match our API Specification
            # display_title -> title
            # social_content -> abstract (for compatibility with existing frontend logic)
            # innovation -> ai_summary
            df = df.rename(columns={
                'display_title': 'title',
                'social_content': 'abstract',
                'innovation': 'ai_summary'
            })
            
            # Ensure ID is a string (e.g., "paper-0")
            df['id'] = df['id'].astype(str)
            
            # Ensure numeric fields have defaults if they are missing
            if 'likesCount' in df.columns:
                df['likes_count'] = df['likesCount'].fillna(0).astype(int)
            else:
                df['likes_count'] = 0
                
            return df
        except Exception as e:
            print(f"Error loading JSON data: {e}")
            return pd.DataFrame()

    def load_json_file(self, filename, default_value):
        """Helper to load local JSON storage files for users and comments."""
        if os.path.exists(filename):
            with open(filename, "r", encoding='utf-8') as f:
                try:
                    return json.load(f)
                except json.JSONDecodeError:
                    return default_value
        return default_value

    def save_interactions(self):
        """Persists user likes and saves to interactions.json."""
        with open(INTERACTIONS_FILE, "w", encoding='utf-8') as f:
            json.dump(self.interactions, f, indent=4)

    def save_comments(self):
        """Persists nested comments to comments.json."""
        with open(COMMENTS_FILE, "w", encoding='utf-8') as f:
            json.dump(self.comments, f, indent=4)

# Global singleton instance
db_manager = DataManager()