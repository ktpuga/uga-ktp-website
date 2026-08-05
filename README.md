# uga-ktp-website

The public marketing site **and** the member portal for Kappa Theta Pi, Phi Chapter at UGA. Next.js 16 (App Router, Turbopack), Tailwind v4, NextAuth v5 against Authentik SSO, with Sanity powering the blog.

**Production:** [ugaktp.com](https://ugaktp.com)

This repo is the frontend only. All chapter data lives behind [`ktp-api`](https://github.com/ktpuga/ktp-api); this app never talks to PostgreSQL or Immich directly.

> **New here, or looking for something to pick up?** [**TODO.md**](./TODO.md) has the current task list plus the traps that have actually caused bugs in this codebase — the things you can't get from reading the code.

---

## How it fits together

| Piece | Role |
|---|---|
| **This app** | Public pages + four authenticated portals (`/member`, `/admin`, `/pledge`, `/rushee`). Holds no chapter data of its own |
| **Authentik** (`auth.ugaktp.com`) | Login, passwords, and group membership. NextAuth stores the resulting access token server-side only |
| **ktp-api** (`api2.ugaktp.com`) | Every read/write of real chapter data. Called from server actions in `lib/portal-api.js` |
| **Sanity** | Blog content only (`/blog`). Unrelated to the portal. The Studio is no longer embedded — see [Sanity Studio](#sanity-studio) |

Media never reaches the browser from Immich directly. Routes under `app/api/**/media` proxy each file server-side so the Immich API key stays on the server — see [Media proxying](#media-proxying).

---

## Getting started

```bash
npm install
cp .env.example .env    # then fill it in — see the notes inside
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with a real Authentik account. `localhost:3000` is already registered as a redirect URI on the `ktpapp` provider, so no Authentik change is needed.

You need a real account in a real group to see anything past the login screen — there is no mock/offline mode. If the local database is in a bad state, ask Infrastructure rather than editing it directly.

| Script | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build. Runs `next-sitemap` afterwards |
| `npm start` | Serves an existing build |

> **`npm run build` rewrites `public/robots.txt`, `public/sitemap.xml` and `public/sitemap-0.xml`** via the `postbuild` step. Those three are **git-ignored** — you no longer need to revert them after a build. See [Sitemap and robots.txt](#sitemap-and-robotstxt).

---

## Routes

### Public

| Path | Page |
|---|---|
| `/` | Homepage |
| `/rush` | Rush info and schedule |
| `/members-list` | Public "meet the chapter" roster |
| `/blog`, `/blog/[slug]` | Sanity-backed blog |
| `/sponsorship`, `/hackathon`, `/links` | Standalone marketing pages |
| `/privacy`, `/code-of-conduct`, `/community-guidelines` | Policy pages (required for App Store review) |
| `/login` | SSO entry point |
| `/checkin/[eventId]/[token]` | QR attendance check-in landing page |

`/members-list` reads the public `GET /roster` endpoint, which deliberately exposes far less than the authenticated directory — no email, phone, major, or pledge class. It also excludes pledges, test accounts, and anyone without a profile picture.

### Portals

Four portals. `/admin` is eboard; `/member` covers `chair`, `active` **and `alumni`**; `/rushee` is for prospective members during rush.

| | `/member` | `/admin` | `/pledge` | `/rushee` |
|---|---|---|---|---|
| Accent | blue | maroon (or blue) | blue | blue |
| Dashboard | ● | analytics | ● | ● |
| Announcements | ● | ● | ● | ● |
| Calendar | ● | ● | ● | ● |
| Directory | ● | — | ● | — |
| Rushees | ● | ● | ● | — |
| Meetings | ● | ● | ● | — |
| Interviews | — | ● | — | ● |
| Committees | ● | ● | — | — |
| Polls | ● | ● | ● | ● |
| Files & Photos | ● | ● | ● | — |
| Messages | ● | ● | ● | ● |
| Attendance | chair only | ● | — | — |
| Settings | ● | ● | ● | ● |

Admin additionally has Announcements authoring, Reports, User Management, Activity Log, Rush Signup, Rush Announcements, Homepage Photos, and iOS Homepage Slideshow.

Three deliberate absences, none of them CSS — **the routes don't exist**: pledges have no Committees, `/admin` has no Directory (User Management replaces it), and `/rushee` has no Meetings (Interviews replaced it) or Files.

The **Rushees** tab appears only while `GET /members/rush-count` is above zero, so it shows up during rush and disappears afterwards on its own.

> **There is no `/alumni` portal.** It was a copy of `/member` in amber and was deleted 2026-08-05; alumni share `/member`, and `/alumni/*` 307-redirects there via `next.config.js`. Don't re-add it.

---

## Auth and route protection

`proxy.ts` runs on every portal path and enforces, in order:

1. **Not signed in, or a token refresh failed** → `/login`. The refresh-failure check matters: without it the page loads and then dies on the first API call with a dead token.
2. **`profile_complete === false`** → `/complete-profile`, before anything else.
3. **Portal boundaries** — each group only reaches its own portal. Wrong-portal requests redirect to `homePortal(groups)` rather than 403ing.

`auth.ts` handles the OIDC session and owns two things worth knowing about:

- **Token refresh.** Authentik access tokens are short-lived. `auth.ts` captures `refresh_token`/`expires_at` (via the `offline_access` scope) and renews automatically. A failed refresh sets `session.error`, which `proxy.ts` above treats as signed-out.
- **Concurrent-refresh de-duplication.** Dashboard pages fire several server actions in parallel, each of which could independently decide to refresh at the same instant — and Authentik rotates refresh tokens on use, so whichever request lands first invalidates the others. An in-flight `Map` collapses concurrent refreshes for the same token into one request. This is safe only because dev and production both run a single Node process.

The access token is available exclusively in server-side code as `session.access_token`. It is never sent to the browser.

**Signing out** must go through `logoutEverywhere()` in `lib/auth-actions.js`, not NextAuth's `signOut()`. `signOut()` alone clears this app's cookie but leaves the Authentik SSO session intact, so the next login silently re-authenticates as the same person. `logoutEverywhere()` performs a full RP-initiated logout against Authentik's end-session endpoint.

---

## Talking to ktp-api

All API access goes through **server actions** in `lib/portal-api.js`. Client components import and call those; they never `fetch` ktp-api themselves, because the access token isn't available to them.

```js
'use server'
import { apiRequest } from '@/lib/portal-api'

export async function getCommittees() {
  return apiRequest('/committees')
}
```

`apiRequest()` attaches the bearer token and, on a 401, calls `redirect('/login')`.

> **`redirect()` throws on purpose.** Next.js implements `redirect()` by throwing a `NEXT_REDIRECT` signal that must propagate uncaught for navigation to happen. A `try/catch` around a server action will swallow it and render the literal string `"NEXT_REDIRECT"` as an error message. Every catch block around a server action must re-throw it:
>
> ```js
> import { isRedirectError } from '@/lib/is-redirect-error'
>
> try {
>   await someServerAction()
> } catch (err) {
>   if (isRedirectError(err)) throw err
>   setError(err.message)
> }
> ```
>
> This bug has been fixed across ~10 files already. Don't reintroduce it.

**After mutating data that the session caches** (notably `profile_complete`), call `update()` from `useSession()` so the session reflects the new state before you navigate.

### Media proxying

Anything stored in Immich is served through a Next.js route under `app/api/`, which forwards to ktp-api server-side:

| Route | Backs |
|---|---|
| `/api/photos/[id]/media` | Shared album photos |
| `/api/users/[id]/profile-picture/media` | Profile pictures |
| `/api/roster/[id]/media` | Public roster photos |
| `/api/homepage-photos/[id]/media` | Public homepage gallery |
| `/api/group-chats/[id]/photo/media` | Group chat avatars |
| `/api/messages/[messageId]/attachment` | DM attachments |
| `/api/documents/[id]/download`, `/preview` | Document library |

Point `<img src>` at these, never at ktp-api or Immich directly.

---

## Project layout

```
app/
  (public pages)/        homepage, rush, blog, policies, members-list
  member|admin|alumni|pledge/   the four portals — each has its own layout.jsx + NAV
  api/                   media proxy routes + NextAuth handler
components/
  portal/                shared portal UI (PortalShell, dashboards, calendar, messages…)
  profile/               settings + the shared ProfileForm
  admin/, analytics/     admin-only surfaces
  ui/                    shadcn-style primitives
lib/
  portal-api.js          every ktp-api server action
  auth-actions.js        logoutEverywhere()
  portal-format.js       shared name/group/date formatting
  is-redirect-error.js   the NEXT_REDIRECT guard described above
sanity/                  blog schema + client
proxy.ts                 portal access control (was middleware.ts before Next 16)
auth.ts                  NextAuth config, token refresh
```

### Portal components are shared across all four portals

Nearly everything under `components/portal/` is one component rendered by all four portals, switched by an `accent` (or `theme`) prop. In practice that is `blue` everywhere except `/admin`, which is `red` or `blue` per the viewer's own setting; `amber` and `teal` still exist in `PALETTES` but nothing renders them since `/alumni` was removed. Editing one of these files changes every portal at once. See [`components/README.md`](components/README.md) before adding anything portal-specific.

Two conventions that will silently break a portal if missed:

1. **Adding a nav item is one edit** — the grouped `NAV` array in `app/<portal>/layout.jsx`. The sidebar renders exactly that, in that order. This used to take two edits (the layout array *and* `NAV_GROUPING` in `PortalShell.jsx`) with an href in only one silently disappearing; that second list is gone.
2. **Adding a colour is one edit** — `PALETTES` in `components/portal/PortalAccentContext.jsx`, the single definition that every shared component imports. (`REVAMPED_ACCENTS` in `PortalShell.jsx` still controls sidebar styling, but a missing key there now falls back to blue instead of emptying the sidebar.)

Also note that several components take an `accent` prop with **no default value**. Omitting it doesn't error — it quietly renders the older unstyled variant. If a page looks unexpectedly plain, check that its wrapper passes an accent.

### Profile pictures

Use a plain `<img>` with an `onError` fallback to initials, which is the established pattern throughout the portal. Prefer it over shadcn's Radix `Avatar` — Radix's `AvatarFallback` has a real-world quirk where it can stay visible even after the image loads, which produced an initials-only-avatars bug more than once here.

---

## Sanity Studio

**The Studio is no longer embedded in this app.** There is no `/studio` route — it was removed during the Next.js 16 migration, because `next-sanity` 12+ requires Sanity 5/6 and because that one route was a 1.49 MB chunk of the production bundle and the main driver of the build OOM on LXC 116.

The schema and CLI config still live here (`sanity.config.js`, `sanity.cli.js`, `sanity/schemaTypes/`), and `sanity` / `@sanity/vision` / `@sanity/icons` are now **devDependencies** — present for the CLI, absent from the production bundle and the Docker runtime image.

```bash
npm run studio:dev      # edit content locally at localhost:3333
npm run studio:deploy   # publish to <project>.sanity.studio (free, hosted by Sanity)
```

> **Not yet done:** `studio:deploy` has never been run. Until someone runs it once, blog content is only editable locally via `studio:dev`.

Reading the blog is unaffected — `/blog` and `/blog/[slug]` go through `@sanity/client` and `groq` via `next-sanity`, which remains a production dependency.

---

## Environment variables

See `.env.example` for the authoritative list and per-variable notes. Summary:

| Variable | Notes |
|---|---|
| `AUTHENTIK_CLIENT_ID` / `AUTHENTIK_CLIENT_SECRET` | From the `ktpapp` OIDC provider. Same values locally and in production |
| `AUTHENTIK_ISSUER` | `https://auth.ugaktp.com/application/o/ktpapp/` |
| `AUTH_SECRET` | Generate your own locally (`openssl rand -base64 32`). Never reuse production's |
| `AUTH_URL` | `http://localhost:3000` locally, `https://ugaktp.com` in production |
| `AUTH_TRUST_HOST` | Required in production only — Traefik proxies the request, so NextAuth can't infer the host |
| `API_URL` | `https://api2.ugaktp.com` locally; `http://10.0.0.53:4000` on the server (direct LAN, skips Traefik) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` / `_DATASET` / `_API_VERSION` | Blog only. Baked in at build time as Docker build args |

---

## Deployment

Runs in Docker on **LXC 116**; Traefik on LXC 100 routes `ugaktp.com` to it. Pushing to `main` triggers a self-hosted GitHub Actions runner (`.github/workflows/deploy.yml`) which rebuilds the container and posts the result to Discord.

`next.config.js` carries two non-obvious settings, both load-bearing:

- **`output: 'standalone'`** — required for the Docker image.
- **`experimental.serverActions.bodySizeLimit: '250mb'`** — Server Actions default to a 1MB request body regardless of what ktp-api's multer limits allow. Every upload in this app goes through a server action, so without this every real photo upload is rejected by Next.js before ktp-api ever sees it.

The Dockerfile sets `NODE_OPTIONS=--max-old-space-size=3072`. LXC 116 has 4GB of RAM and the build used to get OOM-killed without a heap cap. The single biggest contributor — Sanity Studio bundled into a route — is gone as of the Next 16 migration, so there is more headroom now, but the cap is still there and there's no reason to remove it.

### Local build troubleshooting

- **Stale `.next` cache** causes a broad class of bizarre, unreproducible errors. Delete `.next` and rebuild before investigating anything strange.
- **Stop the dev server before `npm run build`** — both write to `.next` and will interfere.

---

## Rush signup lives on one page

`/rush` is the marketing page: countdown, FAQ, timeline. Its primary CTA goes to **`/rush/how-it-works`**, not to Authentik.

Account creation exists **only** on `/rush/how-it-works`, so nobody signs up before reading what they are signing up for. That page owns the signup button and its own `getPublicRushSignup()` check; `/rush` no longer calls that endpoint at all.

The CTA renders unconditionally. The signup button it replaced was hidden while rush was closed, because an inert "Sign up" reads as a broken site — but an internal link to a page explaining the process is never dead, and is arguably most useful in the off-season.

---

## Sitemap and robots.txt

Generated by `next-sitemap` in the `postbuild` step, and **git-ignored** — they are build output, and committing them produced a diff on every build as each `<lastmod>` timestamp changed.

`next-sitemap.config.js` excludes every authenticated route. Before that, `ugaktp.com/sitemap.xml` advertised `/admin`, `/member`, `/alumni`, `/pledge`, `/rushee` and `/complete-profile` to search engines. Nothing leaked — `proxy.ts` redirects all of them to `/login` — but publishing the admin portal's URL is pointless for SEO and needlessly describes the app's shape.

When adding a portal route, add both the bare path and its wildcard: `'/admin'` alone does not cover `/admin/users`.
