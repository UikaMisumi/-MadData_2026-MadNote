import pandas as pd
import os
import json

CSV_PATH = "../xiaohongshu_full_topics.csv"
INTERACTIONS_PATH = "interactions.json"

class DataManager:
    def __init__(self):
        self.df = self.load_data()
        self.interactions = self.load_interactions()

    def load_data(self):
        if not os.path.exists(CSV_PATH):
            return pd.DataFrame(columns=["title", "abstract", "authors", "category", "update_date", "text_for_embedding"])
        
        df = pd.read_csv(CSV_PATH)
        df['id'] = df.index.astype(str)
        # Convert authors string to list
        df['authors'] = df['authors'].fillna("").apply(
            lambda x: [a.strip() for a in str(x).split(',') if a.strip()]
        )
        df['citations'] = df.get('citations', 0).fillna(0).astype(int)
        df['likes_count'] = 0
        df['saves_count'] = 0
        df['ai_summary'] = None 
        # Mock image logic
        df['image_url'] = "https://picsum.photos/400/600?random=" + df['id']
        return df

    def load_interactions(self):
        if os.path.exists(INTERACTIONS_PATH):
            with open(INTERACTIONS_PATH, "r") as f:
                return json.load(f)
        return {"likes": {}, "saves": {}} # Format: {"likes": {"user_id": ["paper_id", ...]}}

    def save_interactions(self):
        with open(INTERACTIONS_PATH, "w") as f:
            json.dump(self.interactions, f)

    def get_paper_by_id(self, paper_id: str):
        paper = self.df[self.df['id'] == paper_id]
        return paper.iloc[0].to_dict() if not paper.empty else None

db_manager = DataManager()