from fastapi import FastAPI, Depends, HTTPException, status, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import auth
from database import db_manager

app = FastAPI(title="MadNote API", version="v1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper for Auth ---
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = payload.get("sub")
        users = auth.load_users()
        return users.get(email)
    except auth.JWTError:
        return None

# --- Auth Endpoints ---
@app.post("/api/v1/auth/signup")
async def signup(user_data: dict):
    users = auth.load_users()
    if user_data['email'] in users:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = {
        "id": str(len(users) + 1),
        "email": user_data['email'],
        "password": auth.get_password_hash(user_data['password']),
        "name": user_data.get('name', 'New Scholar'),
        "username": user_data['email'].split('@')[0],
        "avatar": None,
        "bio": None
    }
    users[user_data['email']] = new_user
    auth.save_users(users)
    token = auth.create_access_token(data={"sub": new_user['email']})
    return {"user": new_user, "token": token}

@app.post("/api/v1/auth/login")
async def login(credentials: dict):
    users = auth.load_users()
    user = users.get(credentials['email'])
    if not user or not auth.verify_password(credentials['password'], user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token(data={"sub": user['email']})
    return {"user": user, "token": token}

# --- Paper Endpoints ---
@app.get("/api/v1/papers")
async def get_papers(page: int = 1, size: int = 10, category: str = None, user=Depends(get_current_user)):
    df = db_manager.df
    if category:
        df = df[df['category'] == category]
    
    df = df.sort_values(by="update_date", ascending=False)
    total = len(df)
    start, end = (page-1)*size, page*size
    items = df.iloc[start:end].to_dict(orient="records")
    
    # Inject is_liked/is_saved
    if user:
        user_id = user['id']
        liked_ids = db_manager.interactions["likes"].get(user_id, [])
        saved_ids = db_manager.interactions["saves"].get(user_id, [])
        for item in items:
            item["is_liked"] = item["id"] in liked_ids
            item["is_saved"] = item["id"] in saved_ids

    return {"items": items, "page": page, "size": size, "has_more": end < total, "total": total}

@app.get("/api/v1/papers/search")
async def search_papers(q: str, page: int = 1, size: int = 10):
    mask = db_manager.df['title'].str.contains(q, case=False, na=False) | \
           db_manager.df['abstract'].str.contains(q, case=False, na=False)
    results = db_manager.df[mask]
    start, end = (page-1)*size, page*size
    return {"items": results.iloc[start:end].to_dict(orient="records"), "total": len(results)}

# --- Interaction Endpoints ---
@app.post("/api/v1/papers/{paper_id}/like")
async def toggle_like(paper_id: str, user=Depends(get_current_user)):
    if not user: raise HTTPException(status_code=401)
    user_id = user['id']
    likes = db_manager.interactions["likes"].get(user_id, [])
    
    if paper_id in likes:
        likes.remove(paper_id)
        status = False
    else:
        likes.append(paper_id)
        status = True
    
    db_manager.interactions["likes"][user_id] = likes
    db_manager.save_interactions()
    return {"liked": status}

@app.get("/")
def health():
    return {"status": "Academic Red backend ready", "spec_version": "v1"}