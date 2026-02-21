from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI()

# 1. CORS Configuration: Allows your React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. File Path Settings
# This is a placeholder for your prepared data. 
# Make sure "mock_data.json" exists in the same 'backend' folder.
DATA_PATH = "mock_data.json"

def load_data():
    """Helper function to load your prepared paper data."""
    if os.path.exists(DATA_PATH):
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("Error: mock_data.json has invalid JSON format.")
            return []
    print(f"Warning: {DATA_PATH} not found. Returning empty list.")
    return []

# 3. API Endpoints

@app.get("/")
def home():
    """Health check endpoint."""
    return {"status": "Backend is running", "data_source": DATA_PATH}

@app.get("/api/v1/feed")
async def get_feed(
    page: int = Query(1, ge=1), 
    size: int = Query(10, ge=1, le=50)
):
    """
    Feed endpoint with Pagination.
    Adapts to your frontend's useInfiniteScroll logic.
    """
    all_papers = load_data()
    
    # Slicing logic for pagination
    start = (page - 1) * size
    end = start + size
    paged_items = all_papers[start:end]
    
    # Tell frontend if there's more to load
    has_more = end < len(all_papers)
    
    return {
        "items": paged_items,
        "page": page,
        "size": size,
        "has_more": has_more,
        "total": len(all_papers)
    }

@app.post("/api/v1/interact")
async def interact(interaction: dict):
    """
    Placeholder for user interactions (Like/Save).
    In the future, this will update your database.
    """
    print(f"Received interaction: {interaction}")
    return {"status": "success", "received": interaction}