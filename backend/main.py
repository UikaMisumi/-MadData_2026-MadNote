from datetime import datetime
import uuid

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Internal Modules
try:
    # Package import path: `python -m uvicorn backend.main:app`
    from . import auth
    from .database import db_manager
except ImportError:
    # Script import path fallback
    import auth
    from database import db_manager

app = FastAPI(title="MadNote API", version="v1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def sanitize_user(user: dict | None):
    if not user:
        return None
    safe = dict(user)
    safe.pop("password", None)
    safe.setdefault("avatar", None)
    safe.setdefault("bio", "")
    safe.setdefault("following_count", 0)
    safe.setdefault("followers_count", 0)
    safe.setdefault("username", safe.get("email", "user").split("@")[0])
    safe.setdefault("name", "User")
    return safe


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1]
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = payload.get("sub")
        users = auth.load_users()
        return users.get(email)
    except Exception:
        return None


def require_user(user):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


def find_user_by_id(user_id: str):
    users = auth.load_users()
    for email, user in users.items():
        if str(user.get("id")) == str(user_id):
            return email, user, users
    return None, None, users


def inject_interaction_status(item: dict, user: dict | None):
    item.setdefault("is_liked", False)
    item.setdefault("is_saved", False)
    item.setdefault("likes_count", int(item.get("likes_count", 0) or 0))
    item.setdefault("saves_count", int(item.get("saves_count", 0) or 0))

    if not user:
        return item

    user_id = str(user.get("id"))
    liked_ids = set(db_manager.interactions.get("likes", {}).get(user_id, []))
    saved_ids = set(db_manager.interactions.get("saves", {}).get(user_id, []))
    item["is_liked"] = str(item.get("id")) in liked_ids
    item["is_saved"] = str(item.get("id")) in saved_ids
    return item


def paginate_df(df, page: int, size: int):
    total = len(df)
    start = (page - 1) * size
    end = page * size
    chunk = df.iloc[start:end]
    return chunk, total, end < total


@app.get("/")
async def health_check():
    return {"status": "ok", "rows": int(len(db_manager.df))}


# --- Auth Routes ---
@app.post("/api/v1/auth/signup", status_code=201)
async def signup(user_info: dict):
    email = str(user_info.get("email", "")).strip()
    password = str(user_info.get("password", ""))

    if not email or not password:
        raise HTTPException(status_code=422, detail="email and password are required")

    users = auth.load_users()
    if email in users:
        raise HTTPException(status_code=400, detail="Email already registered")

    display_name = str(user_info.get("name") or "").strip() or email.split("@")[0]
    username = display_name.lower().replace(" ", "_")

    new_user = {
        "id": str(len(users) + 1),
        "email": email,
        "password": auth.get_password_hash(password),
        "name": display_name,
        "username": username,
        "avatar": None,
        "bio": "",
        "following_count": 0,
        "followers_count": 0,
    }

    users[email] = new_user
    auth.save_users(users)
    token = auth.create_access_token({"sub": email})
    return {"user": sanitize_user(new_user), "token": token}


@app.post("/api/v1/auth/login")
async def login(credentials: dict):
    email = str(credentials.get("email", "")).strip()
    password = str(credentials.get("password", ""))

    users = auth.load_users()
    user = users.get(email)
    if not user or not auth.verify_password(password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token({"sub": user["email"]})
    return {"user": sanitize_user(user), "token": token}


@app.post("/api/v1/auth/logout")
async def logout(_: dict = Depends(get_current_user)):
    return {"success": True}


# --- Paper & Feed Routes ---
@app.get("/api/v1/papers")
async def get_papers(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    category: str | None = None,
    user=Depends(get_current_user),
):
    df = db_manager.df.copy()
    if df.empty:
        return {"items": [], "page": page, "size": size, "has_more": False, "total": 0}

    if category and category != "All":
        df = df[df["category"] == category]

    if "update_date" in df.columns:
        df = df.sort_values(by="update_date", ascending=False)

    chunk, total, has_more = paginate_df(df, page, size)
    items = chunk.to_dict(orient="records")
    items = [inject_interaction_status(item, user) for item in items]

    return {"items": items, "page": page, "size": size, "has_more": has_more, "total": total}


@app.get("/api/v1/papers/search")
async def search_papers(
    q: str,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    user=Depends(get_current_user),
):
    df = db_manager.df.copy()
    if df.empty:
        return {"items": [], "page": page, "size": size, "has_more": False, "total": 0}

    q = (q or "").strip()
    if not q:
        return {"items": [], "page": page, "size": size, "has_more": False, "total": 0}

    title_mask = df["title"].astype(str).str.contains(q, case=False, na=False)
    abstract_mask = df["abstract"].astype(str).str.contains(q, case=False, na=False)
    author_mask = df["authors"].astype(str).str.contains(q, case=False, na=False)

    results = df[title_mask | abstract_mask | author_mask]
    chunk, total, has_more = paginate_df(results, page, size)
    items = chunk.to_dict(orient="records")
    items = [inject_interaction_status(item, user) for item in items]

    return {"items": items, "page": page, "size": size, "has_more": has_more, "total": total}


@app.get("/api/v1/papers/{paper_id}")
async def get_paper(paper_id: str, user=Depends(get_current_user)):
    df = db_manager.df
    if df.empty:
        raise HTTPException(status_code=404, detail="Paper not found")

    rows = df[df["id"] == str(paper_id)]
    if rows.empty:
        raise HTTPException(status_code=404, detail="Paper not found")

    item = rows.iloc[0].to_dict()
    return inject_interaction_status(item, user)


@app.get("/api/v1/recommendations")
async def recommendations(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    user=Depends(get_current_user),
):
    # Baseline: fallback to feed ordering. Personal ranking can be added later.
    return await get_papers(page=page, size=size, category=None, user=user)


# --- Interaction Routes ---
@app.post("/api/v1/papers/{paper_id}/like")
async def toggle_like(paper_id: str, user=Depends(get_current_user)):
    user = require_user(user)

    user_id = str(user["id"])
    likes_map = db_manager.interactions.setdefault("likes", {})
    liked_ids = likes_map.get(user_id, [])

    if paper_id in liked_ids:
        liked_ids.remove(paper_id)
        liked = False
        likes_count = db_manager.update_count(paper_id, "likes_count", -1)
    else:
        liked_ids.append(paper_id)
        liked = True
        likes_count = db_manager.update_count(paper_id, "likes_count", +1)

    likes_map[user_id] = liked_ids
    db_manager.save_interactions()
    return {"liked": liked, "likes_count": likes_count}


@app.post("/api/v1/papers/{paper_id}/save")
async def toggle_save(paper_id: str, user=Depends(get_current_user)):
    user = require_user(user)

    user_id = str(user["id"])
    saves_map = db_manager.interactions.setdefault("saves", {})
    saved_ids = saves_map.get(user_id, [])

    if paper_id in saved_ids:
        saved_ids.remove(paper_id)
        saved = False
        saves_count = db_manager.update_count(paper_id, "saves_count", -1)
    else:
        saved_ids.append(paper_id)
        saved = True
        saves_count = db_manager.update_count(paper_id, "saves_count", +1)

    saves_map[user_id] = saved_ids
    db_manager.save_interactions()
    return {"saved": saved, "saves_count": saves_count}


@app.get("/api/v1/papers/{paper_id}/interaction")
async def get_interaction(paper_id: str, user=Depends(get_current_user)):
    user = require_user(user)

    user_id = str(user["id"])
    liked = paper_id in db_manager.interactions.get("likes", {}).get(user_id, [])
    saved = paper_id in db_manager.interactions.get("saves", {}).get(user_id, [])
    return {"liked": liked, "saved": saved}


# --- User Routes ---
@app.get("/api/v1/users/{user_id}")
async def get_user_profile(user_id: str):
    _, user, _ = find_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return sanitize_user(user)


@app.put("/api/v1/users/{user_id}")
async def update_user_profile(user_id: str, payload: dict, user=Depends(get_current_user)):
    user = require_user(user)
    if str(user.get("id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Cannot edit another user")

    email, target_user, users = find_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    for key in ["name", "username", "bio", "avatar"]:
        if key in payload:
            target_user[key] = payload[key]

    users[email] = target_user
    auth.save_users(users)
    return sanitize_user(target_user)


@app.put("/api/v1/users/{user_id}/password")
async def update_password(user_id: str, payload: dict, user=Depends(get_current_user)):
    user = require_user(user)
    if str(user.get("id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Cannot edit another user")

    old_password = str(payload.get("old_password", ""))
    new_password = str(payload.get("new_password", ""))
    if not old_password or not new_password:
        raise HTTPException(status_code=422, detail="old_password and new_password are required")

    email, target_user, users = find_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not auth.verify_password(old_password, target_user.get("password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    target_user["password"] = auth.get_password_hash(new_password)
    users[email] = target_user
    auth.save_users(users)
    return {"success": True}


@app.get("/api/v1/users/{user_id}/liked")
async def get_liked_papers(
    user_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    user=Depends(get_current_user),
):
    user = require_user(user)
    if str(user.get("id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Cannot read another user's liked papers")

    ids = list(reversed(db_manager.interactions.get("likes", {}).get(str(user_id), [])))
    id_to_row = {str(row["id"]): row for row in db_manager.df.to_dict(orient="records")}
    items_all = [inject_interaction_status(dict(id_to_row[i]), user) for i in ids if i in id_to_row]

    total = len(items_all)
    start = (page - 1) * size
    end = page * size
    items = items_all[start:end]
    return {"items": items, "page": page, "size": size, "has_more": end < total, "total": total}


@app.get("/api/v1/users/{user_id}/saved")
async def get_saved_papers(
    user_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    user=Depends(get_current_user),
):
    user = require_user(user)
    if str(user.get("id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Cannot read another user's saved papers")

    ids = list(reversed(db_manager.interactions.get("saves", {}).get(str(user_id), [])))
    id_to_row = {str(row["id"]): row for row in db_manager.df.to_dict(orient="records")}
    items_all = [inject_interaction_status(dict(id_to_row[i]), user) for i in ids if i in id_to_row]

    total = len(items_all)
    start = (page - 1) * size
    end = page * size
    items = items_all[start:end]
    return {"items": items, "page": page, "size": size, "has_more": end < total, "total": total}


# --- Comment Routes ---
@app.get("/api/v1/papers/{paper_id}/comments")
async def get_comments(paper_id: str):
    return db_manager.comments.get(paper_id, [])


@app.post("/api/v1/papers/{paper_id}/comments", status_code=201)
async def post_comment(paper_id: str, data: dict, user=Depends(get_current_user)):
    user = require_user(user)

    text = str(data.get("text", "")).strip()
    if not text:
        raise HTTPException(status_code=422, detail="text is required")

    new_comment = {
        "id": str(uuid.uuid4()),
        "paper_id": paper_id,
        "text": text,
        "author": {
            "id": user["id"],
            "name": user.get("name", "User"),
            "avatar": user.get("avatar"),
        },
        "likes_count": 0,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "replies": [],
    }

    db_manager.comments.setdefault(paper_id, []).append(new_comment)
    db_manager.save_comments()
    return new_comment


@app.post("/api/v1/papers/{paper_id}/comments/{comment_id}/replies", status_code=201)
async def post_reply(paper_id: str, comment_id: str, data: dict, user=Depends(get_current_user)):
    user = require_user(user)
    text = str(data.get("text", "")).strip()
    if not text:
        raise HTTPException(status_code=422, detail="text is required")

    comments = db_manager.comments.get(paper_id, [])
    parent = next((c for c in comments if c.get("id") == comment_id), None)
    if not parent:
        raise HTTPException(status_code=404, detail="Comment not found")

    reply = {
        "id": str(uuid.uuid4()),
        "paper_id": paper_id,
        "text": text,
        "author": {
            "id": user["id"],
            "name": user.get("name", "User"),
            "avatar": user.get("avatar"),
        },
        "likes_count": 0,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "replies": [],
    }

    parent.setdefault("replies", []).append(reply)
    db_manager.save_comments()
    return reply


@app.delete("/api/v1/papers/{paper_id}/comments/{comment_id}")
async def delete_comment(paper_id: str, comment_id: str, user=Depends(get_current_user)):
    user = require_user(user)
    comments = db_manager.comments.get(paper_id, [])

    # Try top-level delete first.
    for i, comment in enumerate(comments):
        if comment.get("id") == comment_id:
            if str(comment.get("author", {}).get("id")) != str(user.get("id")):
                raise HTTPException(status_code=403, detail="Not your comment")
            comments.pop(i)
            db_manager.save_comments()
            return {"success": True}

    # Try reply delete.
    for comment in comments:
        replies = comment.get("replies", [])
        for i, reply in enumerate(replies):
            if reply.get("id") == comment_id:
                if str(reply.get("author", {}).get("id")) != str(user.get("id")):
                    raise HTTPException(status_code=403, detail="Not your comment")
                replies.pop(i)
                db_manager.save_comments()
                return {"success": True}

    raise HTTPException(status_code=404, detail="Comment not found")


@app.get("/api/v1/categories")
async def get_categories():
    if db_manager.df.empty or "category" not in db_manager.df.columns:
        return []
    return sorted(db_manager.df["category"].dropna().astype(str).unique().tolist())
