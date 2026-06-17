# Admin Console B1 — Part B: Admin UI (SvelteKit)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Builds on Part A (the
> `/api/admin/*` backend, committed `65905d7`). Frontend work — verify via `npm run build` + live browse.

**Goal:** A `/admin` console in the SvelteKit app — login, dashboard, content list, the guide editor
(metadata + phases + Markdown toolbar/preview/image drag-drop), and category management — talking to the
Part A API.

**Auth architecture (BFF).** The browser only talks to the web origin. SvelteKit relays auth:
- **Login** (`/admin/login` form action): web server POSTs the password to `API/api/admin/login`, reads the
  API's `Set-Cookie`, extracts the `admin_session` value, and re-sets it as a cookie on the **web** origin
  (`httpOnly`, `sameSite=strict`, `path=/`). Redirect to `/admin`.
- **Proxy** (`/admin/api/[...path]` + public `/assets/[id]`): web `+server.js` forwards method + body +
  the incoming `Cookie` header to the API, returns the API response. The browser's admin JS calls the proxy
  (same origin → web cookie sent automatically → proxy adds it to the API call).
- **Guard** (`/admin/+layout.server.js`): calls `API/api/admin/me` forwarding the cookie; if not authed and
  not already on `/admin/login`, `redirect(303, '/admin/login')`.

This works identically in dev (5173→3000) and Docker (web→api).

**File map:**
```
platform/web/src/lib/server/adminApi.js     (new) server-side: forward cookie to API/api/admin/*
platform/web/src/lib/admin.js               (new) browser: call the same-origin /admin/api proxy
platform/web/src/routes/admin/+layout.server.js   (new) auth guard
platform/web/src/routes/admin/+layout.svelte      (new) admin shell (nav) or bare on /login
platform/web/src/routes/admin/login/+page.svelte + +page.server.js   (new) login form + action
platform/web/src/routes/admin/+page.svelte + +page.server.js          (new) dashboard
platform/web/src/routes/admin/content/+page.svelte + +page.server.js  (new) guides table
platform/web/src/routes/admin/content/new/+page.server.js             (new) create-guide action
platform/web/src/routes/admin/content/[slug]/+page.svelte + +page.server.js  (new) editor
platform/web/src/routes/admin/categories/+page.svelte + +page.server.js      (new) categories
platform/web/src/routes/admin/api/[...path]/+server.js   (new) admin API proxy (GET/POST/PATCH/DELETE)
platform/web/src/routes/assets/[id]/+server.js           (new) public asset proxy
platform/web/src/app.css                    admin styles
```

---

### Task 1: Server admin-API helper + cookie relay

**Files:** Create `platform/web/src/lib/server/adminApi.js`

- [ ] **Step 1:** Create it:
```js
const BASE = process.env.API_BASE || 'http://127.0.0.1:3000';

// Server-side fetch to the admin API, forwarding the browser's cookie header.
export async function adminApi(cookieHeader, path, opts = {}) {
  const res = await fetch(`${BASE}/api/admin${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), cookie: cookieHeader || '' }
  });
  return res;
}

// Is the current request authenticated? (calls /me)
export async function isAuthed(cookieHeader) {
  try {
    const res = await adminApi(cookieHeader, '/me');
    return res.ok;
  } catch {
    return false;
  }
}

// Parse the admin_session value out of an API Set-Cookie header.
export function sessionFromSetCookie(setCookie) {
  const m = setCookie && setCookie.match(/admin_session=([^;]+)/);
  return m ? m[1] : null;
}
export const API_BASE = BASE;
```

---

### Task 2: Auth guard + admin shell layout

**Files:** Create `platform/web/src/routes/admin/+layout.server.js`, `platform/web/src/routes/admin/+layout.svelte`

- [ ] **Step 1:** `+layout.server.js` — guard (let `/admin/login` through):
```js
import { redirect } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/adminApi.js';

export async function load({ request, url }) {
  const onLogin = url.pathname === '/admin/login';
  const authed = await isAuthed(request.headers.get('cookie'));
  if (!authed && !onLogin) throw redirect(303, '/admin/login');
  return { authed };
}
```
- [ ] **Step 2:** `+layout.svelte` — bare on the login page, otherwise the admin shell (own nav, not the public
sidebar). Use `$page.url.pathname` to detect login. Nav: Dashboard / Content / Categories + Logout (POST to
`/admin/login?/logout` action or a small form). Keep IBM Plex + tokens. (Full markup written at build time.)

---

### Task 3: Login page + action (cookie relay)

**Files:** Create `platform/web/src/routes/admin/login/+page.svelte`, `.../login/+page.server.js`

- [ ] **Step 1:** `+page.server.js`:
```js
import { fail, redirect } from '@sveltejs/kit';
import { adminApi, sessionFromSetCookie } from '$lib/server/adminApi.js';

export const actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const password = data.get('password');
    const res = await adminApi('', '/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) return fail(res.status, { error: res.status === 429 ? 'Too many attempts. Wait a moment.' : 'Wrong password.' });
    const id = sessionFromSetCookie(res.headers.get('set-cookie'));
    if (!id) return fail(500, { error: 'No session returned.' });
    cookies.set('admin_session', id, { path: '/', httpOnly: true, sameSite: 'strict' });
    throw redirect(303, '/admin');
  },
  logout: async ({ request, cookies }) => {
    await adminApi(request.headers.get('cookie'), '/logout', { method: 'POST' });
    cookies.delete('admin_session', { path: '/' });
    throw redirect(303, '/admin/login');
  }
};
```
- [ ] **Step 2:** `+page.svelte` — centered card with password input + submit, `use:enhance`, shows `form.error`.

---

### Task 4: Admin API proxy + asset proxy

**Files:** Create `platform/web/src/routes/admin/api/[...path]/+server.js`, `platform/web/src/routes/assets/[id]/+server.js`

- [ ] **Step 1:** `admin/api/[...path]/+server.js` — forward all methods:
```js
import { API_BASE } from '$lib/server/adminApi.js';

async function proxy({ request, params, url }) {
  const target = `${API_BASE}/api/admin/${params.path}${url.search}`;
  const headers = { cookie: request.headers.get('cookie') || '' };
  const ct = request.headers.get('content-type');
  if (ct) headers['content-type'] = ct;
  const method = request.method;
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();
  const res = await fetch(target, { method, headers, body });
  const buf = await res.arrayBuffer();
  return new Response(buf, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
}
export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
```
- [ ] **Step 2:** `assets/[id]/+server.js` — public passthrough so `<img src="/assets/<id>">` works on the web origin:
```js
import { API_BASE } from '$lib/server/adminApi.js';
export async function GET({ params }) {
  const res = await fetch(`${API_BASE}/assets/${params.id}`);
  const buf = await res.arrayBuffer();
  return new Response(buf, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/octet-stream' } });
}
```
- [ ] **Step 3:** `$lib/admin.js` — browser client over the proxy:
```js
async function j(method, path, body) {
  const res = await fetch(`/admin/api${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}
export const adminGet = (p) => j('GET', p);
export const adminPost = (p, b) => j('POST', p, b);
export const adminPatch = (p, b) => j('PATCH', p, b);
export const adminDelete = (p) => j('DELETE', p);
export async function adminUpload(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/admin/api/assets', { method: 'POST', body: fd });
  if (!res.ok) throw new Error('upload failed');
  return res.json(); // { id, url }
}
export async function adminPreview(markdown) {
  return adminPost('/preview', { markdown });
}
```

---

### Task 5: Dashboard

**Files:** Create `platform/web/src/routes/admin/+page.svelte`, `.../+page.server.js`

- [ ] **Step 1:** `+page.server.js` — load admin guides + categories via `adminApi(request.headers.get('cookie'), ...)`,
compute counts (published, drafts, categories). **Step 2:** `+page.svelte` — metric cards + recent edits list.

---

### Task 6: Content list + create

**Files:** Create `.../admin/content/+page.svelte`, `.../content/+page.server.js`, `.../content/new/+page.server.js`

- [ ] **Step 1:** content `+page.server.js` loads `GET /guides` (all). **Step 2:** `+page.svelte` — table (title,
category, difficulty, status badge, updated) + "New topic" form (slug, title, category, difficulty) posting to
`content/new`. **Step 3:** `content/new/+page.server.js` action → `adminApi POST /guides` → redirect to
`/admin/content/<slug>`.

---

### Task 7: Guide editor (the core screen)

**Files:** Create `.../admin/content/[slug]/+page.svelte`, `.../[slug]/+page.server.js`

- [ ] **Step 1:** `+page.server.js` loads `GET /guides/:slug` (guide + phases) + categories (for the select).
- [ ] **Step 2:** `+page.svelte` (the mockup made real, client-interactive via `$lib/admin.js`):
  - Metadata panel: title, summary, category `<select>`, difficulty `<select>`, status `<select>` → Save
    (`adminPatch('/guides/'+slug, {...})`) + Publish toggles status.
  - Phases list: select a phase to edit; Add phase (`adminPost('/guides/'+slug+'/phases', {...})`); delete.
  - Editor: `<textarea>` bound to markdown + toolbar buttons (insert `**`, `#`, fenced code, link, image) +
    a debounced live preview pane (`adminPreview(md)` → `{@html}`); paste/drop image → `adminUpload` → insert
    `![](url)` at cursor. Save phase (`adminPatch('/guides/'+slug+'/phases/'+no, {title,summary,markdown})`).
  - All actions show inline saved/error state.

---

### Task 8: Categories management

**Files:** Create `.../admin/categories/+page.svelte`, `.../categories/+page.server.js`

- [ ] **Step 1:** load `GET /categories`. **Step 2:** `+page.svelte` — list rows with name/slug/icon/blurb,
edit-in-place (`adminPatch('/categories/'+slug, {...})`), add new (`adminPost('/categories', {...})`),
delete (`adminDelete`, surfaces the 409 "not empty").

---

### Task 9: Admin styles + build + live verify

**Files:** Modify `platform/web/src/app.css`; verify

- [ ] **Step 1:** Add admin styles (shell nav, editor split, status badges, metric cards) using existing tokens.
- [ ] **Step 2:** `(cd platform/web && npm run build)` → passes.
- [ ] **Step 3:** Live (API with `ADMIN_PASSWORD_HASH` + web): visit `/admin` → redirected to `/admin/login`;
log in → dashboard; create a topic (draft) → not on public site; add a phase, edit Markdown with live preview,
drag-drop an image → renders; publish → appears on the public site + search; edit a category; logout →
back to login. Screenshot the editor.
- [ ] **Step 4: Commit** `feat(web): admin console UI (login, dashboard, content editor, categories)`.

---

## Self-review
- **Auth/origin:** BFF (cookie relay + proxy) resolves the cross-origin cookie problem; guard redirects
  unauthed; `/assets/[id]` proxy makes uploaded images load on the web origin (and on the public site).
- **Spec coverage:** login (T3), dashboard (T5), content list+create (T6), editor with toolbar/preview/upload
  (T7), categories (T8), guard (T2). Consumes only Part A endpoints — no API changes.
- **Naming:** `adminApi`/`isAuthed`/`sessionFromSetCookie` (server) vs `adminGet/Post/Patch/Delete/Upload/Preview`
  (browser) used consistently.
