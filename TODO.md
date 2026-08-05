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

### 7. Media URLs are cached forever without a cache-buster

Profile pictures and group chat photos are served from a fixed URL, so when someone changes their photo the browser keeps showing the old one. This is why photo changes "don't work" — they did work, you're looking at cache. Append `?v=<something that changes>`.

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
