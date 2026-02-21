# Backend API Specification

> Project: MadNote — Academic Recommendation Platform
> Version: v1
> Date: 2026-02-21
> Audience: **Backend Developer**

This document describes every HTTP endpoint the React frontend (`src/api.js`) expects.
Implement these endpoints in `backend/main.py` (FastAPI) to match the data source `xiaohongshu_full_topics.csv`.

---

## Base URL

| Environment | Base URL |
|---|---|
| Development | `http://localhost:8000` |
| Production | TBD |

All API paths are prefixed with `/api/v1`.

CORS must allow the frontend origin (currently `http://localhost:5173`).

---

## Data Source

**File:** `xiaohongshu_full_topics.csv` (project root, 550 rows)

| CSV Column | Type | Notes |
|---|---|---|
| `title` | string | Paper title |
| `abstract` | string | Full paper abstract |
| `authors` | string | Comma-separated author names |
| `update_date` | string | Format: `YYYY-MM-DD` |
| `category` | string | e.g. `Foundation_Models` |
| `text_for_embedding` | string | For vector search / recommendation |
| `citations` | integer | Citation count |

The backend should load this CSV into memory (or a database) on startup and assign a stable `id` to each row (e.g., row index or a UUID).

Each paper will be enriched with an AI-generated summary (`ai_summary`) that can be produced offline and stored alongside the CSV data.

---

## Common Response Formats

### Paginated List

```json
{
  "items": [ ...Paper ],
  "page": 1,
  "size": 10,
  "has_more": true,
  "total": 550
}
```

### Error

```json
{
  "detail": "Human-readable error message"
}
```

HTTP status codes: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`, `500 Internal Server Error`.

---

## Data Models

### Paper

```json
{
  "id": "string",
  "title": "string",
  "abstract": "string",
  "ai_summary": "string | null",
  "authors": ["string"],
  "category": "string",
  "citations": 112,
  "update_date": "2026-02-13",
  "likes_count": 0,
  "saves_count": 0,
  "image_url": "string | null"
}
```

> `isLiked` and `isSaved` are **user-specific** and must be injected when a valid JWT token is present:
>
> ```json
> {
>   ...Paper,
>   "is_liked": false,
>   "is_saved": false
> }
> ```

### User

```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "username": "string",
  "avatar": "string | null",
  "bio": "string | null",
  "following_count": 0,
  "followers_count": 0
}
```

### Comment

```json
{
  "id": "string",
  "paper_id": "string",
  "text": "string",
  "author": {
    "id": "string",
    "name": "string",
    "avatar": "string | null"
  },
  "likes_count": 0,
  "created_at": "2026-02-21T10:00:00Z",
  "replies": [ ...Comment ]
}
```

---

## Endpoints

---

### Authentication

#### `POST /api/v1/auth/login`

Sign in with email and password.

**Request body:**
```json
{ "email": "user@example.com", "password": "Secret123!" }
```

**Response `200`:**
```json
{
  "user": { ...User },
  "token": "eyJhbGci..."
}
```

**Errors:** `401` if credentials are invalid.

---

#### `POST /api/v1/auth/signup`

Register a new user. The backend generates a random `username` if not provided.

**Request body:**
```json
{ "email": "user@example.com", "password": "Secret123!", "name": "Alice" }
```

**Response `201`:**
```json
{
  "user": { ...User },
  "token": "eyJhbGci..."
}
```

**Errors:** `400` if email already exists.

---

#### `POST /api/v1/auth/logout`

Invalidate the token server-side (if using a token blocklist).

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{ "success": true }
```

---

### Papers / Feed

#### `GET /api/v1/papers`

Return a paginated list of all papers sorted by `update_date` descending.

**Query params:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | int | 1 | Page number (≥ 1) |
| `size` | int | 10 | Items per page (1–50) |
| `category` | string | — | Filter by category |

**Headers:** `Authorization: Bearer <token>` (optional — if present, inject `is_liked`/`is_saved`)

**Response `200`:** Paginated List of Paper

---

#### `GET /api/v1/papers/search`

Full-text search across `title`, `abstract`, and `authors`.

**Query params:**

| Param | Type | Default |
|---|---|---|
| `q` | string | required |
| `page` | int | 1 |
| `size` | int | 10 |

**Response `200`:** Paginated List of Paper

---

#### `GET /api/v1/papers/{paper_id}`

Return a single paper by ID.

**Response `200`:** Paper (with `is_liked`/`is_saved` if authenticated)

**Errors:** `404` if not found.

---

### Recommendations

#### `GET /api/v1/recommendations`

Return a personalized feed for the authenticated user, ranked by relevance to their interaction history (liked / saved papers). Falls back to the default sorted feed for unauthenticated users.

**Headers:** `Authorization: Bearer <token>` (optional)

**Query params:**

| Param | Type | Default |
|---|---|---|
| `page` | int | 1 |
| `size` | int | 10 |

**Response `200`:** Paginated List of Paper

> **Implementation note:** Use `text_for_embedding` column for vector similarity. A simple baseline is cosine similarity between the average embedding of papers the user interacted with and all other papers.

---

### User Interactions

#### `POST /api/v1/papers/{paper_id}/like`

Toggle like on a paper. If already liked, unlike it.

**Headers:** `Authorization: Bearer <token>` (required)

**Response `200`:**
```json
{ "liked": true, "likes_count": 43 }
```

---

#### `POST /api/v1/papers/{paper_id}/save`

Toggle save on a paper. If already saved, unsave it.

**Headers:** `Authorization: Bearer <token>` (required)

**Response `200`:**
```json
{ "saved": true, "saves_count": 19 }
```

---

#### `GET /api/v1/papers/{paper_id}/interaction`

Check the current user's like/save status for a specific paper.

**Headers:** `Authorization: Bearer <token>` (required)

**Response `200`:**
```json
{ "liked": false, "saved": true }
```

---

### User Profile

#### `GET /api/v1/users/{user_id}`

Return a public user profile.

**Response `200`:** User

---

#### `PUT /api/v1/users/{user_id}`

Update the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>` (required)

**Request body (all fields optional):**
```json
{
  "name": "Alice",
  "username": "alice123",
  "bio": "Researcher at ...",
  "avatar": "https://..."
}
```

**Response `200`:** Updated User

**Errors:** `403` if `user_id` does not match the authenticated user.

---

#### `PUT /api/v1/users/{user_id}/password`

Change the authenticated user's password.

**Headers:** `Authorization: Bearer <token>` (required)

**Request body:**
```json
{ "old_password": "OldPass1!", "new_password": "NewPass2!" }
```

**Response `200`:**
```json
{ "success": true }
```

**Errors:** `400` if `old_password` is wrong.

---

### User Collections

#### `GET /api/v1/users/{user_id}/liked`

Return papers the user has liked, newest first.

**Headers:** `Authorization: Bearer <token>` (required)

**Query params:** `page`, `size`

**Response `200`:** Paginated List of Paper

---

#### `GET /api/v1/users/{user_id}/saved`

Return papers the user has saved, newest first.

**Headers:** `Authorization: Bearer <token>` (required)

**Query params:** `page`, `size`

**Response `200`:** Paginated List of Paper

---

### Comments

#### `GET /api/v1/papers/{paper_id}/comments`

Return all top-level comments for a paper, including nested replies.

**Response `200`:**
```json
[ ...Comment ]
```

---

#### `POST /api/v1/papers/{paper_id}/comments`

Add a top-level comment.

**Headers:** `Authorization: Bearer <token>` (required)

**Request body:**
```json
{ "text": "Great paper!" }
```

**Response `201`:** Comment

---

#### `POST /api/v1/papers/{paper_id}/comments/{comment_id}/replies`

Add a reply to an existing comment.

**Headers:** `Authorization: Bearer <token>` (required)

**Request body:**
```json
{ "text": "I agree!" }
```

**Response `201`:** Comment (the new reply)

---

#### `DELETE /api/v1/papers/{paper_id}/comments/{comment_id}`

Delete a comment or reply (author or admin only).

**Headers:** `Authorization: Bearer <token>` (required)

**Response `200`:**
```json
{ "success": true }
```

**Errors:** `403` if not the comment author.

---

## Authentication Scheme

Use **JWT Bearer tokens**.

- Token issued on login / signup
- Frontend stores token in `localStorage` key `token`
- Frontend sends `Authorization: Bearer <token>` on every authenticated request
- Token expiry: recommended 7 days (or configurable)

---

## Existing Endpoints (already in `backend/main.py`)

| Endpoint | Status | Notes |
|---|---|---|
| `GET /` | Keep | Health check |
| `GET /api/v1/feed` | Rename/merge | Merge into `GET /api/v1/papers` |
| `POST /api/v1/interact` | Replace | Replace with `/papers/{id}/like` and `/papers/{id}/save` |

---

## Implementation Notes

1. **CSV loading:** Load `../xiaohongshu_full_topics.csv` on startup (relative to `backend/main.py`). Parse with `pandas` or the built-in `csv` module.

2. **Stable IDs:** Assign IDs on load (e.g., `row_index` cast to string) so they are consistent across restarts. Alternatively, hash the `title`.

3. **authors field:** The CSV `authors` column may be a single string. Split by `;` or `,` to produce a list.

4. **AI Summary:** Produce `ai_summary` offline and store as an additional column in the CSV (or a sidecar JSON file). The frontend will display this in `PostModal`.

5. **Interactions storage:** Since there is no database requirement stated yet, a simple approach is to store likes/saves in a JSON file (`interactions.json`) on disk, or use SQLite via `aiosqlite`.

6. **CORS in production:** Add the production frontend URL to `allow_origins`.

7. **Optional categories list endpoint:**

   `GET /api/v1/categories` → `["Foundation_Models", "NLP", ...]`

   Useful for the `CategoryNav` filter bar in the frontend.
