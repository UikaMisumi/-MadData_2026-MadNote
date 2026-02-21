import json
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Match the frontend port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Placeholder path for your prepared data
DATA_PATH = "mock_data.json"

@app.get("/api/v1/feed")
async def get_feed():
    # Check if the placeholder file exists
    if os.path.exists(DATA_PATH):
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                return data
            except json.JSONDecodeError:
                return {"error": "Invalid JSON format in placeholder file"}
    
    # Fallback if the file is not yet created
    return [
        {
            "id": "placeholder-id",
            "title": "Waiting for real data...",
            "content": "The backend data file is not ready yet.",
            "author": {"name": "System"},
            "createdAt": "2024-01-01T00:00:00Z"
        }
    ]

@app.post("/api/v1/interact")
async def interact(item: dict):
    # Just a placeholder for interaction logic
    print(f"Received interaction: {item}")
    return {"status": "success"}