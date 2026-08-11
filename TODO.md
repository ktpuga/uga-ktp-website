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

**Every export in `lib/portal-api.js` is a Server Action** — the `'use server'` is on line 1 and covers the whole file, which is easy to forget when a function looks like a plain fetch wrapper.

This has now shipped wrong **twice**: first on the username feature, then on interview deletion, where the "N people have already booked this slot" warning — the only thing standing between a misclick and real cancelled interviews — read as the #441 digest in production for six days. Nobody reported it; it was found by reading the file while building something else.

**A useful smell: any endpoint that answers 409 is carrying a message somebody has to read.**

### 9. Media URLs are cached forever without a cache-buster

Profile pictures and group chat photos are served from a fixed URL, so when someone changes their photo the browser keeps showing the old one. This is why photo changes "don't work" — they did work, you're looking at cache. Append `?v=<something that changes>`.

**For profile pictures this is now solved centrally — use it rather than rebuilding it.** `lib/avatar.js` owns every avatar URL: `profilePictureSrc(id, assetId)`, `rosterPictureSrc(id, assetId)`, and `avatarAssetId(member)` to read the id off whatever projection you were handed. Grep will tell you there are no hand-built `profile-picture/media` template literals left, and it should stay that way.

The version is the **Immich asset id**, never a timestamp or a counter. Immich issues a new asset per upload, so the id changes exactly when the picture does and is stable in between; a timestamp changes on every render and re-downloads every avatar in the directory on every page load, which is a worse bug than the one it fixes.

Two follow-on traps, both of which produce a blank or frozen avatar with no error anywhere:

- **A `null` src is not a failed load.** React omits the attribute entirely, so `onError` never fires. Guard on the src itself (`{src && !err ? …}`), not just on the error flag, or a member with no id gets an empty circle forever instead of their initials.
- **A boolean `err` flag is sticky for the life of the mount.** `PortalShell` is a layout and never remounts on client-side navigation, so a member whose photo 404'd once at sign-in would keep their initials for the whole session even after uploading one. Key the error state on the asset id, the way `GroupChatAvatar` does.

And the sidebar has one more wrinkle: it reads the profile exactly once per full page load, so an upload elsewhere in the portal can't reach it. That's what `PROFILE_PICTURE_CHANGED_EVENT` / `announceProfilePictureChange()` are for. If you add another surface that changes a member's own photo, fire it.

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

### 12. Sidebar badge counts duplicate the API's visibility rules

The per-tab badges (`lib/use-tab-notifications.js` → `GET /notifications/unread`) are counted by SQL in the API's `notificationCursorModel` that **restates** the audience predicate from `announcementModel`, `eventModel`, `pollModel` and `visibility.js`.

That duplication is deliberate — each model owns its own predicate, and the counts have to agree with them — but it means **changing an audience rule in one place and not the other produces a badge for something the member cannot open.** That's a disclosure, not a cosmetic bug. `ktp-api/test/notificationCursors.test.js` covers it, including the "no audience means all *members*, not rushees" case; run it after touching any targeting logic.

Two smaller ones in the same area:

- **The tab list exists twice** — `NOTIFICATION_TABS` here and `notificationCursorModel.TABS` plus a `CHECK` constraint in the API. A tab in one and not the other doesn't error, it just never badges.
- **Badges render in four places in `PortalShell`** (desktop revamped, desktop legacy, and a mobile sheet for each). They all read `badgeFor(href)` now; don't re-inline a condition into one of them.

---

## Part 2 — The to-do list

Roughly in the order I'd take them. Each says what "done" looks like.

### ~~A. Profile-picture cache-busting~~ — DONE 2026-08-11

Every avatar URL in the app is now built by `lib/avatar.js` and versioned on the Immich asset id. Trap #9 above carries the rules; this entry records what actually changed and the two things the work turned up.

**Eight surfaces, not the six listed here.** The six were right, but `ProfileForm` itself was only half-fixed and the public roster was missed entirely:

- `ProfileForm.jsx` had a **render counter starting at 0**, which changed the URL only after an upload in that session. The member saw their own new photo immediately and concluded it worked; everyone else, and every other tab in their own portal, kept the old one. It now seeds from the saved asset id and takes the new one from the upload response.
- **`/members-list`, the public roster**, had no buster at all. It is the most visible place a stale photo can sit, and it needed an API change: `rosterController` reshapes rows into camelCase and was dropping `profile_picture_asset_id` on the way out. The id is an opaque Immich uuid and `/roster/:id/media` ignores it, so publishing it grants nothing that route didn't already give away.

**`GET /users/blocked` was missing the column too** — `userBlockModel.findBlockedByUser` never selected it, so Settings' blocked list had nothing to key on. Both projections are now pinned by `ktp-api/test/avatarAssetIds.test.js`, which was checked against the unfixed code first: all three assertions fail without the change. That test exists because this failure is silent — a missing column renders as an empty value, which is exactly how `linkedin_url` sat unselected by all three of `memberModel`'s projections for months.

**The sidebar needed more than a URL.** `PortalShell` is a layout: it mounts once per full page load and survives every client-side navigation, so its one `getProfile()` call was the only one all session. Cache-busting alone would have left the sidebar showing the old photo after an upload — the same complaint, relocated. It now listens for `PROFILE_PICTURE_CHANGED_EVENT` and re-reads the profile.

**Done when:** ~~changing your photo updates it in the directory, the sidebar, messages and user management without a hard refresh, and avatars still come from cache on an ordinary page load.~~ **Met.** Nothing re-downloads on an ordinary page load: the URL is stable until the asset id changes.

**Live and confirmed in a browser by Yash, 2026-08-11** ("clicked through and looks good"), covering the sidebar updating without a refresh and the directory, messages and user management in the same session.

### ~~B. Form-level input validation~~ — DONE 2026-08-11

**The "hand-roll or add a schema library" question is settled: hand-rolled.** The API is plain CommonJS with no TypeScript, so zod's main benefit (inferred static types) buys nothing, and the rules that have actually caught bugs here are domain rules a schema library would not express any better. `services/validate.js` in `ktp-api` holds the primitives (`intId`, `uuid`, `boundedText`, `enumValue`, `isoDate`, `dateOnly`, `intIdArray`, `uuidArray`), each returning `{ value }` or `{ error }` and never throwing.

**Done on the API side:**

- **All profile fields.** `phone`, `major`, `pledge_class`, `preferred_name`, `dob`, `graduation_date` and both names are bounded and format-checked in `services/profileFields.js`, which is the single normalizer behind both the member's own save and eboard's edit-anyone route.
- **Reports.** `content_id` was a one-request denial of service against every eboard group chat read.
- **Poll and announcement `audience`** — which turned up a live bug: they validated against the wrong allowlist, so the portal's **Rushee pill returned 400** and nothing could be announced to rushees.
- **The id arrays.** The `.map(Number).filter(Number.isInteger)` idiom silently **dropped** a malformed id rather than rejecting it, so a request naming five committees and one typo returned 200 having applied four. All five call sites now use `intIdArray`: `committee_ids` on group chat create and audience update and on meeting create, `interviewer_committee_ids` on interview schedule create and update, and `option_ids` on a poll vote. Pinned by `test/idArrays.test.js`.

  Interviews were the worst of them, and the reason is worth keeping: a **non-array** fell into the same branch as an empty list, which there means "no committee may staff this round". So sending `"3"` instead of `[3]` did not fail, it shut the round and looked deliberate. An absent key still means "leave it alone", which is what PATCH depends on.

  `visibility.js` was the sixth site, done in the same pass. `parseAudience` is the **write-side** audience parser shared by album create, folder create and the three visibility-update routes. It is the one where the old behaviour was unsafe rather than just wrong: dropping an id from a *restriction* widens who can see the content, so restricting a folder to five committees and one typo returned 200 having restricted it to four.

- **The uuid lists**, which failed the opposite way. Nothing was dropped: `member_ids`, `invitee_ids`, `user_id` and the `:userId` param went through untouched into a `UUID` column, so a malformed one was `22P02` and a **500** rather than a 400. `createMemberGroupChat` is the clearest case, the id reached `userModel.findById` before its own "no longer has an account" check could answer.

- **Titles and bodies**, which were unbounded everywhere. Announcement and rush announcement titles and bodies, event title/description/location, poll question/description/option labels and option count, committee, album, folder and group chat names, document link names. Caps live in one place, `services/textLimits.js`, mirrored on the website by `lib/text-limits.js`. Pinned by `test/textLimits.test.js`, including that the boundary is inclusive.

  They **reject rather than truncate**, which is the opposite of `about_me`. The difference is that a bio is one field of many on a save worth keeping, whereas nobody re-reads an announcement they just published to check whether the last paragraph survived.

  Two scalar ids got fixed alongside, because they sat in the statements being rewritten and were the same 500: `committee_id` on announcements and polls, `parent_id` on a folder, `folder_id` on a document link.

- **Message bodies and reactions**, done as their own pass because the cap had to fit around two existing rules. A message may have **no body** when it carries an attachment, so the length check is `required: false` and the either-or check still answers; and it runs **before `storeAttachment`**, so a rejected message cannot leave an orphaned upload. `MESSAGE` is 4000, its own number rather than sharing `BODY`, because every message goes back through the sync envelope on each catch-up and its opening becomes a push notification. `recipient_id` was validated as a uuid in the same pass, another 500.

  `REACTION` is 32 and is a **length** check, not an is-it-an-emoji check: `.length` counts UTF-16 code units and 👨‍👩‍👧‍👦 is 11 of them, so a tight cap rejects ordinary emoji. Reactions are aggregated into a blob returned with every read of a conversation, so an unbounded one is paid for on every later fetch.

  Fixing this exposed **unrealistic test fixtures**: `rushMessaging.test.js` and `notifications.test.js` used ids like `"rushee-id"` and `"recipient"`. `users.authentik_id` is `UUID PRIMARY KEY`, so those shapes would have been 22P02 and a 500 in production — the tests were passing against a looser API than the one that exists. Now real uuids.

**Still open on the API side: nothing from this item.**

**The website half is done too.**

- **`maxLength` mirrors** on every compose form and the message composer, so caps are met while typing rather than as a rejection after clicking save.
- **`updateProfile` returns `{ error }` rather than throwing**, so the API's message reaches the member intact instead of becoming React #441 (trap 8 above).
- **Per-field errors.** The API now returns `{ message, field }` from both profile routes and both username routes. `ProfileForm` and `AdminEditProfileModal` render the message under the named input and scroll it into view. All 12 field keys the API can produce are wired in both forms, checked mechanically against `profileFields.js` rather than by eye.

  `field` is **optional and stays that way**: a 500, a fetch failure or a permission error carries none, and both forms fall back to the banner, because an error with nowhere to go must never be swallowed. The key is the API's field name and not an input's — `graduation_date` is one key but two inputs — which is why the lookup anchors on a `data-field` wrapper instead of an input `name`.

  The existing `emailError`/`linkedinError` states stay: those are client-side pre-checks that save a round trip, a different thing from reporting what the server refused.

  **No iOS change was needed, verified rather than assumed:** iOS decodes errors as `struct ErrorResponse { let message: String? }` in `KTPServices/CheckInService.swift`, and Swift's `JSONDecoder` ignores unknown keys.

**Done when:** ~~a bad value produces a message beside the field instead of a red banner or a silent save.~~ **Met.**

### ~~C. Interview slot editing UI~~ — DONE, shipped 2026-08-10

The pencil on a slot row expands an inline edit form. `ktp-api 329e519` + `uga-ktp-website 5ea692f`, both live.

It was **not** "mostly a UI job", and the two things it turned up are worth keeping:

1. **`updateSlot` was write-only.** `COALESCE($n, column)` reads NULL as "keep", so a room or interviewer could be set and never unset — the request returned 200 and changed nothing. It now builds its `SET` clause from a fixed column allowlist. **`updateSchedule` still has the old pattern** for `description`/`location`; nothing edits those yet, so fix it before building a form that does.
2. **The delete-409 dialogs had been showing React's #441 digest in production** instead of "N people have already booked this slot" — see trap #8. `deleteInterviewSlot` and `deleteInterviewSchedule` now return `{ ok }` / `{ error, code }`, and only `has_bookings` earns the "Delete anyway" escalation (previously *any* failure did, including a network error).

### ~~C2. Interviewer signup~~ — DONE, shipped 2026-08-10

The member page shipped in `3a577b4 "Members portal interviewer scheduling"`: `/member/interviews`, `components/portal/InterviewerSignup.jsx`, and a nav entry that keys off `rounds.length > 0` so the tab can never appear for someone the API would then 403.

One thing that changed after it shipped, and is worth knowing before touching the rushee side: **candidates are no longer told who is interviewing them, anywhere.** `findAvailableForUser` and `findForCalendar` stopped selecting interviewer names in the SQL rather than stripping them later, which also covers the ICS feed. Don't reinstate a name from another field.

Historical detail follows.

### ~~C2 (original, superseded 2026-08-10)~~ — kept only as the record of what the API looked like before the member page shipped

Members of committees eboard designates sign up to **run** interviews; eboard sets a max per slot. Migration `1787600000000`, plus `interviewer_committee_ids` per round and `interviewer_capacity` per slot.

**⛔ Deploy order:** run the migration **first** (it's additive and safe against live code), then push API and website **together**. The new API is not backward compatible with the old forms, which send `interviewer_id`.

Still to build: **`/member/interviews`** and a nav entry conditional on committee membership. `buildNav(isChair, canInterview)` in `app/member/layout.jsx` already does conditional items, so follow that. The API is finished: `GET /interviews/interviewer-schedules`, `POST /interviews/slots/:id/interviewers`, `DELETE /interviews/slots/:id/interviewers/:userId`.

Two things to know before building it:

- **The member page is read-only except for claiming a slot.** No editing, no adding slots — that stays in `/admin/interviews`.
- **The interviewer view includes rushee names.** Deliberate (an interviewer needs to know who they're meeting), but `POST /committees/:id/join` is **self-service** and there's no eboard route to remove someone from a committee, so the audience is wider than the committee roster implies.

**Done when:** a pledge-committee member sees the published rounds at `/member/interviews`, claims a slot, sees it marked as theirs, and can withdraw — and a rushee gets nothing, not even the nav entry.

### ~~D. Member-created group chats~~ — DONE, shipped and confirmed 2026-08-10

Any member except a rushee can create a chat, it doesn't appear in eboard's oversight list, and eboard can't administer it either. Full write-up at [docs → Messaging → Member-created chats](https://docs.ugaktp.com/website/messaging#member-created-chats), plus the group chat section of `ktp-api/README.md`.

**The part that wasn't in the original scope, and mattered most.** The privacy rule had only ever been enforced on the *read* path. `DELETE /:id`, `PUT /:id/photo`, `PATCH /:id/audience` and both `/:id/members` routes were `requireGroup("eboard")` and never consulted `is_member_created` — so **eboard could delete or repopulate a chat they were forbidden to read.** Those five now carry no `requireGroup` at all; administration is decided per chat in `groupChatsController.loadAdministrable`, because a router-level group check can't express "unless a member made it".

Three decisions, all Yash's: every member group except `rush` may create; the report escape hatch is in scope; **creator-only** administration.

Also built, and each one mirrors a specific refusal in the API: a leave route (with all four of its 409 cases reflected in the UI so the button only shows when it works), a Chapter/Personal choice for eboard, and copy in the create modal telling members what the privacy rule actually is — neither half of it is guessable.

**Renaming** (`PATCH /group-chats/:id`) came last, 2026-08-10. There had been no rename route for any chat, for anyone. It needs no special case for the auto-managed chats: a committee chat is named once at creation and **there is no committee update function anywhere**, and the Eboard chat is found by `is_eboard_chat`, never by name. Build committee renaming and that changes.

**Confirmed working in a browser by Yash, 2026-08-10.**

**Nothing open.** The one thing that was, `reports.content_id` accepting any string, is **done** under item B: `createReport` now validates it, so no new junk rows can arrive to break a consumer that reads the column as a number.

### ~~E. Alumni "what I'm doing now", custom profile links, and roster visibility~~ — DONE 2026-08-11

**ALL THREE PARTS BUILT 2026-08-11.**

1. ~~**What an alumnus is doing after graduation**~~ — DONE. Column `doing_now`, free text, ≤150.
2. ~~**Custom links**~~ — DONE. `links jsonb`, up to 5 `{ label, url }` pairs, rendered as wrapping chips on the directory card.
3. ~~**Public roster opt-in/out**~~ — DONE. Yash resolved the open question: **build it.** Column `show_on_public_roster`, its own endpoint, a switch in Settings → Public Roster.

Migrations `1787800000000` (parts 1–2) and `1787900000000` (part 3). The first two columns are on **all users** with the *form* gated to alumni, per `about_me`'s precedent: a column gated to one group has to be migrated the day someone changes group.

**On part 3, the thing that would have made it worthless:** `findPublicRosterMember` needed the same filter as `findPublicRoster`. It backs `/roster/:id/media` and re-checks eligibility precisely so a guessed id can't pull a photo that was never listed — so filtering only the list would hide the member while still serving their picture to anyone who knew their id. Both queries carry it, and `test/rosterVisibility.test.js` asserts the media path specifically.

It is **not** part of the profile upsert, which would have been the easy mistake: that route NULLs every absent key and this column is `NOT NULL`, so iOS's five-key save would flip people's answers. Its own endpoint, like username and profile picture.

#### What the build turned up

- **`current_role`, the name in the original sketch, is a Postgres reserved word.** `ADD COLUMN current_role` is a flat syntax error. Quoting it would have worked and been a trap: an unquoted `SELECT current_role FROM users` is legal SQL that silently returns the *session role* for every row. The column is **`doing_now`**.
- **`normalizeWebUrl` returns a `URL` object, not a string.** Storing it looks fine — `JSON.stringify` calls URL's own `toJSON`, so the `jsonb` column is correct — while every consumer upstream of the database holds an object where a string is expected. `.href` on write.
- **The eboard modal had to get both fields, not as a courtesy.** It builds its payload with the same `buildProfilePayload`, and the write is a whole-row upsert, so a modal without a links input sends `[]` and wipes a member's links whenever eboard corrects their major. That is why `components/profile/LinksField.jsx` is shared by both forms rather than duplicated — see `components/README.md`.
- **Two test fixtures created their own `users` table** and went red the moment a projection selected a new column. The fixture was wrong, not the code; same lesson as the uuid fixtures under item B.

The traps identified in advance all held up and are now enforced in code: links go through `normalizeWebUrl` (trap #6), `memberModel`'s three projections each needed the columns added by hand, and the `jsonb` param is `JSON.stringify`'d because node-postgres turns a JS array into Postgres *array* literal syntax.

**Done when:** ~~an alumnus can say what they're doing and add a few links, both show on their directory card with the link row wrapping cleanly as it grows, and a `javascript:` URL is rejected with a message beside the field.~~ **Met, all three parts.**

**Both migrations (`1787800000000`, `1787900000000`) are run, and it is live and browser-confirmed.** Keeping the reason they were never optional, because it applies to the next column added here: `userModel.findById` selects all three, so an unrun migration 500s **every profile read and write**, rather than merely leaving a new feature inert.

**Part 1 was later widened.** `doing_now` was put on the **public roster card** as well (under the role, above the LinkedIn button), reversing the original member-side-only call. `links` was deliberately **not** part of that reversal and stays on the directory card only.

### F. Granular permissions — *parked until after rush, and genuinely large*

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

### ~~G. Gallery collections~~ — DONE, shipped and confirmed 2026-08-11

Eboard can run several homepage galleries instead of one flat list. `homepage_photo_collections` groups `homepage_photos` by a nullable `collection_id`; the migration backfilled every existing photo into one "Chapter Gallery" so the live homepage rendered identically the moment it ran.

**Two surfaces, one model.** The homepage shows only the collections marked featured, capped server-side; the new public `/gallery` page shows all of them, newest first. The cap is a performance rule, not a preference: the media endpoint serves **original** files with no thumbnail variant, so every collection added to the landing page makes it permanently slower.

**Ordering is `display_order`, then `event_date` newest-first, then `id`.** `event_date` exists because `created_at` is wrong for this — eboard uploads last autumn's photos in spring. An undated collection sorts last, being unplaced rather than ancient.

**The hardcoded "Hackathon Highlights" section is now a collection**, so it is editable without a deploy. The original JSX and its `hackPics` array are **commented out in `template-page.jsx`, not deleted** (Yash's call). They must be restored together — one without the other is an unused or an undefined variable.

Two things worth knowing before touching it:

1. **Route order in `routes/homepagePhotos.js` is load-bearing.** `PUT /:id` matches a single segment, so it also matches `/collections` and would silently answer `PUT /collections` with the photo handler. Every `/collections` route sits above the `/:id` routes and a test asserts it.
2. **Deleting a collection deletes its photos** (`ON DELETE CASCADE`). The API refuses with a 409 and the real count until `?force=true`, so the confirmation quotes a number rather than guessing. Immich assets survive.

**Migration run, live, and confirmed in a browser by Yash** ("looks great, works well") — creating a collection, uploading into it, reordering inside one collection, and the delete-with-photos warning.

### ~~H. Committee membership has no gatekeeping~~ — FIXED 2026-08-11

Raised 2026-08-11 while scoping Authentik committee groups for third-party SSO. The SSO idea is sound and is written up at the bottom of this item, but **it is blocked on this**, and this is worth fixing on its own merits regardless.

**Any member can join any committee, and nobody can remove them.** `POST /committees/:id/join` carries no check beyond the router's `requireGroup(...SHARED_ALBUM_GROUPS)`, so any member group except rush can add themselves to any committee. There is a self-service `DELETE /:id/leave` and an eboard `PUT /:id/members/:userId/role`, and that is the complete set: **eboard can promote you to chair but cannot remove you.**

That is not only a tidiness problem, because committee membership is already load-bearing in three places:

| Joining a committee immediately grants | Where |
|---|---|
| Membership of that committee's **group chat**, including its history | `committeeModel.join` → `syncGroupChatMembership` |
| Read access to every **album, folder, document, event, meeting, announcement and poll** restricted to that committee | `visibility.js` — `committee_ids && (SELECT ARRAY_AGG(committee_id) FROM committee_members WHERE user_id = …)` |
| Eligibility to **run interviews** for rounds that designate the committee | `interviewer_committee_ids` |

So today, restricting an album to the Exec committee is a request, not a boundary: anyone who wants in clicks Join. The API README already hedges this ("a designated committee is a softer boundary than its roster implies") but the consequence had not been written down.

**Done when:** ~~joining requires approval, and eboard can remove a member.~~ **Met.** The activity log was the last open question and Yash confirmed it 2026-08-11: the five new committee routes appear at /admin/logs without any controller-level logging call, which is the global middleware working as designed.

**Shipped:** migration `1788100000000`, `committee_join_requests`, five routes, 15 tests, and the UI (Request to Join / Requested-withdraw, the chair approval queue, per-row remove). Verified by a 9-assertion render probe — the two that matter assert the queue does NOT render for a plain member or for someone who merely requested.

Traps for whoever picks this up:

- **`setMemberRole` auto-adds people, and that is fine.** An earlier draft of this item called it a second hole. It isn't: the route already carries `requireGroup("eboard")`, so it is a deliberate admin path and it is the **bootstrap** — a brand new committee has no chair, so something has to be able to seat the first one without an approver. Leave it alone.
- **Don't break the chair bootstrap.** Committees are created by eboard and then need a first chair; an approval flow with no seeding path means a new committee nobody can join.
- **Leaving must stay self-service.** The fix is about who can get *in*, not about trapping people. `DELETE /:id/leave` should keep working with no approval.
- **There is no `committee_id` on `users`** — membership is the `committee_members` join table, and a person can be on several committees. Any "pending request" state belongs beside it, not as a column on the user.

#### The SSO follow-on — deliberately NOT part of this item

The motivating idea: give each committee an Authentik group so **other applications** (Proxmox, and anything else behind the IdP) can scope access per committee. It is a real use case and it does not contradict the "grants live in Postgres" decision recorded under item F — that decision is about *in-app* permissions, and this is about consumers that cannot query our database at all. Both can be true.

Three conclusions already reached, so nobody re-derives them:

1. **Mirror, don't replace.** Postgres stays authoritative and Authentik groups are a projection for outside consumers. Reading committee membership from the JWT in-app would re-inherit trap #10's staleness (a removal would not take effect until the member next signed in) and would make `interviewer_committee_ids`, which is a SQL join, into an API call per row.
2. **Most of the plumbing exists.** `services/authentikAdmin.js` already has `listGroups`, `addUserToGroup`, `removeUserFromGroup` and `findUserPk`, and `adminController.updateUserGroup` already establishes the write-Authentik-first-then-mirror pattern. Missing: a group-create call, and a name convention (`ktp-committee-<slug>`) so committee groups can never be confused with the role groups `roleGroups.js` resolves against.
3. **Check the GitHub plan before promising GitHub SSO.** SAML SSO and SCIM are GitHub **Enterprise Cloud** features; a free or Team org cannot enforce them. Proxmox is fine, it speaks OIDC and maps groups.

**Why the ordering is not negotiable:** wiring committee groups to Proxmox while join is self-service and removal does not exist means any member can grant themselves infrastructure access and nobody can revoke it.

---

### ~~I. Eboard-typed traits~~ — DONE 2026-08-11

Eboard types short **label/value pairs** onto any member — *Concentration: Fintech*, *Hometown: Atlanta, GA*, *Interned at: Delta* — shown on the member's directory card **and** on the public roster, under their role and above the LinkedIn button. Set from **Admin → Users → Edit**. Migration `1788000000000`, column `traits JSONB NOT NULL DEFAULT '[]'`.

Full write-ups: [docs → Profiles & directory → Traits](https://docs.ugaktp.com/website/profiles-and-directory#traits), plus the `traits` row of the schema table in `ktp-api/README.md`. Website side: `components/profile/TraitsField.jsx`, wired into `AdminEditProfileModal.jsx`, read by `MemberDirectory.jsx` and `app/members-list/page.jsx`.

**The design decision worth carrying forward: "eboard-only" is a property of which routes exist, not of a check.** `traits` is deliberately absent from `PROFILE_FIELDS` in `services/profileFields.js`, the list shared by the self-service write and eboard's edit-anyone write. A key on that list is settable by the member, whatever the UI offers. So there is **no shape of request to `PUT /users/me/profile` that reaches the column** — the only writer is the eboard-only `PUT /admin/users/:id/traits`. A rule enforced by routing cannot later be got wrong by someone appending a key to an array.

That matters more than it looks, because **these land on a page with no authentication**. The public roster is chapter-authored text, and eboard-only is the reason for that, not a side effect.

Four more things the build settled:

- **It generalises `exec_title` without replacing it.** That column stays exactly as it is: `rosterController` prefers it for the card's subtitle and two controllers reason about "eboard member with an exec_title". Folding it in would be a rewrite of live behaviour to save one column. **A trait is additive; a role is not.**
- **Caps live in application code, not a `CHECK`** — 6 traits, label ≤40, value ≤80. A constraint violation is a `23514` surfacing as a 500; the service layer answers 400 with a message and the offending field name.
- **`DEFAULT '[]'` rather than nullable**, because both clients map over this and `null.map` is a crash where `(x ?? []).map` is a guard somebody eventually forgets on one of the two cards.
- **The edit modal makes two writes behind one Save, and traits go first on purpose.** A rejected trait then leaves the rest of the profile untouched, rather than reporting an error on a form whose other changes have already been committed.

`jsonb` for the same reasons as `links`: a short, ordered, wholly eboard-owned list, always read and written in one piece. Nothing joins to an individual trait and nothing queries across them.

**Done when:** ~~eboard can add, edit and clear traits on any member, they render on both the directory card and the public roster, and a member cannot set their own by any route.~~ **Met.** Pinned by `ktp-api/test/memberTraits.test.js` and an 8-assertion render probe.

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
