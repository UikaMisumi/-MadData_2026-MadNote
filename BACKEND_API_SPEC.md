# Backend API Specification

> Project: MadNote — Academic Recommendation Platform
> Version: v1.1
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
  "author": {
    "name": "string",
    "username": "string | null",
    "avatar": "string | null"
  },
  "category": "string",
  "citations": 112,
  "update_date": "2026-02-13",
  "likes_count": 0,
  "saves_count": 0,
  "image_url": "string | null"
}
```

> **`author` object** is synthesized from the `authors` array by the backend:
> - `name`: first element of `authors` (e.g. `"Alice Wang"`)
> - `username`: lowercase, spaces replaced by `_` (e.g. `"alice_wang"`)
> - `avatar`: `null` (frontend falls back to `/default-avatar.png`)
>
> This field is required — `PostCard` and `PostModal` both read `post.author.name`, `post.author.avatar`, and `post.author.username`.

> `is_liked` and `is_saved` are **user-specific** and must be injected when a valid JWT token is present:
>
> ```json
> {
>   ...Paper,
>   "is_liked": false,
>   "is_saved": false
> }
> ```
>
> These default to `false` when no token is provided.

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

Register a new user.

**Request body:**
```json
{ "email": "user@example.com", "password": "Secret123!", "name": "Alice" }
```

> `name` is optional — the frontend currently sends `name: ""` (empty string). If `name` is absent or empty, the backend must generate both `name` and `username` randomly.

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
| `GET /api/v1/feed` | **Done** — renamed | Now served by `GET /api/v1/papers` |
| `POST /api/v1/interact` | **Done** — replaced | Now `/papers/{id}/like` and `/papers/{id}/save` |

---

## Implementation Notes

1. **CSV loading:** Load `../xiaohongshu_full_topics.csv` on startup (relative to `backend/main.py`). Parse with `pandas` or the built-in `csv` module.

2. **Stable IDs:** Assign IDs on load (e.g., `row_index` cast to string) so they are consistent across restarts. Alternatively, hash the `title`.

3. **authors field:** The CSV `authors` column may be a single string. Split by `;` or `,` to produce a list.

4. **AI Summary:** Produce `ai_summary` offline and store as an additional column in the CSV (or a sidecar JSON file). `PostModal` displays it with priority: `ai_summary` → `abstract` → `content`. If `ai_summary` is not ready, `null` is acceptable and the frontend falls back gracefully.

5. **Interactions storage:** Since there is no database requirement stated yet, a simple approach is to store likes/saves in a JSON file (`interactions.json`) on disk, or use SQLite via `aiosqlite`.

6. **CORS in production:** Add the production frontend URL to `allow_origins`.

7. **Optional categories list endpoint:**

   `GET /api/v1/categories` → `["Foundation_Models", "NLP", ...]`

   Useful for the `CategoryNav` filter bar in the frontend.

8. **User-uploaded posts not implemented (v1):** The `ProfilePage` Posts tab has been removed. There is no `GET /api/v1/users/{user_id}/posts` endpoint required in v1. Users interact with the platform via like/save only; post creation is out of scope for this release.

---

## Index5 UI Refactor Modification Book (Frontend Only)

Date: 2026-02-21  
Owner: Frontend Team  
Constraint: **Do not modify anything under `backend/` in this refactor.**

This section defines how to merge the visual/interaction language from `index5.html` into the current React app with maximum reuse of the existing component system.

### 1. Refactor Goals

1. Keep current React routing and data flow (`App` -> `Layout` -> `HomePage` -> `MasonryGrid` -> `PostCard` -> `PostModal`).
2. Replace legacy UI style with Index5 design system (teal brand, soft cards, balanced typography, motion).
3. Preserve existing interactions that already work (feed load, like/save toggle, comments).
4. Add missing Index5 interaction patterns in frontend only (selection bar, insight modal, graph modal).
5. Avoid backend code changes; only document API expectations here.

### 2. Source of Truth and Scope

Primary UI source:
- `index5.html`

React integration scope:
- `src/components/Header.jsx`
- `src/components/Header.css`
- `src/components/HomePage.jsx`
- `src/components/HomePage.css`
- `src/components/MasonryGrid.jsx`
- `src/components/PostCard.jsx`
- `src/components/PostCard.css`
- `src/components/PostModal.jsx`
- `src/components/PostModal.css`
- `src/index.css`
- `src/styles/tokens.css`
- New components for modals/action bar (frontend only)

Out of scope:
- Any Python backend implementation changes
- Database/auth logic rewrite
- New backend endpoints in this phase

### 3. Index5 Design Tokens to Introduce

Implement in frontend CSS variables (`src/styles/tokens.css` preferred):

- Color system:
  - `--brand-50` to `--brand-900` (teal scale from Index5)
  - neutral slate background and border shades
- Surface & shadow:
  - `--bg-base`, `--bg-card`, `--border-subtle`
  - `--shadow-soft`, `--shadow-card`, `--shadow-hover`
- Motion:
  - `--transition-smooth`
  - `--transition-spring`
- Radius:
  - rounded-xl/2xl equivalents for cards/modals/buttons
- Typography:
  - `Plus Jakarta Sans` as primary UI font fallback chain

### 4. Component Mapping Plan (Index5 -> React)

1. Nav / account dropdown:
- Index5 nav style -> `Header.jsx` + `Header.css`
- Keep existing search behavior, theme toggle, route links
- Visual upgrade only

2. Discover intro + masonry feed:
- Index5 main header block -> `HomePage.jsx`
- Keep current filtered posts logic

3. Paper card:
- Index5 card anatomy -> `PostCard.jsx`:
  - category chip
  - likes meta text
  - title + TLDR highlight block
  - key bullets
  - related links block
  - “Explore Semantic Lineage” CTA
- Keep current `onClick`, like/save actions, and user guard

4. Selection action bar:
- Add new `SelectionActionBar` component:
  - selected count badge
  - “Generate Macro Insight” button
- Selection state managed at `MasonryGrid`/`HomePage` level

5. Insight modal:
- Add new `InsightModal` component with staged reveal blocks and loading state
- Triggered from selection action bar

6. Graph modal:
- Add new `GraphModal` component using ECharts in React lifecycle
- Reuse card CTA and modal CTA to open graph
- Install/use `echarts` only on frontend side

7. Fullscreen/immersive paper modal:
- Index5 immersive structure -> `PostModal.jsx` + `PostModal.css`:
  - top back bar
  - left content pane with AI/Original tabs
  - right utility pane (Read PDF/GitHub/Graph/Ask Paper shell)
  - expandable “Because you liked this...” recommendation block
  - existing comments block kept and restyled
- Preserve existing `getComments/addComment/addReply/deleteComment` flow

### 5. Data Contract Usage in Frontend (No Backend Code Change)

Frontend should read these fields when available and gracefully fallback if absent:

- Core:
  - `id`, `title`, `category`, `abstract`, `ai_summary`, `update_date`
- Author:
  - `author.name`, `author.username`, `author.avatar`
- Media:
  - `image_url` or fallback placeholder
  - optional `media[]` for carousel
- Interaction:
  - `likes_count`, `saves_count`, `is_liked`, `is_saved`

Recommended frontend fallback chain:
- Description text:
  - `ai_summary` -> `abstract` -> `content` -> `description` -> empty-state text
- Cover image:
  - `image_url` -> `image` -> `imageUrl` -> placeholder

### 6. Backend Collaboration (Documentation Only)

During this frontend-only refactor, backend remains unchanged.  
For compatibility testing, frontend assumes existing API paths in `src/api.js`:

- `GET /api/v1/papers`
- `GET /api/v1/papers/search`
- `POST /api/v1/papers/{paper_id}/like`
- `POST /api/v1/papers/{paper_id}/save`
- `GET /api/v1/papers/{paper_id}/comments`
- `POST /api/v1/papers/{paper_id}/comments`
- `POST /api/v1/papers/{paper_id}/comments/{comment_id}/replies`
- `DELETE /api/v1/papers/{paper_id}/comments/{comment_id}`
- `GET /api/v1/users/{user_id}/liked`
- `GET /api/v1/users/{user_id}/saved`

If any endpoint/field mismatch appears, frontend will patch with local adapter logic first, and only then raise a backend task (outside this UI refactor).

### 7. Implementation Phases

Phase F1: Design system foundation
1. Add/normalize tokens in `src/styles/tokens.css` and `src/index.css`.
2. Replace global background, scrollbars, and typography.

Phase F2: Feed shell and cards
1. Refactor `Header` to Index5 visual style.
2. Refactor `HomePage` hero header and masonry spacing.
3. Refactor `PostCard` structure and motion.

Phase F3: Batch interactions
1. Add card selection state and checkbox affordance.
2. Add floating selection action bar.
3. Add Insight modal with staged reveal animation.

Phase F4: Deep reading experience
1. Refactor `PostModal` into Index5 immersive layout.
2. Add AI/Original tabs and recommendation expand behavior.
3. Add Graph modal and wire buttons.

Phase F5: Polish and regression
1. Mobile adaptation (stacked layout, touch-safe spacing).
2. Accessibility pass (focus ring, keyboard escape, aria labels).
3. Verify no regression on login/profile/comments flow.

### 8. Acceptance Criteria

1. Visual parity with Index5 style language is achieved across feed and modal.
2. Existing data operations still work:
   - feed rendering
   - like/save toggle
   - comments CRUD from modal
3. No file under `backend/` is changed in this refactor.
4. New UI works on desktop and mobile breakpoints.
5. No blocking console runtime errors during core flows.

### 9. Risks and Mitigation

1. Risk: Data shape inconsistency from API.
- Mitigation: Add frontend normalizer/fallbacks in component layer.

2. Risk: Modal complexity causes regressions.
- Mitigation: Keep old `PostModal` behavior flags while migrating section by section.

3. Risk: Performance drop with animation and ECharts.
- Mitigation: Lazy-mount modals and initialize chart only when opened.

4. Risk: CSS collisions with existing styles.
- Mitigation: scope class names per component and centralize tokens.
