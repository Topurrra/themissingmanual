# Admin console roadmap

Goal: let an admin run the whole platform from `/admin`. Status legend: **TODO** /
**DOING** / **DONE**. Markers: ⚙️ = needs backend (Rust API/DB) · ⬜ = needs frontend ·
★ = high value / quick win. Update the **Status** column as items land.

## Already shipped (baseline)
| Capability | Status |
|---|---|
| Dashboard (published/draft/category metrics + recently edited) | DONE |
| Content editor — markdown, phases, image upload, status | DONE |
| Categories CRUD | DONE |
| Analytics — views, top paths/referrers/searches | DONE |
| Account — change password (single admin) | DONE |
| Content table pagination | DONE |

## 1. Content & authoring
| Item | Markers | Status |
|---|---|---|
| Bulk actions (publish/unpublish/delete/recategorize/difficulty) | ★ ⚙️⬜ | DONE |
| Filter + sort the content table (status/category/difficulty/updated) | ★ ⬜ | DONE |
| Draft → Review → Published workflow + scheduled publish | ⚙️⬜ | TODO |
| Drag-to-reorder guides in a category & phases in a guide (`order:`) | ⚙️⬜ | BACKEND ✅ (guides + phases) — ⬜ FE |
| Edit history / versioning + diff + revert | ⚙️⬜ | BACKEND ✅ — ⬜ FE (diff view) |
| Editor helpers: insert Mermaid / runnable block; "make fence runnable" toggle | ⬜ | TODO |
| Image / asset library (browse, reuse, delete uploads) | ⚙️⬜ | TODO |
| Unsaved-changes guard + autosave in the editor | ⬜ | TODO |
| Broken-link & orphaned-asset checker | ⚙️⬜ | BACKEND ✅ — ⬜ FE |

## 2. Structure: categories · learning paths · tags
| Item | Markers | Status |
|---|---|---|
| Learning-paths (tracks) editor — DB-backed CRUD (currently hardcoded in `tracks.rs`) | ★ ⚙️⬜ | TODO |
| Category management+ — reorder, icon picker, merge | ⚙️⬜ | TODO |
| Tag manager — usage counts, rename, merge | ⚙️⬜ | TODO |
| Learning-paths sidebar on /paths & /paths/[track] | ⬜ | DONE |

## 3. Search & discoverability
| Item | Markers | Status |
|---|---|---|
| Content-backlog board — dead searches → one-click "draft a guide" | ★ ⚙️⬜ | BACKEND ✅ — ⬜ FE |
| Search tuning — synonyms, pin/boost, fix "did you mean" ranking | ⚙️ | PARTIAL — did-you-mean ranking fixed; synonyms/pin/boost TODO |
| Rebuild-search-index button | ⚙️ | BACKEND ✅ (POST /api/admin/sync) — ⬜ FE button |
| Featured / pinned guides on the homepage | ⚙️⬜ | TODO |

## 4. Analytics, feedback & insights
| Item | Markers | Status |
|---|---|---|
| Per-guide analytics (views/phase, scroll depth, runnable runs, resume usage) | ⚙️ | TODO |
| Trends & period-over-period deltas; CSV export | ⚙️⬜ | TODO |
| Reader feedback — 👍/👎 + note per phase → admin inbox | ★ ⚙️⬜ | DONE |
| Live "reading now" counter / recent activity feed | ⚙️⬜ | TODO |

## 5. Site config & branding (Settings hub)
| Item | Markers | Status |
|---|---|---|
| Manage footer sponsors / social / site name & tagline from admin | ★ ⚙️⬜ | BACKEND ✅ — ⬜ FE |
| Feature flags (lofi, runnable, mermaid, palette); announcement banner; maintenance mode | ⚙️⬜ | BACKEND ✅ (flags + announcement via settings) — ⬜ FE; maintenance mode TODO |
| Lofi playlist manager (upload tracks, edit manifest) | ⚙️⬜ | TODO |
| SEO — meta defaults, sitemap, robots, RSS settings | ⚙️⬜ | TODO |

## 6. Users, access & audit — ⏸️ PARKED (2026-06-19)
> **Parked by request.** Multi-admin + roles + audit log is a security-sensitive auth change (a `users`
> table, role checks across every admin route, invite flow, session/cookie changes) — it deserves its own
> focused epic rather than being folded into a content wave. The single-admin auth stays as-is until then.
> When revisited: design roles (Admin/Editor/Author) + an `audit_log` table written by the admin middleware.

| Item | Markers | Status |
|---|---|---|
| Multiple admin accounts + roles (Admin/Editor/Author) + invites | ★ ⚙️⬜ | ⏸️ PARKED |
| Audit log — every admin action with who/when | ⚙️ | ⏸️ PARKED |
| Session management (sign out everywhere) + optional 2FA | ⚙️ | ⏸️ PARKED |

## 7. Operations / system
| Item | Markers | Status |
|---|---|---|
| Re-ingest / reindex button + cache clear (no API restart needed) | ★ ⚙️ | BACKEND ✅ (POST /api/admin/sync) — ⬜ FE button |
| System status panel — API health, version, DB/index size, recent errors | ⚙️ | BACKEND ✅ (GET /api/admin/status) — ⬜ FE |
| DB backup / restore (export/import) | ⚙️ | TODO |

---

**Suggested first wave:** bulk actions + content filters · content-backlog board ·
reader 👍/👎 feedback · multi-admin + audit log · Settings hub (sponsors/social/flags).
Most are ⚙️ backend endpoints with ⬜ frontend on top.
