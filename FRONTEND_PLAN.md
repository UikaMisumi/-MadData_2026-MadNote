# 前端改造计划书

> 项目：MadNote → 学术个性推荐平台
> 分支：`claude/remove-localstorage-api-H9zIh`
> 日期：2026-02-21
> 状态：**待实施**（本文件仅为计划，不含代码修改）

---

## 一、背景与目标

### 现状

当前项目是一个纯前端 Demo，所有数据（帖子、点赞、收藏、用户注册）均存储在浏览器 **localStorage** 中。后端文件 `backend/main.py` 已完成基础脚手架，但前端未对接。用户自行上传 Post 的功能已被删除（commit `b5e0668`）。

### 目标

将平台改造为**学术论文个性推荐平台**，数据源为项目根目录下的 `xiaohongshu_full_topics.csv`（550 篇论文，含 title / abstract / authors / category / citations 等字段），并由 AI 逐篇生成摘要。前端所有数据均通过统一的 `src/api.js` 向后端请求，彻底移除与业务相关的 localStorage 依赖。

---

## 二、localStorage 使用现状与处置方案

| localStorage Key | 位置 | 处置方案 |
|---|---|---|
| `user` | AuthContext | **保留** — 保持登录会话（标准做法） |
| `token` | AuthContext | **保留** — JWT Token 本地持久化 |
| `theme` | ThemeContext | **保留** — 纯 UI 偏好，无需后端 |
| `registeredUsers` | LoginPage / SignupPage | **移除** — 改为调用 `POST /api/auth/signup` |
| `userPosts_{userId}` | PostsContext | **移除** — 已无上传功能，此 key 成为死代码 |
| `likedPosts_{userId}` | PostCard / PostModal / ProfilePage | **移除** — 改为调用 `POST /api/papers/{id}/like` |
| `savedPosts_{userId}` | PostCard / PostModal / ProfilePage | **移除** — 改为调用 `POST /api/papers/{id}/save` |
| `defaultPostCounts_{userId}` | PostsContext | **移除** — Demo 数据不再使用 |

**结论**：localStorage 中只需保留 `user`、`token`、`theme` 三个 key，其余全部由 API 替代。

---

## 三、新建文件：`src/api.js`

所有网络请求统一在此文件中定义，组件不直接调用 `fetch`。

### 3.1 设计原则

- 导出纯函数，每个函数对应一个后端 endpoint
- 自动附加 `Authorization: Bearer <token>` header（token 从 localStorage 读取）
- 统一错误处理：HTTP 4xx/5xx 抛出带 message 的 Error
- 使用 `BASE_URL` 常量，方便切换开发/生产环境

### 3.2 函数清单

```
// ── 认证 ────────────────────────────────────────
apiLogin(email, password)           → { user, token }
apiSignup(email, password, name)    → { user, token }
apiLogout()                         → void

// ── 论文 Feed ────────────────────────────────────
apiFeed(page, size)                 → { items: Paper[], has_more, total }
apiSearch(query, page, size)        → { items: Paper[], has_more, total }
apiGetPaper(paperId)                → Paper

// ── 个性推荐 ─────────────────────────────────────
apiGetRecommendations(page, size)   → { items: Paper[], has_more }

// ── 用户互动 ─────────────────────────────────────
apiLikePaper(paperId)               → { liked: bool, likes_count: int }
apiSavePaper(paperId)               → { saved: bool, saves_count: int }
apiGetInteractionStatus(paperId)    → { liked: bool, saved: bool }

// ── 用户档案 ─────────────────────────────────────
apiGetProfile(userId)               → User
apiUpdateProfile(userId, data)      → User
apiChangePassword(oldPw, newPw)     → { success: bool }

// ── 用户收藏 / 点赞列表 ──────────────────────────
apiGetLikedPapers(userId, page)     → { items: Paper[], has_more }
apiGetSavedPapers(userId, page)     → { items: Paper[], has_more }

// ── 评论 ─────────────────────────────────────────
apiGetComments(paperId)             → Comment[]
apiAddComment(paperId, text)        → Comment
apiDeleteComment(paperId, commentId)→ void
apiAddReply(paperId, commentId, text) → Comment
```

### 3.3 Paper 数据结构（前端视角）

```js
{
  id: string,
  title: string,
  abstract: string,          // 原始摘要
  ai_summary: string,        // AI 生成的中文/英文简短摘要
  authors: string[],
  category: string,          // e.g. "Foundation_Models"
  citations: number,
  update_date: string,       // "2026-02-13"
  likes_count: number,
  saves_count: number,
  image_url: string | null,  // 可选封面图
  // 前端扩展字段（非 API 字段，本地临时状态）
  isLiked: bool,
  isSaved: bool,
}
```

---

## 四、需要修改的文件清单

### 4.1 `src/contexts/PostsContext.jsx` — **大幅重构**

**移除：**
- 所有 `defaultPosts`（12 条硬编码 VR Demo 数据）
- `userPosts` state 及全部相关 localStorage 操作
- `addPost()`, `removePost()`, `updatePost()`, `getCurrentUserPosts()` 函数
- `getUserStorageKey()` 函数及其所有调用
- `defaultPostCounts` localStorage 读写

**保留/改造：**
- `posts` state：改为由 `apiFeed()` 填充，支持分页追加（无限滚动）
- `addComment()`, `addReply()`, `likeComment()`, `deleteComment()`：改为调用对应 API，同时乐观更新本地 state
- `updateLikeCount()`, `updateSaveCount()`：改为在 API 调用成功后同步更新 state 中该论文的计数

**新增：**
- `loadFeed(page)` — 调用 `apiFeed()` 并追加到 `posts`
- `loadRecommendations(page)` — 调用 `apiGetRecommendations()`
- `hasMore` state — 控制无限滚动终止
- `isLoading` state — 加载中状态

### 4.2 `src/contexts/AuthContext.jsx` — **小幅修改**

**保留：** `user`、`token` localStorage 持久化（合理）

**改造：**
- `login()` → 调用 `apiLogin()`，后端返回 `user` + `token` 后写入 localStorage
- `logout()` → 可选调用 `apiLogout()` 后清除 localStorage
- `updateUser()` → 调用 `apiUpdateProfile()` 后更新本地 state

### 4.3 `src/components/LoginPage.jsx` — **中等修改**

**移除：**
- `localStorage.getItem('registeredUsers')` 查找逻辑
- `btoa(password)` 本地哈希比对
- Demo 账号硬编码（`demo@example.com`）可保留或移至后端

**改造：**
- `handleSignIn` 改为调用 `apiLogin(email, password)`
- 捕获 API 错误并显示 `loginError`

### 4.4 `src/components/SignupPage.jsx` — **中等修改**

**移除：**
- `localStorage.setItem('registeredUsers', ...)` 注册写入逻辑

**改造：**
- `handleSignUp` 改为调用 `apiSignup(email, password, name)`
- 注册成功后直接 `login(user, token)` 并跳转

### 4.5 `src/components/PostCard.jsx` — **中等修改**

**移除：**
- `getUserStorageKey()` 函数
- `useEffect` 中 `localStorage.getItem('likedPosts')` / `savedPosts` 读取
- `handleLike` / `handleSave` 中 localStorage 写入
- `window.dispatchEvent('postLikeChange')` / `postSaveChange` 自定义事件

**改造：**
- `isLiked` / `isSaved` 初始值从 `post.isLiked` / `post.isSaved` 读取（由 API 返回）
- `handleLike` → 调用 `apiLikePaper(post.id)`，乐观更新本地 state
- `handleSave` → 调用 `apiSavePaper(post.id)`，乐观更新本地 state

### 4.6 `src/components/PostModal.jsx` — **中等修改**

与 PostCard 同理：

**移除：** localStorage like/save 读写，`postLikeChange` / `postSaveChange` 事件监听

**改造：**
- like/save 状态从 `post.isLiked` / `post.isSaved` 初始化
- 互动操作改为调用 API + 乐观更新
- 评论操作改为调用 `apiAddComment()` / `apiAddReply()`

### 4.7 `src/components/ProfilePage.jsx` — **中等修改**

**移除：**
- `getUserStorageKey()` 函数
- `likedPosts` / `savedPosts` 从 localStorage 读取的逻辑
- `getCurrentUserPosts()` 调用（用户不再有自己的帖子）

**改造：**
- `Posts` 标签页：**移除或重命名**为 `History`（浏览历史）
- `Saved` 标签页：调用 `apiGetSavedPapers(user.id)`
- `Liked` 标签页：调用 `apiGetLikedPapers(user.id)`
- `handleDeletePost`：**移除**

### 4.8 `src/components/HomePage.jsx` — **小幅修改**

**改造：**
- 从 `usePosts()` 取得的 `posts` 已由 API 驱动，组件本身逻辑变化不大
- 接入 `loadFeed()` 和 `hasMore` 实现真正的无限滚动（当前是模拟滚动）
- 搜索改为调用 `apiSearch(term)` 而非客户端 filter

---

## 五、数据字段映射

CSV 字段 → 前端 Paper 对象映射关系：

| CSV 列 | 前端字段 | 说明 |
|---|---|---|
| `title` | `title` | 直接使用 |
| `abstract` | `abstract` | 原始摘要，用于 PostModal 详情 |
| AI 生成 | `ai_summary` | 后端 AI 摘要，用于 PostCard 简介 |
| `authors` | `authors[]` | 字符串列表 |
| `update_date` | `update_date` | 论文更新日期 |
| `category` | `category` / `tags` | 分类标签 |
| `citations` | `citations` | 引用数，显示为 badge |
| 后端生成 | `likes_count` | 用户点赞数 |
| 后端生成 | `saves_count` | 用户收藏数 |
| 暂无 | `image_url` | 可留 null，或用 category 生成占位图 |
| 后端返回 | `isLiked` / `isSaved` | 当前用户对该论文的互动状态 |

---

## 六、组件 UI 改造建议（非必须，可选）

| 组件 | 当前内容 | 建议改为 |
|---|---|---|
| PostCard 标题 | post.title | paper.title（论文题目） |
| PostCard 作者行 | 头像 + 用户名 | 论文第一作者名 + 分类 badge |
| PostCard 操作行 | 点赞 / 收藏 | 点赞 / 收藏 / 引用数（citations） |
| PostModal 内容区 | 帖子正文 | ai_summary（AI 简介）+ abstract（原文摘要） |
| ProfilePage Posts 标签 | 用户发布的帖子 | 移除（或改为浏览历史） |
| CategoryNav | 无功能 | 接入 `category` 筛选，调用 `apiFeed({category})` |
| 搜索栏 | 客户端过滤 | 调用 `apiSearch(query)` |

---

## 七、实施优先级

```
Phase 1  ── 新建 src/api.js（所有函数的骨架，可先 mock 返回假数据）
Phase 2  ── 重构 PostsContext.jsx（移除 demo 数据，接入 apiFeed）
Phase 3  ── 重构 AuthContext + LoginPage + SignupPage（移除 registeredUsers localStorage）
Phase 4  ── 重构 PostCard + PostModal（移除 likedPosts/savedPosts localStorage）
Phase 5  ── 重构 ProfilePage（Liked / Saved 标签接入 API）
Phase 6  ── 接入真实后端后，验证 api.js 各函数与 BACKEND_API_SPEC.md 对齐
Phase 7  ── 可选：CategoryNav 筛选、搜索栏 API 化、无限滚动优化
```

---

## 八、文件结构变化总览

```
src/
├── api.js                    ← 新增：所有 API 调用的统一入口
├── contexts/
│   ├── AuthContext.jsx       ← 改造：login/signup/logout 改为 API 调用
│   ├── PostsContext.jsx      ← 大幅重构：移除 localStorage + demo 数据
│   └── ThemeContext.jsx      ← 不变（localStorage 保留）
├── components/
│   ├── LoginPage.jsx         ← 改造：移除本地用户查找
│   ├── SignupPage.jsx        ← 改造：移除本地注册写入
│   ├── PostCard.jsx          ← 改造：移除 localStorage like/save
│   ├── PostModal.jsx         ← 改造：移除 localStorage like/save
│   ├── ProfilePage.jsx       ← 改造：Liked/Saved 接入 API，Posts 标签移除
│   └── HomePage.jsx          ← 小改：接入真实无限滚动
└── ...（其余文件不变）
```

---

## 九、后端对接说明

后端 API 规范详见同目录下 **`BACKEND_API_SPEC.md`**，提供给后端开发者参考。前端将在后端就绪后，仅需修改 `src/api.js` 顶部的 `BASE_URL` 常量即可切换环境。

在后端未就绪期间，`src/api.js` 中的每个函数可先返回 mock 数据，以便前端独立开发调试。
