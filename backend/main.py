from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow your React frontend (port 5173) to access this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "Academic Red backend is running"}

@app.get("/api/v1/feed")
async def get_feed():
    # Mock data for academic paper cards
    return [
        {
            "id": "arxiv_001",
            "title": "DeepSeek-V3 Technical Report Analysis",
            "summary": "A comprehensive breakdown of the latest DeepSeek-V3 architecture, focusing on its Mixture-of-Experts (MoE) optimization...",
            "cover_image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500",
            "tags": ["LLM", "DeepSeek", "AI"],
            "author": "arXiv:2412.19437",
            "recommend_reason": "Based on your interest in Large Language Models"
        },
        {
            "id": "arxiv_002",
            "title": "Why Retrieval-Augmented Generation (RAG) Matters",
            "summary": "RAG combines search technology with LLMs to reduce hallucinations and provide up-to-date knowledge...",
            "cover_image": "https://images.unsplash.com/photo-1620712943543-bcc4628c7215?w=500",
            "tags": ["RAG", "Knowledge Base"],
            "author": "arXiv:2312.0001",
            "recommend_reason": "Trending in Computer Science"
        }
    ]