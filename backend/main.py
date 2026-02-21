from fastapi import FastAPI, Depends, HTTPException, Query, Header, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime
import uuid

# Internal Modules
import auth
from database import db_manager

app = FastAPI(title="MadNote API", version="v1")

# CORS Configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency: Auth Header Verification ---
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        # Decode JWT from auth.py logic
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = payload.get("sub")
        users = auth.load_users()
        return users.get(email)
    except Exception:
        return None

# --- Auth Routes ---
@app.post("/api/v1/auth/signup", status_code=201)
async def signup(user_info: dict):
    users = auth.load_users()
    if user_info['email'] in users:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = {
        "id": str(len(users) + 1),
        "email": user_info['email'],
        "password": auth.get_password_hash(user_info['password']),
        "name": user_info.get('name', 'New Scholar'),
        "username": user_info['email'].split('@')[0]
    }
    users[user_info['email']] = new_user
    auth.save_users(users)
    token = auth.create_access_token({"sub": new_user['email']})
    return {"user": new_user, "token": token}

@app.post("/api/v1/auth/login")
async def login(credentials: dict):
    users = auth.load_users()
    user = users.get(credentials['email'])
    if not user or not auth.verify_password(credentials['password'], user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token({"sub": user['email']})
    return {"user": user, "token": token}

# --- Paper & Feed Routes ---
@app.get("/api/v1/papers")
async def get_papers(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    category: Optional[str] = None,
    user=Depends(get_current_user)
):
    df = db_manager.df
    if category and category != "All":
        df = df[df['category'] == category]
    
    df = df.sort_values(by="update_date", ascending=False)
    total = len(df)
    start, end = (page - 1) * size, page * size
    items = df.iloc[start:end].to_dict(orient="records")
    
    # Inject personalized interaction status
    if user:
        u_id = user['id']
        liked = set(db_manager.interactions["likes"].get(u_id, []))
        saved = set(db_manager.interactions["saves"].get(u_id, []))
        for item in items:
            item["is_liked"] = item["id"] in liked
            item["is_saved"] = item["id"] in saved
            
    return {"items": items, "page": page, "has_more": end < total, "total": total}

@app.get("/api/v1/papers/search")
async def search_papers(q: str, page: int = 1, size: int = 10, user=Depends(get_current_user)):
    mask = (
        db_manager.df['title'].str.contains(q, case=False, na=False) | 
        db_manager.df['abstract'].str.contains(q, case=False, na=False)
    )
    results = db_manager.df[mask]
    start, end = (page-1)*size, page*size
    items = results.iloc[start:end].to_dict(orient="records")
    
    # Status injection for search results
    if user:
        u_id = user['id']
        liked = set(db_manager.interactions["likes"].get(u_id, []))
        for item in items:
            item["is_liked"] = item["id"] in liked

    return {"items": items, "total": len(results), "has_more": end < len(results)}

# --- Interaction Routes ---
@app.post("/api/v1/papers/{paper_id}/like")
async def toggle_like(paper_id: str, user=Depends(get_current_user)):
    if not user: raise HTTPException(status_code=401)
    u_id = user['id']
    likes = db_manager.interactions["likes"].get(u_id, [])
    
    status = False
    if paper_id in likes:
        likes.remove(paper_id)
    else:
        likes.append(paper_id)
        status = True
    
    db_manager.interactions["likes"][u_id] = likes
    db_manager.save_interactions()
    return {"liked": status}

# --- Comment Routes ---
@app.get("/api/v1/papers/{paper_id}/comments")
async def get_comments(paper_id: str):
    return db_manager.comments.get(paper_id, [])

@app.post("/api/v1/papers/{paper_id}/comments", status_code=201)
async def post_comment(paper_id: str, data: dict, user=Depends(get_current_user)):
    if not user: raise HTTPException(status_code=401)
    
    new_comment = {
        "id": str(uuid.uuid4()),
        "text": data["text"],
        "author": {"id": user["id"], "name": user["name"]},
        "created_at": datetime.utcnow().isoformat(),
        "replies": []
    }
    
    if paper_id not in db_manager.comments:
        db_manager.comments[paper_id] = []
    
    db_manager.comments[paper_id].append(new_comment)
    db_manager.save_comments()
    return new_comment

@app.get("/api/v1/categories")
async def get_categories():
    return sorted(db_manager.df['category'].dropna().unique().tolist())