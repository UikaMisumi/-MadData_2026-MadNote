from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
import auth
from database import db_manager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get current user from JWT token
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = payload.get("sub")
        users = auth.load_users()
        return users.get(email)
    except:
        return None

@app.post("/api/v1/auth/signup")
async def signup(user_info: dict):
    users = auth.load_users()
    if user_info['email'] in users:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_pw = auth.get_password_hash(user_info['password'])
    new_user = {
        "id": str(len(users) + 1),
        "email": user_info['email'],
        "password": hashed_pw,
        "name": user_info.get('name', 'New Scholar')
    }
    users[user_info['email']] = new_user
    auth.save_users(users)
    token = auth.create_access_token({"sub": new_user['email']})
    return {"user": new_user, "token": token}

@app.get("/api/v1/papers")
async def get_papers(page: int = 1, size: int = 10, user=Depends(get_current_user)):
    df = db_manager.df.sort_values(by="update_date", ascending=False)
    start, end = (page-1)*size, page*size
    items = df.iloc[start:end].to_dict(orient="records")
    
    # Inject user-specific like status
    if user:
        user_likes = db_manager.interactions["likes"].get(user['id'], [])
        for item in items:
            item["is_liked"] = item["id"] in user_likes

    return {"items": items, "has_more": end < len(df)}