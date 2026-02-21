/**
 * src/api.js
 * All HTTP calls to the backend.
 * Base URL: http://localhost:8000/api/v1  (spec: BACKEND_API_SPEC.md)
 */

const BASE_URL = 'http://127.0.0.1:8000/api/v1';
let authToken = null;

// ---------- helpers ----------

function getToken() {
  return authToken;
}

export function setAuthToken(token) {
  authToken = token || null;
}

export function clearAuthToken() {
  authToken = null;
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body, requireAuth = false) {
  const tokenHeaders = requireAuth ? authHeaders() : {};
  const headers = {
    'Content-Type': 'application/json',
    ...tokenHeaders,
  };

  const options = {
    method,
    headers,
    credentials: 'include',
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch (networkError) {
    const error = new Error('Backend is unreachable. Please start API server on http://127.0.0.1:8000.');
    error.status = 0;
    throw error;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const error = new Error(err.detail || 'Request failed');
    error.status = res.status;
    throw error;
  }

  // 201 Created with body, or 200 OK
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---------- Auth ----------

/**
 * POST /auth/login
 * @returns {{ user: User, token: string }}
 */
export async function apiLogin(email, password) {
  return request('POST', '/auth/login', { email, password });
}

/**
 * POST /auth/signup
 * @returns {{ user: User, token: string }}
 */
export async function apiSignup(email, password, name) {
  return request('POST', '/auth/signup', { email, password, name });
}

/**
 * POST /auth/logout  (requires auth)
 * @returns {{ success: boolean }}
 */
export async function apiLogout() {
  return request('POST', '/auth/logout', undefined, true);
}

/**
 * GET /auth/me
 * Restores user session from backend cookie.
 * @returns {{ user: User }}
 */
export async function apiMe() {
  return request('GET', '/auth/me', undefined, true);
}

// ---------- Papers / Feed ----------

/**
 * GET /papers?page=&size=&category=
 * @returns {PaginatedList<Paper>}
 */
export async function apiFeed(page = 1, size = 10, category = '') {
  const params = new URLSearchParams({ page, size });
  if (category) params.set('category', category);
  return request('GET', `/papers?${params}`);
}

/**
 * GET /papers/search?q=&page=&size=
 * @returns {PaginatedList<Paper>}
 */
export async function apiSearch(q, page = 1, size = 10) {
  const params = new URLSearchParams({ q, page, size });
  return request('GET', `/papers/search?${params}`);
}

/**
 * GET /papers/:paperId
 * @returns {Paper}
 */
export async function apiGetPaper(paperId) {
  return request('GET', `/papers/${paperId}`);
}

// ---------- Recommendations ----------

/**
 * GET /recommendations?page=&size=
 * Falls back to default feed for unauthenticated users.
 * @returns {PaginatedList<Paper>}
 */
export async function apiRecommendations(page = 1, size = 10) {
  const params = new URLSearchParams({ page, size });
  return request('GET', `/recommendations?${params}`);
}

// ---------- Interactions ----------

/**
 * POST /papers/:paperId/like  (toggle)
 * @returns {{ liked: boolean, likes_count: number }}
 */
export async function apiLikePaper(paperId) {
  return request('POST', `/papers/${paperId}/like`, undefined, true);
}

/**
 * POST /papers/:paperId/save  (toggle)
 * @returns {{ saved: boolean, saves_count: number }}
 */
export async function apiSavePaper(paperId) {
  return request('POST', `/papers/${paperId}/save`, undefined, true);
}

/**
 * GET /papers/:paperId/interaction  (requires auth)
 * @returns {{ liked: boolean, saved: boolean }}
 */
export async function apiGetInteraction(paperId) {
  return request('GET', `/papers/${paperId}/interaction`, undefined, true);
}

// ---------- User Profile ----------

/**
 * GET /users/:userId
 * @returns {User}
 */
export async function apiGetUser(userId) {
  return request('GET', `/users/${userId}`);
}

/**
 * PUT /users/:userId  (requires auth)
 * @param {string} userId
 * @param {{ name?, username?, bio?, avatar? }} profileData
 * @returns {User}
 */
export async function apiUpdateUser(userId, profileData) {
  return request('PUT', `/users/${userId}`, profileData, true);
}

/**
 * PUT /users/:userId/password  (requires auth)
 * @returns {{ success: boolean }}
 */
export async function apiUpdatePassword(userId, oldPassword, newPassword) {
  return request('PUT', `/users/${userId}/password`, {
    old_password: oldPassword,
    new_password: newPassword,
  }, true);
}

// ---------- User Collections ----------

/**
 * GET /users/:userId/liked?page=&size=  (requires auth)
 * @returns {PaginatedList<Paper>}
 */
export async function apiGetLikedPapers(userId, page = 1, size = 10) {
  const params = new URLSearchParams({ page, size });
  return request('GET', `/users/${userId}/liked?${params}`, undefined, true);
}

/**
 * GET /users/:userId/saved?page=&size=  (requires auth)
 * @returns {PaginatedList<Paper>}
 */
export async function apiGetSavedPapers(userId, page = 1, size = 10) {
  const params = new URLSearchParams({ page, size });
  return request('GET', `/users/${userId}/saved?${params}`, undefined, true);
}

// ---------- Comments ----------

/**
 * GET /papers/:paperId/comments
 * @returns {Comment[]}
 */
export async function apiGetComments(paperId) {
  return request('GET', `/papers/${paperId}/comments`);
}

/**
 * POST /papers/:paperId/comments  (requires auth)
 * @returns {Comment}
 */
export async function apiAddComment(paperId, text) {
  return request('POST', `/papers/${paperId}/comments`, { text }, true);
}

/**
 * POST /papers/:paperId/comments/:commentId/replies  (requires auth)
 * @returns {Comment}
 */
export async function apiAddReply(paperId, commentId, text) {
  return request('POST', `/papers/${paperId}/comments/${commentId}/replies`, { text }, true);
}

/**
 * DELETE /papers/:paperId/comments/:commentId  (requires auth)
 * @returns {{ success: boolean }}
 */
export async function apiDeleteComment(paperId, commentId) {
  return request('DELETE', `/papers/${paperId}/comments/${commentId}`, undefined, true);
}
