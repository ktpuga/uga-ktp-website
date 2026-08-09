# What to work on, and what you need to know first

Website-side only. Anything about endpoints, SQL, migrations, Immich or Authentik service accounts lives in the [`ktp-api` README](https://github.com/ktpuga/ktp-api) — this file deliberately doesn't repeat it. Deeper write-ups of every feature are on the docs site (`ktp-docs`).

For how the app is laid out, start with [README.md](./README.md). This file is the **task list plus the things that have actually bitten us**, which is the part you can't get from reading the code.

---

## Part 1 — Traps

Each of these has cost real debugging time here. None of them fail loudly: every one compiles, deploys, and looks like working software.

### 1. `Promise.all` across endpoints with different permissions

**This has bitten twice.** `Promise.all` rejects the whole batch on the first rejection, so mixing a call everyone can make with one they can't means a 403 silently discards the good data too.

- `PortalDashboard` fetched members + photos together; both are closed to rushees, so the rush dashboard errored outright. That's why `RushDashboard` is a separate component.
- `PollsPage` fetched polls + committees together. `/committees` is member-only, so for a rushee the 403 threw away the polls as well — and the tab rendered **permanently empty with no error**, which is the worst possible failure.

Give every call in a fan-out its own catch:

```js
const [events, meetings] = await Promise.all([
  getEvents(),
  getMeetings().catch(() => []),   // 403s for rushees — must not take events with it
]);
```

`EventsCalendar` already does this across events/meetings/interviews. **Keep the per-call catch when you add a fourth source.** Grep for `Promise.all` before adding anything to `/rushee`.

### 2. `GROUP_ORDER` must match the API's `roleGroups.js`

**Also bitten twice.** Both places bucket a member by group against a local list, and both fall back silently rather than erroring:

| File | What a missing group does |
|---|---|
| `lib/portal-format.js` → `MEMBER_GROUP_ORDER` (used by `MemberDirectory`) | lands them in **Active** — rushees appeared in the member directory with their emails |
| `components/admin/UserManagementPage.jsx` → its own `GROUP_ORDER` | shows them as **"unassigned"** |

Adding a role to `ktp-api/constants/roleGroups.js` means editing **both** of those.

### 3. `redirect()` throws on purpose — never swallow it

Next implements `redirect()` by throwing `NEXT_REDIRECT`, which has to propagate uncaught. A `try/catch` around a server action eats it and renders the literal string `"NEXT_REDIRECT"` as an error message.

```js
import { isRedirectError } from '@/lib/is-redirect-error';

try {
  await someServerAction();
} catch (err) {
  if (isRedirectError(err)) throw err;   // required
  setError(err.message);
}
```

Fixed across ~10 files already. Don't reintroduce it.

### 4. `/rush` is public, `/rushee` is the portal

`/rush` and `/rush/how-it-works` are **public marketing pages** linked from the homepage. The rushee portal is `/rushee`. Putting a portal `layout.jsx` under `/rush` wraps the public page in the authenticated shell and breaks it for signed-out visitors. The `proxy.ts` matcher covers `/rushee` and deliberately not `/rush`.

### 5. A build cannot catch a wrong sidebar

Each portal owns its nav in `app/<portal>/layout.jsx` (`buildNav`). A wrong href compiles perfectly and just... goes somewhere wrong, or vanishes. If you change nav, click through every portal, or evaluate the `buildNav` functions in Node and diff the href sets.

Several shared components take an `accent` prop with **no default** — omitting it doesn't error, it quietly renders an older unstyled variant. A page that looks unexpectedly plain is usually a missing accent.

### 6. Any user-supplied value that becomes an `href` must be sanitised

**`new URL()` is not a safety check.** `new URL("javascript:alert(1)")` parses fine — it's a valid URL. An `href` is a different trust context from a text node: React escapes text, so a hostile string in a name or bio is inert, but `<a href={value}>` with `javascript:` runs in the reader's session.

We shipped exactly this bug: document links were validated with `try { new URL(raw) } catch {}`, and `PhotoFiles.jsx` renders them as links. Fixed 2026-08-05.

Use `linkedinHref()` in `lib/portal-format.js` on the render side, and make sure the API validates on write (`services/urls.js`). If a value fails, render **no link** rather than a broken one.

### 7. Some profile fields write to Authentik, not just to us

**Username is the one that does.** Authentik owns login identifiers, so `PUT /users/me/username` writes there first and only mirrors into our database once that succeeds — and it needs an Authentik permission (`Can change User`) that isn't granted by default.

Practical consequences if you touch profile code:

- It's a **separate endpoint and a separate control** (`components/profile/UsernameEditor.jsx`), not a field in `ProfileForm`. Don't "tidy" it back into the form: a rename fails with "that name is taken", which inside the main form surfaces as a whole-form error on a save that was really about someone's bio.
- The access token keeps the **old** username for the rest of the session after a rename, so anything that writes `username` from `session.user` will silently undo it.

### 8. A Server Action that throws loses its message in production

React replaces it with the generic **"An error occurred in the Server Components render"** (error #441). So a `throw new Error('That username is taken')` inside a server action reaches the browser as that string instead — and if you render `err.message`, that's what the member reads.

If the failure is meant to be *read by a person*, **return `{ error }` instead of throwing** and check for it at the call site. `uploadProfilePicture` and `updateUsername` in `lib/portal-api.js` are the pattern. Throwing is still right for `redirect('/login')`, which isn't a message.

This shipped wrong once already, on the username feature.

### 9. Media URLs are cached forever without a cache-buster

Profile pictures and group chat photos are served from a fixed URL, so when someone changes their photo the browser keeps showing the old one. This is why photo changes "don't work" — they did work, you're looking at cache. Append `?v=<something that changes>`.

### 10. A session in the cookie is not proof of who is at the keyboard

There are **two** sessions in a browser: ours (the NextAuth cookie) and Authentik's own SSO cookie. Nothing keeps them in step, and a `refresh_token` isn't tied to the browser session, so ours renews itself happily while Authentik's belongs to somebody else.

That happens routinely, not rarely: a member is signed in, someone scans the rush QR code on the same laptop, and enrolling makes Authentik's session the **new rushee** while our cookie still says **member**.

`/login` and `/auth/start` used to `redirect()` the moment they saw any session. Two things followed — the rushee landed inside the member's portal, and the next time our cookie lapsed the silent `prompt=none` probe asked Authentik who this was, got the rushee, and rewrote the member's session. That's the "my username changed by itself" report.

Both pages now render `AlreadySignedIn` instead of redirecting. If you're editing sign-in:

- **`/auth/start` is the only guard that catches a QR-code signup.** The link goes straight to Authentik; the site sees nothing until `next=` brings the browser back. Don't move logic out of it on the grounds that `/rush/how-it-works` already checks — most rushees never load that page.
- **`switchAccount()` must not become `logoutEverywhere()`.** It clears only our cookie on purpose: Authentik's session may be the *other* person's brand-new account, and ending it makes them sign up again.
- **The `prompt=login` on `/login?switch=1` is load-bearing**, not belt-and-braces. Without it, "sign in as someone else" silently reuses Authentik's session and returns the account the person just rejected — a loop, on `/auth/start`.
- **Every entry point needs its own `takeAutoSignInSlot` name.** Sharing one broke signup once already; see `lib/sso.js`.
- **`AutoSignIn`'s cooldown branch must not redirect** — it stops and waits for a click. It used to `router.replace('/login')`, which closed a loop the day `/login` gained a button leading back toward `/auth/start`. The guard fires exactly when something upstream is already bouncing the browser, so redirecting hands control to a page that may hand it straight back. Keep the stop.

### 11. "Signed out" may not mean signed out of Authentik

Confirmed 2026-08-09: signing out cleared our cookie but left the **Authentik SSO session alive**, because the OAuth2 provider's *Invalidation flow* was the provider-scoped one (`default-provider-invalidation-flow`), which ends only the application session. `post_logout_redirect_uri` is still honoured, so it looks like it worked.

Nothing in this repo can detect it — a `refresh_token` isn't tied to the browser session. **Don't debug this in code.** Check Authentik → Providers → ktpapp → Invalidation flow, and verify by signing out then opening `auth.ugaktp.com` directly.

This is the enabler for the whole "two sessions in one browser" family, up to and including rush enrollment renaming the account that was still signed in.

---

## Part 2 — The to-do list

Roughly in the order I'd take them. Each says what "done" looks like.

### A. Profile-picture cache-busting — *small, well-defined, good first one*

Only `components/profile/ProfileForm.jsx` appends `?v=`. **Six other call sites don't**, so a member who changes their photo keeps seeing the old one everywhere else until a hard refresh:

```
components/admin/UserManagementPage.jsx
components/portal/CommitteesPage.jsx
components/portal/MemberDirectory.jsx
components/portal/MessagesPage.jsx
components/portal/PortalShell.jsx
components/profile/EditProfilePage.jsx
```

The tricky part isn't adding `?v=` — it's picking a value that changes **when the photo changes** and not on every render (which would defeat the browser cache entirely and re-download every avatar on every paint). Group chat photos solved it with `?v=<asset_id>`, since Immich issues a new asset id per upload. Prefer that over a timestamp.

**Done when:** changing your photo updates it in the directory, the sidebar, messages and user management without a hard refresh, and avatars still come from cache on an ordinary page load.

### B. Form-level input validation — *the big one, coordinate first*

There is **no validation library anywhere** and almost nothing checks *format* — only presence. Profile fields (`phone`, `major`, `pledge_class`, `preferred_name`, both emails, `dob`, `graduation_date`) are unbounded free text, as are announcement/event/poll/committee/album/document titles and bodies.

The website half is inline field-level errors, matching the pattern now in `ProfileForm.jsx` for LinkedIn: validate on submit, show the message next to the field, keep the API as the real authority.

**Talk to Yash before starting** — whether to hand-roll or add a schema library is his call, and the API half has to agree with the website half.

**Done when:** a bad value produces a message beside the field instead of a red banner or a silent save.

### C. Interview slot editing UI

`PATCH /interviews/slots/:id` exists, works and is documented, but nothing calls it — editing a slot today means deleting and re-adding it. `InterviewScheduleManager.jsx` is where it goes.

This is mostly a UI job: the API already handles the awkward case, returning **409** if you lower capacity below the number of people already booked. Surface that as a readable message rather than a generic failure. (`DELETE` behaves the same way — 409 if booked, `?force=true` to override.)

**Done when:** eboard can change a slot's time or capacity in place, and the over-capacity 409 reads as an explanation rather than an error.

### D. Member-created group chats

Currently only committee chats and the eboard chat exist. The API already has `group_chats.is_member_created` waiting for this. The rule Yash set: **eboard cannot see member-made chats unless someone files a report.**

**Done when:** a member can create a chat, and it does *not* appear in eboard's oversight list.

### E. Granular permissions — *parked until after rush, and genuinely large*

Grant capabilities — upload files, make albums, post announcements and events — to **groups or individual people**, administered through a picker like the existing audience selector. Raised 2026-08-09 and deferred the same day: it's a big change and rush season comes first. **Don't start it without a fresh conversation.**

Today there is no such concept. Permission is a group name spelled out at each route by `requireGroup(...)`:

| Gate | Routes |
|---|---|
| `requireGroup("eboard")` | 43 |
| `requireGroup(...SHARED_ALBUM_GROUPS)` | 12 |
| `requireGroup(...RUSH_ACCESSIBLE_GROUPS)` | 7 |
| `requireGroup("eboard", "chair")` | 4 |

Design positions already agreed enough to build from:

- **Grants live in our Postgres, not Authentik**, and are looked up server-side per request. Authentik groups keep doing portal routing. Putting permissions in the JWT re-inherits every staleness problem in trap #10 above — and revocation would only take effect at next full sign-in.
- **Union only, no explicit deny.** Deny means precedence, precedence means nobody can predict what a person can do.
- **Permission names are a fixed enum in code**, like `roleGroups.js`. Each must map to a real route — a free-form name typed into a UI is a permission that silently does nothing, which is how this feature usually rots.
- **Seed the table to reproduce the table above byte for byte**, then let eboard diverge. Makes the migration verifiable rather than a leap.
- **Eboard keeps a bypass, or at least a lockout guard** — otherwise revoking the grant permission leaves only SQL as a way back in.
- Build the **per-permission** view first ("who can create albums?"); add a per-person summary later.

The UI is mostly already built: `AudienceSelect.jsx` for group pills, and the "Or pick people" picker in `MeetingsPage.jsx`.

**Still undecided:** the full capability list; whether rushees/pledges can hold grants at all; and whether permissions are global or per-object ("upload files" vs "upload to *this* folder" — the latter is a much bigger feature).

**Blast radius:** 60+ routes and both clients. iOS gets enforcement free since it shares the endpoints, but its UI will show buttons that start 403ing. Needs phasing.

---

## Part 3 — Working here

- **Branch, PR, don't push to `main`.** `main` deploys to production the moment it's pushed, for both this repo and the API. There is no staging environment.
- **`npm run build` before you open a PR.** It's the only thing that catches a broken import, and it's fast.
- **`npm run build` rewrites** `public/robots.txt` and `public/sitemap*.xml`. Those are git-ignored now, so you don't need to revert them.
- **There's no mock or offline mode** — you need a real Authentik account in a real group to see past the login screen.
- **Don't edit the database directly.** Ask Yash or Infrastructure.
- **`lib/admin-nav.cjs` is dead** — zero importers, a stale copy of an older admin nav. Don't edit it thinking it's live.

### Where to read more

| Topic | Where |
|---|---|
| App layout, routes, env vars, deployment | [README.md](./README.md) |
| Portal component conventions | [components/README.md](./components/README.md) |
| Endpoints, SQL, migrations, Immich, Authentik | `ktp-api` README |
| Per-feature deep dives (rush, interviews, messaging, visibility, sign-in) | the `ktp-docs` site |
