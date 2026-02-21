import pandas as pd
import os
import json

# Paths relative to the backend folder
CSV_PATH = "../xiaohongshu_full_topics.csv"
INTERACTIONS_FILE = "interactions.json"
COMMENTS_FILE = "comments.json"

class DataManager:
    def __init__(self):
        self.df = self.load_data()
        self.interactions = self.load_json_file(INTERACTIONS_FILE, {"likes": {}, "saves": {}})
        self.comments = self.load_json_file(COMMENTS_FILE, {})

    def load_data(self):
        """Loads and cleans the central CSV paper repository."""
        if not os.path.exists(CSV_PATH):
            print(f"Critical Error: {CSV_PATH} not found.")
            return pd.DataFrame(columns=["id", "title", "abstract", "authors", "category", "update_date"])
        
        df = pd.read_csv(CSV_PATH)
        # Assign stable string IDs based on row index
        df['id'] = df.index.astype(str)
        # Parse authors string into a list for frontend chips
        df['authors'] = df['authors'].fillna("").apply(
            lambda x: [a.strip() for a in str(x).split(',') if a.strip()]
        )
        # Ensure numeric fields exist
        df['citations'] = df.get('citations', 0).fillna(0).astype(int)
        # Placeholder for AI summary (populated by enrichment script)
        if 'ai_summary' not in df.columns:
            df['ai_summary'] = None
            
        return df

    def load_json_file(self, filename, default_value):
        """Helper to load local JSON storage files."""
        if os.path.exists(filename):
            with open(filename, "r") as f:
                try:
                    return json.load(f)
                except json.JSONDecodeError:
                    return default_value
        return default_value

    def save_interactions(self):
        with open(INTERACTIONS_FILE, "w") as f:
            json.dump(self.interactions, f, indent=4)

    def save_comments(self):
        with open(COMMENTS_FILE, "w") as f:
            json.dump(self.comments, f, indent=4)

# Global instance
db_manager = DataManager()