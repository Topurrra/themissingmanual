---
title: "Auth, Deployment & Gotchas"
guide: retool
phase: 3
summary: "Locking down who can do what, choosing between Retool cloud and self-hosting, getting changes through review safely, and recognizing where Retool gets awkward."
tags: [retool, permissions, sso, self-hosted, deployment, performance]
difficulty: intermediate
synonyms:
  - "retool permissions and sso"
  - "retool self-hosted vs cloud"
  - "version control retool apps"
  - "retool app slow how to fix"
  - "when not to use retool"
updated: 2026-06-30
---

# Auth, Deployment & Gotchas

A working tool and a safe tool are different things. The wiring from Phase 2 makes a screen do what you want; this phase is about making sure the right people use it, your data stays where it should, changes don't break things in front of users, and you don't get surprised by the spots where Retool fights back. This is the unglamorous half, and it's the half that decides whether your tool survives contact with a real team.

## Permissions: who can see and do what

The first question for any internal tool is who's allowed to touch it. A refund button is fine for support leads and a disaster for everyone else. Retool's model is users grouped into groups, with permissions granted to groups rather than to people one by one. You don't say "Maria can use the Refund Tool" - you put Maria in the Support group and grant the Support group access. New hire joins, you add them to the group, and they inherit everything.

Permissions apply at the app level (who can open this tool) and the resource level (which connections a group is even allowed to query). A common safe setup: an Analysts group that can open dashboards and only touches read-only resources, and an Admins group that can edit apps and reach write resources. There's also editor-versus-user - being able to use an app is separate from being able to change it. Most of your team should be users, not editors.

For sign-in, small teams use email-and-password or Google login. Once you're past a handful of people, you'll want SSO - single sign-on through your identity provider (Okta, Azure AD, Google Workspace) so access follows the same on/offboarding as everything else. SAML-based SSO and SCIM provisioning are paid-plan and self-hosted features, not on the free tier; if "access must be revoked the moment someone leaves" is a hard requirement, budget for it.

## Cloud vs self-hosted

This is the biggest structural decision, and it usually comes down to where your data is allowed to be reached from.

| | Retool Cloud | Self-Hosted |
|---|---|---|
| Who runs it | Retool | You (Docker / Kubernetes) |
| Your DB exposure | Reachable from Retool's servers | Stays inside your network |
| Maintenance | None | You patch and upgrade |
| Setup speed | Minutes | Hours to days |
| Best for | Speed, small teams, non-sensitive data | Strict data rules, internal-only databases |

On the cloud, Retool's servers make the connection to your database, so the database must be reachable from the internet or via a tunnel. For many teams that's a non-starter - production databases are supposed to be unreachable from outside. Self-hosting puts the whole Retool engine inside your own network (a container you run), so queries to your database never leave your perimeter. The price is that you now own the upgrades, the backups, and the 2am page when it's down. Pick cloud unless a data-residency or network rule forces your hand; pick self-hosted the moment one does.

## Shipping changes without breaking things

Early on, people edit the live app while colleagues are using it. That works until the day a half-finished change goes out mid-shift. Retool's answer is release versions: you save named versions of an app and choose which one users see, so you can edit freely and only promote a version when it's ready. Rolling back is selecting the previous version - fast, and worth knowing before you need it.

For teams that treat tools like real software, Retool supports Source Control - connecting an app's definition to Git so changes go through branches and review, mirroring your normal dev workflow. That's overkill for a two-person tool and exactly right for a tool a dozen people depend on. Either way, the principle holds: edit somewhere that isn't what your users are looking at, and promote deliberately.

## Where Retool gets awkward

Knowing the rough edges ahead of time saves you from discovering them under pressure.

- **Performance with big tables.** Dumping tens of thousands of rows into a table and filtering client-side gets sluggish. Filter and paginate in the query - `limit` and `where` on the database side - instead of fetching everything and sorting in the browser. This is the single most common reason a Retool app feels slow.
- **Too many auto-running queries.** Queries set to run on load or on every change can stampede - one input change triggering a cascade of refetches. Be deliberate about which queries run automatically versus on a button.
- **Logic sprawl.** It's tempting to scatter `{{ }}` expressions everywhere. Six months later, finding why a value is wrong means hunting through dozens of tiny bindings. Consolidate real logic into named transformers so there's one place to look.
- **Vendor lock-in.** Apps are defined in Retool's format. Self-hosting and Git export soften this, but you're not going to lift a Retool app into a plain React project. Fine for internal tools you'll keep in Retool; a real consideration if you suspect a tool will graduate into a customer-facing product.
- **It's not a product front-end.** Retool is built for internal users behind a login. It's not the tool for a public marketing site, a customer-facing signup flow, or anything that needs pixel-perfect branding and public scale. Use it for the back office, not the storefront.
- **Cost scales with seats.** Pricing is largely per-user. A tool used by your whole company is a different line item than a tool for five ops people. Know the model before you roll something out org-wide.

The plain summary: Retool is excellent at the thing it's for - internal CRUD tools on data you already have, built fast and maintained by a small team. Respect its boundaries, lock down access from day one, ship changes through versions rather than live edits, and keep your queries doing the heavy lifting on the database side. Do that, and the tools you build will outlast the afternoon you spent building them.
