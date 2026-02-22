from datetime import datetime
import math
import uuid

from fastapi import Cookie, Depends, FastAPI, Header, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
import json

# database module access (for DATA_DIR)
try:
    from . import database as db_module  # type: ignore
except Exception:
    import database as db_module  # type: ignore

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

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
AUTH_COOKIE_NAME = "madnote_token"

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


async def get_current_user(
    authorization: str = Header(None),
    cookie_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif cookie_token:
        token = cookie_token

    if not token:
        return None

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


def _norm_text(value: str | None):
    return str(value or "").strip().lower()


def _norm_set(values):
    normalized = set()
    for value in values or []:
        text = _norm_text(value)
        if text:
            normalized.add(text)
    return normalized


def _normalize_keyword_label(value: str | None):
    text = str(value or "").strip()
    if not text:
        return ""
    return " ".join(text.split()).lower()


def _display_keyword_label(value: str):
    words = [w for w in str(value or "").split() if w]
    if not words:
        return ""
    return " ".join([w.upper() if len(w) <= 3 else w.capitalize() for w in words])


def _topic_default_keywords(topic: str):
    key = _norm_text(topic)
    fallback_map = {
        "hci": ["Human Computer Interaction", "User Study", "UX", "Crowdsourcing", "Social Computing", "Accessibility"],
        "robotics": ["Robot Learning", "Manipulation", "Vision Language", "Embodied AI", "Navigation", "Control Policy"],
        "foundation models": ["Large Language Model", "Reasoning", "Instruction Tuning", "Alignment", "Multimodal", "Agent"],
        "ai for science": ["Molecular Dynamics", "Protein Design", "Scientific Discovery", "Bioinformatics", "Medical AI", "Materials"],
        "nlp & ir": ["Retrieval", "Information Extraction", "Summarization", "Question Answering", "Cross Lingual", "Benchmark"],
    }
    return fallback_map.get(key, ["Machine Learning", "Deep Learning", "Neural Network", "Optimization", "Benchmark", "Evaluation"])


def _collect_topic_keywords(primary_topic: str, secondary_topics: list[str], limit: int = 12):
    df = db_manager.df
    if df.empty:
        return []

    topic_keys = _norm_set([primary_topic, *(secondary_topics or [])])
    if not topic_keys:
        return []

    scores: dict[str, float] = {}
    labels: dict[str, str] = {}

    for row in df.to_dict(orient="records"):
        row_topics = {_norm_text(row.get("category"))}
        for tag in row.get("tags") or []:
            row_topics.add(_norm_text(tag))
        row_topics = {t for t in row_topics if t}
        if not row_topics:
            continue

        overlap = row_topics.intersection(topic_keys)
        if not overlap:
            continue

        # Primary topic carries stronger signal.
        row_weight = 0.0
        for key in overlap:
            row_weight += 1.2 if key == _norm_text(primary_topic) else 0.8

        for kw in row.get("keywords") or []:
            normalized = _normalize_keyword_label(kw)
            if not normalized:
                continue
            scores[normalized] = scores.get(normalized, 0.0) + row_weight
            if normalized not in labels:
                labels[normalized] = _display_keyword_label(str(kw))

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    items = [labels[k] for k, _ in ranked[: max(1, min(30, int(limit)))]]
    if items:
        return items

    fallback = _topic_default_keywords(primary_topic)
    return fallback[: max(1, min(30, int(limit)))]


def _collect_keyword_expansion(
    primary_topic: str,
    secondary_topics: list[str],
    seed_keywords: list[str],
    limit: int = 10,
):
    df = db_manager.df
    if df.empty:
        return _topic_default_keywords(primary_topic)[: max(1, min(30, int(limit)))]

    topic_keys = _norm_set([primary_topic, *(secondary_topics or [])])
    seed_norm = _norm_set(seed_keywords)
    if not seed_norm:
        return _collect_topic_keywords(primary_topic, secondary_topics, limit=limit)

    scores: dict[str, float] = {}
    labels: dict[str, str] = {}

    for row in df.to_dict(orient="records"):
        row_topics = {_norm_text(row.get("category"))}
        for tag in row.get("tags") or []:
            row_topics.add(_norm_text(tag))
        row_topics = {t for t in row_topics if t}

        row_keywords_raw = row.get("keywords") or []
        row_keywords_norm = [_normalize_keyword_label(k) for k in row_keywords_raw if _normalize_keyword_label(k)]
        if not row_keywords_norm:
            continue

        has_topic_match = bool(row_topics.intersection(topic_keys)) if topic_keys else True
        seed_overlap = [kw for kw in row_keywords_norm if kw in seed_norm or any(s in kw or kw in s for s in seed_norm)]
        if not has_topic_match and not seed_overlap:
            continue

        weight = 1.0 + 0.4 * len(seed_overlap)
        for kw_raw, kw_norm in zip(row_keywords_raw, row_keywords_norm):
            if kw_norm in seed_norm:
                continue
            scores[kw_norm] = scores.get(kw_norm, 0.0) + weight
            if kw_norm not in labels:
                labels[kw_norm] = _display_keyword_label(str(kw_raw))

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    items = [labels[k] for k, _ in ranked[: max(1, min(30, int(limit)))]]
    if items:
        return items
    return _topic_default_keywords(primary_topic)[: max(1, min(30, int(limit)))]


def _topic_match_score(primary_topic: str, secondary_topics: list[str], row: dict):
    primary = _norm_text(primary_topic)
    secondary = _norm_set(secondary_topics)
    row_topics = set()
    row_topics.add(_norm_text(row.get("category")))
    for tag in row.get("tags") or []:
        row_topics.add(_norm_text(tag))
    row_topics = {v for v in row_topics if v}

    if not primary and not secondary:
        return 0.0

    primary_hit = 1.0 if primary and primary in row_topics else 0.0
    secondary_hit = 0.0
    if secondary:
        overlap = len(secondary.intersection(row_topics))
        secondary_hit = overlap / max(1, len(secondary))

    # Primary topic dominates; secondary topics refine.
    return min(1.0, 0.7 * primary_hit + 0.3 * secondary_hit)


def _keyword_overlap_score(selected_keywords: list[str], row: dict):
    query = _norm_set(selected_keywords)
    if not query:
        return 0.0

    paper_keywords = [_norm_text(k) for k in (row.get("keywords") or []) if _norm_text(k)]
    if not paper_keywords:
        return 0.0

    hit = 0
    for q in query:
        if any(q in k or k in q for k in paper_keywords):
            hit += 1
    return hit / max(1, len(query))


def _freshness_score(update_date_text: str | None):
    try:
        updated_at = datetime.fromisoformat(str(update_date_text).replace("Z", ""))
    except Exception:
        return 0.0
    age_days = max(0, (datetime.utcnow() - updated_at).days)
    tau = 30.0
    return math.exp(-age_days / tau)


def _popularity_score(row: dict, max_likes: float, max_saves: float, max_citations: float):
    likes = max(0.0, float(row.get("likes_count") or 0))
    saves = max(0.0, float(row.get("saves_count") or 0))
    citations = max(0.0, float(row.get("citations") or 0))

    likes_norm = math.log1p(likes) / math.log1p(max_likes) if max_likes > 0 else 0.0
    saves_norm = math.log1p(saves) / math.log1p(max_saves) if max_saves > 0 else 0.0
    cites_norm = math.log1p(citations) / math.log1p(max_citations) if max_citations > 0 else 0.0
    return 0.5 * likes_norm + 0.2 * saves_norm + 0.3 * cites_norm


@app.get("/")
async def health_check():
    return {"status": "ok", "rows": int(len(db_manager.df))}


# --- Auth Routes ---
@app.post("/api/v1/auth/signup", status_code=201)
async def signup(user_info: dict, response: Response):
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
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/",
    )
    return {"user": sanitize_user(new_user), "token": token}


@app.post("/api/v1/auth/login")
async def login(credentials: dict, response: Response):
    email = str(credentials.get("email", "")).strip()
    password = str(credentials.get("password", ""))

    users = auth.load_users()
    user = users.get(email)
    if not user or not auth.verify_password(password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token({"sub": user["email"]})
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/",
    )
    return {"user": sanitize_user(user), "token": token}


@app.get("/api/v1/auth/me")
async def auth_me(user=Depends(get_current_user)):
    user = require_user(user)
    return {"user": sanitize_user(user)}


@app.post("/api/v1/auth/logout")
async def logout(response: Response, _: dict = Depends(get_current_user)):
    response.delete_cookie(key=AUTH_COOKIE_NAME, path="/")
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


@app.post("/api/v1/recommend/for-you")
async def recommend_for_you(payload: dict, user=Depends(get_current_user)):
    """
    Phase-1 Discover-for-You ranker.
    Expected payload:
    {
      "primary_topic": "AI for Science",
      "secondary_topics": ["HCI", "Multimodal"],
      "style_preference": "Practical",
      "page": 1,
      "size": 10
    }
    """
    page = int(payload.get("page", 1) or 1)
    size = int(payload.get("size", 10) or 10)
    page = max(1, page)
    size = max(1, min(50, size))

    primary_topic = str(payload.get("primary_topic", "") or "")
    secondary_topics = payload.get("secondary_topics", []) or []
    if not isinstance(secondary_topics, list):
        secondary_topics = []

    style_preference = _norm_text(payload.get("style_preference", ""))
    selected_keywords = payload.get("selected_keywords", []) or []
    if not isinstance(selected_keywords, list):
        selected_keywords = []
    selected_keywords = [str(v).strip() for v in selected_keywords if str(v).strip()]
    if not selected_keywords:
        selected_keywords = _collect_topic_keywords(primary_topic, secondary_topics, limit=12)

    df = db_manager.df.copy()
    if df.empty:
        return {"items": [], "page": page, "size": size, "has_more": False, "total": 0}

    rows = df.to_dict(orient="records")

    max_likes = float(df.get("likes_count", 0).max() or 0)
    max_saves = float(df.get("saves_count", 0).max() or 0)
    max_citations = float(df.get("citations", 0).max() or 0)

    ranked = []
    for row in rows:
        topic_match = _topic_match_score(primary_topic, secondary_topics, row)
        keyword_overlap = _keyword_overlap_score(selected_keywords, row)
        freshness = _freshness_score(row.get("update_date"))
        popularity = _popularity_score(row, max_likes, max_saves, max_citations)

        # Small style preferences for phase-1 sorting flavor.
        style_boost = 0.0
        title_text = _norm_text(row.get("title"))
        if style_preference == "survey" and "survey" in title_text:
            style_boost = 0.03
        elif style_preference == "practical" and ("system" in title_text or "benchmark" in title_text):
            style_boost = 0.03
        elif style_preference == "method" and ("model" in title_text or "framework" in title_text):
            style_boost = 0.03

        score = (
            0.45 * topic_match
            + 0.35 * keyword_overlap
            + 0.15 * freshness
            + 0.05 * popularity
            + style_boost
        )

        row["_rank_score"] = round(float(score), 6)
        ranked.append(row)

    ranked.sort(
        key=lambda r: (
            r.get("_rank_score", 0.0),
            float(r.get("likes_count") or 0),
            float(r.get("citations") or 0),
        ),
        reverse=True,
    )

    total = len(ranked)
    start = (page - 1) * size
    end = page * size
    items = ranked[start:end]
    items = [inject_interaction_status(item, user) for item in items]

    return {
        "items": items,
        "page": page,
        "size": size,
        "has_more": end < total,
        "total": total,
        "mode": "discover_for_you",
        "selected_keywords": selected_keywords,
    }


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


@app.get("/api/v1/recommend/keywords")
async def get_recommend_keywords(
    primary_topic: str = Query(""),
    secondary_topics: str = Query(""),
    limit: int = Query(12, ge=1, le=30),
):
    secondary = [item.strip() for item in str(secondary_topics or "").split(",") if item.strip()]
    items = _collect_topic_keywords(primary_topic, secondary, limit=limit)
    return {"items": items, "primary_topic": primary_topic, "secondary_topics": secondary}


@app.get("/api/v1/recommend/keywords/expand")
async def get_recommend_keywords_expand(
    primary_topic: str = Query(""),
    secondary_topics: str = Query(""),
    seed_keywords: str = Query(""),
    limit: int = Query(10, ge=1, le=30),
):
    secondary = [item.strip() for item in str(secondary_topics or "").split(",") if item.strip()]
    seed = [item.strip() for item in str(seed_keywords or "").split(",") if item.strip()]
    items = _collect_keyword_expansion(primary_topic, secondary, seed, limit=limit)
    return {
        "items": items,
        "primary_topic": primary_topic,
        "secondary_topics": secondary,
        "seed_keywords": seed,
    }


def _compute_similarity_graph(threshold: float = 0.5, max_nodes: int | None = None, top_k: int | None = None):
    df = db_manager.df
    if df.empty:
        return {"nodes": [], "edges": []}

    if max_nodes is not None and max_nodes > 0 and len(df) > max_nodes:
        df = df.head(max_nodes)

    abstracts = df["abstract"].astype(str).fillna("").tolist()
    ids = df["id"].astype(str).tolist()
    titles = df["title"].astype(str).tolist()

    # Use safer TF-IDF defaults: include bigrams, filter very rare/common terms
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), min_df=2, max_df=0.9)
    try:
        X = vectorizer.fit_transform(abstracts)
    except Exception:
        return {"nodes": [{"id": ids[i], "title": titles[i]} for i in range(len(ids))], "edges": []}

    nodes = [{"id": ids[i], "title": titles[i]} for i in range(len(ids))]
    edges: list[dict] = []
    n = len(ids)

    try:
        # For larger corpora, reduce dimensionality before neighbor search to speed up
        X_search = X
        if n > 2000 and X.shape[1] > 100:
            from sklearn.decomposition import TruncatedSVD

            svd = TruncatedSVD(n_components=100)
            X_search = svd.fit_transform(X)

        # NearestNeighbors radius search avoids building full n x n similarity matrix
        from sklearn.neighbors import NearestNeighbors

        radius = max(0.0, 1.0 - float(threshold))
        nn = NearestNeighbors(radius=radius, metric="cosine", algorithm="brute")
        nn.fit(X_search)
        distances, indices = nn.radius_neighbors(X_search, return_distance=True)

        for i_, (dists, inds) in enumerate(zip(distances, indices)):
            for dist, j in zip(dists, inds):
                if j <= i_:
                    continue
                score = 1.0 - float(dist)
                if score >= float(threshold):
                    edges.append({"source": ids[i_], "target": ids[j], "score": score})
    except Exception:
        # Fallback: dense cosine similarity (original behavior)
        sim_matrix = cosine_similarity(X)
        for i in range(n):
            for j in range(i + 1, n):
                score = float(sim_matrix[i, j])
                if score >= float(threshold):
                    edges.append({"source": ids[i], "target": ids[j], "score": score})

    # Optionally trim to top_k neighbors per node to limit graph size (keeps strongest edges)
    if top_k is not None and top_k > 0:
        neigh_map: dict[str, list[tuple[str, float]]] = {nid: [] for nid in ids}
        for e in edges:
            s = e["source"]; t = e["target"]; sc = float(e.get("score", 0.0))
            neigh_map.setdefault(s, []).append((t, sc))
            neigh_map.setdefault(t, []).append((s, sc))

        kept = set()
        new_edges: list[dict] = []
        for s, nbs in neigh_map.items():
            nbs_sorted = sorted(nbs, key=lambda x: x[1], reverse=True)[:top_k]
            for t, sc in nbs_sorted:
                a, b = (s, t) if s <= t else (t, s)
                key = (a, b)
                if key in kept:
                    continue
                kept.add(key)
                new_edges.append({"source": s, "target": t, "score": sc})

        edges = new_edges

    return {"nodes": nodes, "edges": edges}


@app.get("/api/v1/graph/global")
async def graph_global(threshold: float = Query(0.1, ge=0.0, le=1.0)):
    """
    Compute and return a global TF-IDF + Cosine similarity graph from all paper abstracts.
    All papers as nodes, all edges with similarity >= threshold (no top_k trimming).
    Results are cached in the `backend/database` folder to avoid recomputation.
    """
    cache_dir = db_module.DATA_DIR
    cache_dir.mkdir(exist_ok=True)
    cache_file = cache_dir / f"graph_global_{float(threshold):.2f}.json"

    # Try to load from cache
    if cache_file.exists():
        try:
            with cache_file.open("r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    # Compute graph: all articles, all edges above threshold (no max_nodes, no top_k)
    graph = _compute_similarity_graph(threshold=threshold, max_nodes=None, top_k=None)

    # Cache the result
    try:
        with cache_file.open("w", encoding="utf-8") as f:
            json.dump(graph, f, indent=2, ensure_ascii=False)
    except Exception:
        pass

    return graph