# components/

Most of what's in here is shared by **all four portals** — `/member`, `/admin`, `/pledge` and `/rushee`. Editing one of these files changes the experience for every group at once. That's usually what you want; it's also the easiest way to break three portals while testing one. (`/alumni` was merged into `/member` and deleted; don't re-add it.)

**[Traps](#traps--things-that-have-actually-bitten-us) is at the bottom of this file, and it is the part you cannot get from reading the code.** Every entry there compiled, deployed and looked like working software.

## Where to put a new component

| It is… | Put it in |
|---|---|
| Used by more than one portal | `portal/` |
| Settings / profile editing | `profile/` |
| Admin-only (moderation, user management, homepage content) | `admin/` |
| Admin dashboard charts | `analytics/` |
| A generic primitive (button, card, avatar, tabs) | `ui/` |
| Public marketing site only | top level, next to `template-page.jsx` |

**Anything eboard-only belongs in `admin/`, not `portal/`.** Don't put a privileged surface in a shared component and hide it behind a role check — a shared file is one careless prop away from rendering for everyone. The same goes for rush-specific or otherwise audience-specific UI: give it its own file rather than branching inside a shared one.

## Theming: the `accent` prop

Shared portal components take an `accent` (sometimes `theme`) prop and look up
their colours from **`PALETTES` in `portal/PortalAccentContext.jsx`** — the one
definition, imported everywhere.

| Value | Portal | Renders |
|---|---|---|
| `blue` | Member | blue |
| `red` | Admin | red (or blue, per the admin's own toggle) |
| `amber` | Alumni | amber |
| `teal` | Pledge | blue |
| `violet` | Rush | blue |

`teal` and `violet` are aliases of `blue` — Pledge and Rush have rendered the
same blue as Member since the colour unification. They survive as distinct keys
only for historical reasons; either could now pass `'blue'` directly.

**This used to be seven copies.** Every shared component carried its own
`ACCENT_THEMES` map, and they had already drifted: `MemberDirectory` was missing
`red` entirely (harmless only because no admin page renders it), and all seven
still defined a real teal that nothing has rendered since Pledge started passing
`'blue'`. If you need a new colour, add it to `PALETTES` and nowhere else.

**Several components have no default accent.** Omitting the prop doesn't throw —
the lookup falls back to blue via `PALETTES[key] ?? PALETTES.blue`. If a page
looks unexpectedly plain, check its `page.jsx` wrapper actually passes an accent.

## Adding a nav item

**One edit:** the `NAV` array in that portal's `app/<portal>/layout.jsx`. It is
grouped, and the sidebar renders exactly what's there, in that order:

```js
const NAV = [
  { heading: 'Main', items: [{ href: '/member', label: 'Dashboard', icon: LayoutDashboard }] },
];
```

This used to be two edits — the layout's flat array *and* a matching
`NAV_GROUPING` entry in `PortalShell.jsx` keyed by `accent`. An href in one and
not the other silently vanished from the sidebar, and an accent with no
`NAV_GROUPING` key rendered an **empty** sidebar rather than failing. Both lists
are now one, so neither failure mode exists.

`accent` no longer selects nav structure or the portal's home href (that's the
`homeHref` prop), so it means only "which palette".

### Pinned nav groups

A group may set `pinned: true`. Its items render with **no heading** and never
collapse, and `PortalShell` draws a rule wherever pinned meets unpinned.

```js
{ heading: 'Account', pinned: true, items: [{ href: '/admin/settings', ... }] }
```

It exists for one-item sections. Dashboard and Settings were each a section
holding a single link, so the accordion heading cost a click to reveal something
that was already one click away — worse than no grouping at all.

**`heading` is still required on a pinned group.** It is not displayed, but it
keys the group and builds the panel id; omitting it throws in `sectionId`, which
calls `.toLowerCase()` on it. Only `/admin` passes `pinned` today — a group
without the flag behaves exactly as it always did, which is why the other three
portals needed no change.

### Page-level tabs vs component-level tabs

`components/portal/PageTabs.jsx` is the **segmented control** used by pages that
merge two former sidebar entries into tabs (`/admin`, `/admin/oversight`,
`/admin/homepage-media`, `/admin/rushees`).

It is deliberately not the underline treatment. `ModerationQueue` and
`AnalyticsContent` render their own underline tab bars — down to the same
padding and the same `inset-x-2 bottom-0 h-0.5` rule — so a second underline row
above one of those gives two identical bars with nothing saying which is the
page and which is the section.

Components embedded this way take an **`embedded` prop that defaults to `false`**
and suppresses only their own title block. The default matters: `RushInterestTable`
is shared with `/member/rush-data` and `PortalDashboard` with three other
portals, so the flag has to be opt-in per call site rather than a rewrite.

### Nav badges

A nav item's badge number comes from `badgeFor(href)` in `PortalShell`, the one
place that decides it. The shell renders its nav **four times** — desktop
revamped, desktop legacy, and a mobile sheet for each — so a condition inlined
into one of them badges in some layouts and not others. That is exactly what
`href.endsWith('/messages')` used to do in all four.

**Three** sources feed it and they are not interchangeable:

- **Messages** — `useUnreadCounts()`, real per-message read receipts.
- **Most tabs** — `useTabNotifications()`, a per-tab cursor. Visiting a tab
  marks it seen, and the tab currently being viewed never badges.
- **Calendar, additionally** — `usePendingRsvpCount()`, upcoming events where
  `requiresRsvp && canRsvp && !myRsvp`.
- **Meetings** comes through `useTabNotifications()` but is **not a cursor
  count** — the API returns unanswered invitations there, so it is listed in
  `CLEARS_ON_ACTION_NOT_VIEW` and skips the optimistic clear-on-view. Adding a
  count that clears on an action rather than a glance means adding it there
  too, or looking at the tab will blank a number the member still owes.

The third exists because the cursor **cannot** express it: `markTabSeen` fires
on visit, so an RSVP badge built on the cursor would clear for the very member
who looked and meant to answer later. It has to survive being seen and clear
only on an answer.

`badgeFor` returns the pending count **when there is one**, else the cursor
count. **Never summed** — that double-counts a new RSVP event and the number
then drops on a mere visit, which reads as the badge losing track.

Gate it on **`canRsvp`, not `requiresRsvp`**. Seeing an event and being *sent*
one are different questions, and there is no creator clause in the API's
recipient rule, so an organiser who targets an event at a group they aren't in
can see it and is not a recipient. Badging them gives them a number they cannot
clear, and drawing the button gets a 403.

A new badged *cursor* tab needs `NOTIFICATION_TABS` in
`lib/use-tab-notifications.js` **and** `notificationCursorModel.TABS` plus the
`CHECK` constraint in the API. Missing one side doesn't error — it just never
badges.

## Profile pictures

Use a plain `<img>` with an `onError` handler falling back to initials. Prefer this over `ui/avatar.jsx`'s Radix-based `Avatar` — Radix's `AvatarFallback` can stay visible even after the image successfully loads, which has caused initials-only-avatar bugs here more than once.

**Build the `src` with `profilePictureSrc(id, avatarAssetId(member))` from `lib/avatar.js`, never as a template literal.** The media proxy sends no `Cache-Control`, so a URL keyed on the member id alone is identical before and after they change their photo and the browser keeps serving the old one — that is the media-cache trap below, and it was live on seven surfaces at once because each built its own URL. The cache-buster is the Immich asset id, which changes exactly when the picture does; a timestamp or a render counter would change on every paint and re-download every avatar in the directory on every load.

Two things that follow from it:

- **Guard on the built `src`, not only on your `err` flag.** `profilePictureSrc` returns `null` when there is no user id, and React drops a `null` src attribute rather than failing to load it — so `onError` never fires and you get a permanently empty circle instead of initials.
- **Key the error state on the asset id, not a boolean**, anywhere the photo can change while the component stays mounted. A sticky `err` flag means a member who had no photo when the page loaded stays on their initials after uploading one. `SidebarAvatar` in `PortalShell` and `GroupChatAvatar` in `MessagesPage` both do this; the shell especially, since it is a layout and never remounts on client-side navigation.

**Initials are not a blank state, so don't paint them all one colour.** `MemberDirectory` seeds each member's initials gradient from their id with `seedValues` from `lib/seed.js`; `PhotoFiles` seeds an empty album's whole generated cover from the same helper. A directory tab during rush is 60 cards of initials, and in one accent colour that is 60 identical circles. Seeding on the id (never `Math.random()`, never a render counter) is what keeps a member's tile the same colour on their card and in the modal it opens. `lib/seed.js` is the only copy of that hash; import it rather than pasting djb2 a third time.

### Pronouns: `profile/PronounsField.jsx` is shared for the same reason

A select of presets plus a **Custom…** row that reveals a free-text box. Two inputs (`pronouns_preset`, `pronouns_custom`), one column — `buildProfilePayload` recombines them, the same shape `graduation_semester` + `graduation_year` already use.

**The `pronouns` key is ALWAYS present in the payload**, and that is the point. The admin write is whole-row, so a profile-editing surface that renders no pronouns input still sends `pronouns: null` and wipes the member's answer. Both forms render this one component.

The preset list and the `__custom__` sentinel live in `lib/profile.js`, not in either form, so the two cannot drift. `splitPronouns()` decides which way a stored value reopens the control: anything not in the preset list is a custom answer.

**Pronouns are portal-only.** `toDirectoryMember` maps the field, but the API's public roster queries never select it, so on `/members-list` it is simply absent. Do not add it to `ProfileCard`.

### Profile links: `profile/LinksField.jsx` is shared, and that is a data guard

`ProfileForm` (a member editing themselves) and `AdminEditProfileModal` (eboard editing anyone) both build their request body with `buildProfilePayload`, and the profile write is a **whole-row upsert**. So a form that renders no links input still sends `links: []`, and eboard fixing a typo in someone's major would erase all their links. Same shape as the `preserveEmail` trap in the API.

Both forms therefore use `useProfileLinks` + `LinksField` + `LinksHiddenInput` from one file. **If you add a third profile-editing surface, wire all three or that surface will quietly delete links.**

`email` is the one key that escapes this rule, and it escapes it on purpose. `buildProfilePayload` uses **`formData.has('email')`** rather than `get`, so a form that does not render the input omits the key entirely instead of sending `null`. The API distinguishes them: an **absent** key defers to the address already on file (the enrollment prompt collects it now, so the onboarding form no longer asks), while an **explicit null** is someone clearing the field on the Settings form and is still refused. Every other key keeps the always-send-it behaviour, because for those, absent and null really do mean the same thing.

**Do not re-add the UGA Email input to the onboarding form without following that chain** — rendering it makes `has` true, which makes the payload carry `email: null` on a builder that has nothing to put in it, which 400s every first save.

Two details inside it that are not obvious:

- **Row keys are not indexes.** Deleting a middle row renumbers every index below it, so React reuses the wrong input for the wrong row and the text visibly jumps to a different link. Each row carries a generated key instead.
- **The URL input has no `type="url"`.** The browser would refuse `example.com/you` before the form ever submits, and accepting a scheme-less host is precisely what `normalizeWebUrl` exists to do — that is what people paste.

Rendering side: link chips go through `safeExternalHref` even though the API already canonicalised them on write. An `href` is a different trust context from a text node, and this is the second of the two checks described under [Any user-supplied value that becomes an `href` must be sanitised](#any-user-supplied-value-that-becomes-an-href-must-be-sanitised).

### Traits vs links: same widget, different owner

`usePairRows` in `profile/LinksField.jsx` is the shared state behind both row editors. `useProfileLinks` (member-owned URLs, on their own settings form) and `useTraitRows` (eboard-owned label/value pairs, only in the admin modal) are thin wrappers over it, so the two rules that matter live in one place: **row keys are not indexes**, and **an untouched empty row is dropped rather than submitted**.

They are separate components because they are owned by different people and saved by different endpoints. Traits do **not** ride in the profile payload — they go through `PUT /admin/users/:id/traits`, which is what makes eboard-only true of the API rather than only of this form. The modal therefore does two writes behind one Save button, and does **traits first**: a rejected trait then leaves the profile untouched, instead of reporting an error on a form whose other changes already landed.

That last point is also why `lib/avatar.js` exports `PROFILE_PICTURE_CHANGED_EVENT`. `PortalShell` fetches the member's profile once per full page load, so without the event the sidebar would still show the old photo after an upload on the profile page. `ProfileForm` fires it via `announceProfilePictureChange(newAssetId)` and the shell re-reads the profile.

`ui/card.jsx`'s `ProfileCard` is shared by the roster, sponsorship page, alumni section, and homepage. It takes `avatarShape="square"` to opt into a rounded square instead of the default circle — only the roster uses that today.

## Embed real components, don't reinvent them

`ReportButton`, `BlockButton`, and `ProfileActionsMenu` each own their modal/popover state internally. Mount them directly; they need little more than an id and a content type. Don't wrap them in a parent-owned `onReport`/`onBlock` callback — designs generated from mockups tend to assume that shape, and rewiring to it just adds state for no benefit.

`BlockButton` takes `iconOnly` for the compact form that sits beside a `ReportButton` (directory profile card, message bubbles, photo tiles and lightbox); pass the neighbouring control's `className` so they match. `iconOnly` also renders immediately instead of waiting for the blocked list to load — a control that appears a beat after the ones next to it reads as missing. It reads its state from `lib/blocked-members.js`, a module-level store shared by every mounted instance and by the Settings list — **one fetch per session, not one per button**, which is what makes it safe to mount a block control on every message. Any block/unblock goes through `blockMember`/`unblockMember` there, so every other control on screen updates with it. Don't call `blockUser`/`unblockUser`/`getBlockedUsers` from `portal-api` directly in a component; that bypasses the store and leaves the other controls stale.

## Textareas resize vertically

Body/description/note fields use `resize-y`, not `resize-none` (the old default here) and not the browser's `resize: both` — a textarea dragged wider than its dialog breaks the layout. The one deliberate exception is the message composer in `MessagesPage.jsx`, which stays `resize-none` because it auto-grows from JS on every keystroke; a manual drag there would be overwritten on the next character typed.

The same applies to `profile/ProfileForm.jsx`, which is shared with the onboarding flow. Embed it as-is rather than rebuilding its fields.

## `ProfileForm` hides fields by group — don't re-add them

Four fields are conditional, and every condition is load-bearing:

- **Pledge Class** is hidden from rushees (`isRushee`) — a pledge class is the thing they're rushing to get.
- **UGA Email** is hidden from alumni (`isAlumni`), and the remaining input is relabelled from "Personal Email" to just "Email". A UGA address stops working at graduation, so the personal one is the only one that still reaches an alumnus.
- **What you're doing now** is shown to alumni only.
- **The three rush interest fields** — Minor(s) & Certificates, GPA, How did you hear about KTP — are shown to rushees only (`isRushee`). These are the ones to be careful with; see the next section.

The alumni case has a trap worth knowing about before you touch it. `PUT /users/me/profile` is a **whole-row upsert**: every key absent from the payload is written as `NULL`. Because the form no longer renders a UGA Email input for alumni, an alumnus saving an unrelated change sends no `email` — which would erase whatever address is on file. The API guards this (`userModel.updateProfile`'s `preserveEmail`), so the value survives, but the same trap applies to **any** field you make conditional here. Hiding an input in this form is equivalent to clearing the column unless the API is taught otherwise.

Both checks prefer the resolved `member_group` over the raw session `groups` list where one is available. Authentik doesn't remove someone's old group when they change status, so the raw list can still say `active` for an alumnus or `rush` for a new pledge.

### The rush interest fields are the sharpest edge of that trap

`minors`, `gpa` and `heard_from` are rushee-only inputs holding data the pledge committee votes on. Hiding them therefore had to mean "leave the columns alone", not "clear them" — and by default it means the second.

`buildProfilePayload` keys the whole group off **`formData.has('gpa')`** and omits all three when the inputs are absent. `PUT /users/me/profile` writes only the keys a request carried, so omission preserves. This is the same `has`-not-`get` mechanism the UGA email uses, and here it is the difference between working and silent data loss: the day a rushee is given a pledge class the form stops rendering these fields, and without the omission their next unrelated save would write three nulls over the answers they were selected on.

**Two things must stay true, or it breaks:**

1. **Don't render them for everyone "so the payload is consistent."** That makes `has` true for a pledge with an empty box, which sends `null`, which clears.
2. **Don't add a fourth rush field with `formData.get`.** The group is spread together on purpose — a partial omission would clear some and keep others.

`AdminEditProfileModal` does the exact opposite and must keep doing so: it renders all three for **everyone**, because `PUT /admin/users/:id/profile` is a plain whole-row `UPDATE` that does not honour absent keys. Gating them there on `member_group === 'rush'` would mean eboard fixing a typo in a new pledge's surname erases the GPA the pledge committee chose them on. The two forms disagree deliberately.

## Don't point `ProfileForm` at another user

`admin/AdminEditProfileModal.jsx` is a separate form on purpose, and reunifying the two is a trap worth naming.

`ProfileForm` decides what to render by reading the **session**: `isRushee` and `isAlumni` describe whoever is logged in. Eboard editing someone else means the session is the *editor's*, so those checks would answer for the wrong person — an eboard member editing an alumnus would get the eboard field set — and the form posts to `/users/me/profile`, which would save the edit onto the editor's own row.

The two share the parts that actually need to stay in step: `buildProfilePayload` from `lib/profile.js`, so both send byte-identical bodies, and `services/profileFields.js` in the API, so both are validated by one set of rules rather than two copies that drift.

The admin modal also shows **every** field unconditionally, including UGA Email for alumni. It's the surface for fixing bad data, and the directory masks an alumnus's UGA address on read regardless.

## Every profile field is validated by the API, and the message has to survive

The rules live once, in `services/profileFields.js` — names ≤100 and trimmed before the required check, `major` ≤120, `pledge_class` ≤50, `phone` 7–15 digits, `dob` a real `YYYY-MM-DD` date no later than today, and `graduation_date` a semester plus a four-digit year. `about_me` is the one field that truncates instead of rejecting. Full table: [API docs](https://docs.ugaktp.com/api/endpoints#put-usersmeprofile).

Two consequences for this form:

- **`updateProfile` returns `{ error }` and does not throw.** It used to go through `apiPut`, which throws on a non-ok response, and a thrown Server Action error becomes React #441 in production (see [A Server Action that throws loses its message](#a-server-action-that-throws-loses-its-message-in-production)). That was survivable while the only 400s came from rules the form pre-empts on the client; it stopped being survivable once a phone number or a graduation year could fail. Anything else here that a member must read needs the same shape.
- **The `maxLength` attributes are a mirror of the API's caps, not an independent opinion.** They exist so the field stops accepting input rather than round-tripping to a rejection. If you change a cap, change it in `services/profileFields.js` first, since that is the one that is actually enforced.
- **A rejected save shows the message beside the field, not in the banner.** The API returns `{ message, field }`; `Field` takes an `error` prop and renders it under its input. The same `Field`/`error`/`name` shape exists in `admin/AdminEditProfileModal.jsx`, because both forms post to the same API normalizer and get the same field key back.

  Three things about it that are easy to get wrong:

  - **`field` is optional and always will be.** A 500, a fetch failure or a permission error carries no field, and both forms fall back to the banner for those. An error with nowhere to go must never be swallowed.
  - **The key is the API's field name, not an input's `name`.** `graduation_date` is one API key but two inputs, `graduation_semester` and `graduation_year`. That is why `Field` puts `data-field` on its wrapper and the scroll-into-view queries that, rather than looking up an input.
  - **Clearing is handled once, by an `onChange` on the `<form>`.** Only the named field clears it, so editing an unrelated input leaves the message in place. Per-input handlers are exactly how `email` and `linkedin_url` each grew their own copy of this logic, and two of them had already drifted apart in colour class.

  The pre-existing `emailError` and `linkedinError` states are a **different** thing and both remain: those are client-side pre-checks that run before the request to save a round trip. The server error can be showing on another field at the same time.

## `lib/text-limits.js` — the compose-form caps

The same rule as above, for everything that is not a profile field: announcement and event titles and bodies, poll questions and options, committee, album, folder and group chat names, document link names.

`TEXT_LIMITS` mirrors `ktp-api`'s `services/textLimits.js` **exactly**, and neither file changes without the other. Two copies across two repos is the unavoidable minimum; what this replaced was worse, a single `const MAX_TITLE = 150` in `RushAnnouncementsManager.jsx` and bare literals or nothing everywhere else.

The API rejects over-length input regardless — it has to, since `maxLength` is a DOM attribute a client can simply not send. These exist so a member meets the limit while typing.

Two things worth knowing before adding one:

- **`maxLength` stops typing silently.** On a short field that reads as the field being broken. Pair it with a counter, as `RushAnnouncementsManager` does, wherever the limit is realistically reachable.
- **Check the wrapper spreads props.** `AnnouncementsContent` and `PhotoFiles` both route their inputs through local `FieldInput`/`FieldTextarea` components. Both spread onto the element *before* setting `className`/`style`, so `maxLength` survives — but a wrapper that listed its props explicitly would drop it, and `next build` would not notice, because compiling a client component never renders it.

## `Legacy*` files — removed 2026-08-02

Pre-redesign copies kept behind an accent check during the portal revamp. Every portal passes `blue`, `amber` or `red`, all of which took the revamped branch, so they had become unreachable — about 4,400 lines that could never execute.

They're deleted, along with the accent check. An unrecognised accent now renders the current design with the blue palette (every component already did `ACCENT_THEMES[key] ?? ACCENT_THEMES.blue`), which is a better failure than a second copy of the UI that nobody maintains.

**Why this mattered rather than being tidiness:** two copies of the same screen is exactly how the `CircleCheck`/`BlockButton` fix kept disappearing — it would land in one copy and not the other, and the bug looked like it had been reintroduced from nowhere.

All six are gone, including `LegacyCommitteesPage.jsx`, which was held back briefly only because `CommitteesPage.jsx` was being edited elsewhere at the time.

Git history has them if anything is ever needed back.

## Public gallery collections

Three files, one API. `GalleryCollection.jsx` renders one collection's heading, subtitle, optional link and snap carousel. `GallerySection.jsx` puts the **featured** ones on the homepage; `app/gallery/page.jsx` puts **all** of them on a public archive page. Both hand the same component the same shape, so the two surfaces cannot drift into looking like different features.

- **The homepage only ever shows a few, on purpose.** `/api/homepage-photos/:id/media` streams the **original** file and there is no thumbnail variant, so every collection added to the landing page makes it permanently slower. The API applies the cap; the client just asks with `featured: true`. Don't "fix" the homepage by dropping the filter.
- **Neither page re-sorts.** Order comes from the API (`display_order`, then `event_date` newest-first, then `id`). Sorting client-side is how the homepage and `/gallery` would start disagreeing about what chronological means.
- **`formatEventDate` parses the string, never `new Date()`.** The API sends a date-only value, and `new Date("2026-03-15")` is UTC midnight rendered in the viewer's zone — which shows *February* for anyone west of UTC. Same class of bug as the `dob` one in the API.
- **A collection with no photos renders nothing**, rather than a heading over an empty box.

`HomepagePhotoManager.jsx` is the eboard side. The collection pills scope the grid, the reordering, the bulk actions and new uploads — `visiblePhotos`, not `photos`. Reordering off the unscoped list would renumber other collections, because the indexes the grid returns are positions *within* the collection on screen.

**The old hardcoded "Hackathon Highlights" section in `template-page.jsx` is commented out, not deleted** (Yash's call, so it can be put back). Its `hackPics` array is commented out with it — restoring one without the other is either an unused variable or an undefined one. The `ktpHacks*` image imports at the top of that file are still live because `/hackathon` uses them.

---

## Traps — things that have actually bitten us

Moved here from `TODO.md`, which is now a local-only planning file and no longer in the repo. **Each of these cost real debugging time. None of them fail loudly: every one compiled, deployed, and looked like working software.**

Two more live in their own sections above, because each is really about one component: the **media-cache trap** under [Profile pictures](#profile-pictures), and the **badge-count disclosure trap** under [Nav badges](#nav-badges).

### `Promise.all` across endpoints with different permissions

**This has bitten twice.** `Promise.all` rejects the whole batch on the first rejection, so mixing a call everyone can make with one they can't means a 403 silently discards the good data too.

- `PortalDashboard` fetched members + photos together; both are closed to rushees, so the rush dashboard errored outright. That is why `RushDashboard` is a separate component.
- `PollsPage` fetched polls + committees together. `/committees` is member-only, so for a rushee the 403 threw away the polls as well — and the tab rendered **permanently empty with no error**, which is the worst possible failure.

Give every call in a fan-out its own catch:

```js
const [events, meetings] = await Promise.all([
  getEvents(),
  getMeetings().catch(() => []),   // 403s for rushees — must not take events with it
]);
```

`EventsCalendar` already does this across events/meetings/interviews. **Keep the per-call catch when you add a fourth source.** Grep for `Promise.all` before adding anything to `/rushee`.

### `GROUP_ORDER` must match the API's `roleGroups.js`

**Also bitten twice.** Both places bucket a member by group against a local list, and both fall back silently rather than erroring:

| File | What a missing group does |
|---|---|
| `lib/portal-format.js` → `MEMBER_GROUP_ORDER` (used by `MemberDirectory`) | lands them in **Active** — rushees appeared in the member directory with their emails |
| `components/admin/UserManagementPage.jsx` → its own `GROUP_ORDER` | shows them as **"unassigned"** |

Adding a role to `ktp-api/constants/roleGroups.js` means editing **both** of those.

### `redirect()` throws on purpose — never swallow it

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

### A filtered list must say that it is filtered

`GET /interviews/bookings/:id/notes` returns `{ access, notes }`, where `access` is `all` or `own`. An interviewer who wrote a note and then withdrew from the slot keeps their own words and loses sight of everyone else's — so they get a **`200` carrying one note when three exist.**

A component handed only the array renders "1 note" and is confidently wrong at the exact moment being wrong costs something. `InterviewNotes.jsx` renders an explicit warning for `access === 'own'`.

The tempting shortcut is deriving it from `slot.i_am_interviewing`, which the component already has. Don't: that is a second copy of a server rule living in a component, free to drift the day the rule changes. Ask the API what the caller may see and render the answer.

### Announcement attachments: two boards, one behaviour, one media table

The main board and the rush board are separate pages with separate permissions, but a photo grid or a link chip renders identically in both. `AnnouncementAttachments.jsx` is the reading side and `AnnouncementComposerAttachments.jsx` the writing side, and both are shared. The only thing that differs is one `board` prop, which picks which API endpoint the media proxy asks — it grants nothing, since ktp-api refuses ids belonging to the other board either way.

Three things worth knowing before editing them:

- **Tiles request `?size=thumbnail`, never the original.** A feed of twenty posts that loads full-size originals for every tile pulls tens of megabytes to render a grid nobody has clicked. Videos play in the lightbox, not in the grid, for the same reason.
- **A multipart request is only sent when there are files.** The API answers both, and the JSON path stays the readable one. `lib/announcement-form.js` builds the body, because `audience` and `links` have to be JSON-encoded into it and forgetting that produces a confusing error about the audience rather than about the encoding.
- **Object URLs for file previews must be revoked.** `useFilePreviews` keys them by the `File` itself so re-renders reuse one URL, and revokes on unmount. Minting a fresh `URL.createObjectURL` inline in the render leaks one blob per keystroke elsewhere in the form.

⚠ **An edit form that does not seed `links` wipes them.** The composer sends the list it holds, so a form initialised without `links: item.links ?? []` posts an empty array. Same trap as `committeeIds` two lines above it in `AnnouncementsContent.jsx`, and it has now been made twice.

### There are TWO event forms, and a default added to one is a bug in the other

Events are created from `/admin` announcements (`AnnouncementsContent.jsx`) and from a committee page (`CommitteesPage.jsx`). They are separate components with separate state, so any behaviour that feels like "how events work" has to be added to both or it becomes a difference nobody documented.

Picking a start now fills the end an hour later, which is what almost every chapter event runs. The rule lives in `lib/event-times.js` and both forms call it.

It is **stateless**: no ref tracks whether we auto-filled, because the previous form values already answer the question. The end is ours to overwrite exactly when it still equals what we would have suggested for the previous start, so an organiser who typed their own end keeps it, and the same form reused to *edit* an existing event never touches a stored one. A ref would have to be reset on mount, on cancel and on edit, and would be wrong in whichever of the three the next author forgets.

`plusHoursLocal` builds and reads the value from date components and never through `toISOString()`. `datetime-local` is wall clock with no zone, so a UTC round trip shifts it by the machine's offset and a 6:00 PM event saves as 10:00 PM.

### Setting a caret inside a controlled textarea's key handler puts it in the old string

The interview note editor rewrites the draft on Enter and Tab to continue or indent a bullet. The obvious place to restore the caret is right there in `onKeyDown`, next to the rewrite. It is wrong: the textarea is controlled, so at that moment React has not painted the new value, and `setSelectionRange` measures against the string still on screen. The caret lands somewhere arbitrary, usually the end.

`InterviewNotes.jsx` stashes the target offset in a ref and applies it in an effect keyed on the draft, after the paint. Every "my cursor jumps to the end when I press Enter" report in a controlled editor is this bug.

The arithmetic itself lives in `lib/interview-note-format.js` as a **pure function returning `{ value, caret }`**, with no DOM access, precisely so the part that breaks can be tested without a React tree.

### Only intercept Tab when you are certain you want it

Same editor. Tab indents a bullet, so it is tempting to `preventDefault()` on Tab inside the textarea. Doing that unconditionally traps keyboard users in the control with no way to leave it, which is a real accessibility failure and not worth an indent shortcut.

`bulletKeyDown` returns `null` for "not mine" and the component only calls `preventDefault()` when it returns a value, so off a bullet line Tab moves focus like it does everywhere else.

### A CSV export has three ways to be wrong and none of them throw

`lib/csv.js` exists so these are solved once. Reach for it rather than joining strings.

- **Formula injection.** A cell starting `=`, `+`, `-`, `@` or a control character is executed on open by both Google Sheets and Excel. Exported values here are typed by rushees — people outside the chapter — into a sheet eboard opens, so `=IMPORTXML(...)` in a free-text answer is a real exfiltration path. Each is prefixed with a single quote, which neither program displays. **Quoting is not neutralisation**: Excel strips the quotes and evaluates what is inside, so the prefix has to go on first.
- **The UTF-8 BOM.** Excel does not sniff UTF-8 in a `.csv` and falls back to the system codepage, so without the BOM every accented name opens mangled. A name is exactly the value nobody re-checks before mailing the sheet around.
- **CRLF and RFC 4180 quoting.** A comma inside a value silently becomes a column break, shifting every column after it on that row — the failure that looks fine until somebody sorts the sheet.

`downloadCsv` also revokes its object URL; without that, a member exporting repeatedly leaks one copy of the sheet per click for the lifetime of the tab.

### One table, two portal routes — that is the correct shape, not duplication

`components/rush/RushInterestTable.jsx` is rendered by both `/admin/rushees` (its Rushee Data tab) and `/member/rush-data`. That is not an oversight to be cleaned up: `proxy.ts` hard-gates `/admin` to `eboard` and redirects an eboard-only account away from `/member`, so **no single route can serve eboard and the pledge committee at once**. Two thin pages over one component is the fix; two components is the failure this avoids (see the trait markup, which does exist twice).

Neither route is the access boundary. Any member can type `/member/rush-data`; the API answers 403 and the component renders it. The nav entry is hidden by `useRushDataAccess`, which asks the API — the same shape as the Interviews tab, so an entry never appears for someone the endpoint would refuse. `proxy.ts` genuinely cannot help: the rule involves committee membership, which lives in Postgres and deliberately never in the JWT.

### `/rush` is public, `/rushee` is the portal

`/rush` and `/rush/how-it-works` are **public marketing pages** linked from the homepage. The rushee portal is `/rushee`. Putting a portal `layout.jsx` under `/rush` wraps the public page in the authenticated shell and breaks it for signed-out visitors. The `proxy.ts` matcher covers `/rushee` and deliberately not `/rush`.

### A build cannot catch a wrong sidebar

Each portal owns its nav in `app/<portal>/layout.jsx` (`buildNav`). A wrong href compiles perfectly and just goes somewhere wrong, or vanishes. If you change nav, click through every portal, or evaluate the `buildNav` functions in Node and diff the href sets.

Several shared components take an `accent` prop with **no default** — omitting it doesn't error, it quietly renders an older unstyled variant. A page that looks unexpectedly plain is usually a missing accent.

### Any user-supplied value that becomes an `href` must be sanitised

**`new URL()` is not a safety check.** `new URL("javascript:alert(1)")` parses fine — it is a valid URL. An `href` is a different trust context from a text node: React escapes text, so a hostile string in a name or bio is inert, but `<a href={value}>` with `javascript:` runs in the reader's session.

We shipped exactly this bug: document links were validated with `try { new URL(raw) } catch {}`, and `PhotoFiles.jsx` renders them as links. Fixed 2026-08-05.

Use `linkedinHref()` in `lib/portal-format.js` on the render side, and make sure the API validates on write (`services/urls.js`). If a value fails, render **no link** rather than a broken one.

### Some profile fields write to Authentik, not just to us

**Username is the one that does.** Authentik owns login identifiers, so `PUT /users/me/username` writes there first and only mirrors into our database once that succeeds — and it needs an Authentik permission (`Can change User`) that is not granted by default.

Practical consequences if you touch profile code:

- It is a **separate endpoint and a separate control** (`components/profile/UsernameEditor.jsx`), not a field in `ProfileForm`. Do not "tidy" it back into the form: a rename fails with "that name is taken", which inside the main form surfaces as a whole-form error on a save that was really about someone's bio.
- The access token keeps the **old** username for the rest of the session after a rename, so anything that writes `username` from `session.user` will silently undo it.

### A Server Action that throws loses its message in production

React replaces it with the generic **"An error occurred in the Server Components render"** (error #441). So a `throw new Error('That username is taken')` inside a server action reaches the browser as that string instead — and if you render `err.message`, that is what the member reads.

If the failure is meant to be *read by a person*, **return `{ error }` instead of throwing** and check for it at the call site. `uploadProfilePicture` and `updateUsername` in `lib/portal-api.js` are the pattern. Throwing is still right for `redirect('/login')`, which is not a message.

**Every export in `lib/portal-api.js` is a Server Action** — the `'use server'` is on line 1 and covers the whole file, which is easy to forget when a function looks like a plain fetch wrapper.

This has now shipped wrong **three times**: first on the username feature; then on interview deletion, where the "N people have already booked this slot" warning — the only thing standing between a misclick and real cancelled interviews — read as the #441 digest in production for six days; then on **group chats**, where eboard adding a group to a chat got #441 and no way to find out why.

The group-chat one is the instructive failure, because the reasoning that caused it was written down in the code as a justification: *"The official path still throws on failure (createGroupChat is unchanged and eboard-only)."* **"It's eboard-only" is not a reason to throw.** Eboard has to read failures too, and the route they were hitting answers 409 with three different sentences depending on the chat. `createGroupChat` and `setGroupChatAudience` now return `{ chat }` / `{ error }`.

Use the `resultOf` helper in `lib/portal-api.js` rather than hand-rolling a fourth copy of the try/catch — it wraps a throwing `apiRequest` call into `{ data }` / `{ error }` and rethrows the redirect, which must always propagate.

**A useful smell: any endpoint that answers 409 is carrying a message somebody has to read.** `PUT /events/:id/rsvp` is one, and `setEventRsvp` returns `{ error }` for exactly this reason.

### A session in the cookie is not proof of who is at the keyboard

There are **two** sessions in a browser: ours (the NextAuth cookie) and Authentik's own SSO cookie. Nothing keeps them in step, and a `refresh_token` is not tied to the browser session, so ours renews itself happily while Authentik's belongs to somebody else.

That happens routinely, not rarely: a member is signed in, someone scans the rush QR code on the same laptop, and enrolling makes Authentik's session the **new rushee** while our cookie still says **member**.

`/login` and `/auth/start` used to `redirect()` the moment they saw any session. Two things followed — the rushee landed inside the member's portal, and the next time our cookie lapsed the silent `prompt=none` probe asked Authentik who this was, got the rushee, and rewrote the member's session. That is the "my username changed by itself" report.

Both pages now render `AlreadySignedIn` instead of redirecting. If you are editing sign-in:

- **`/auth/start` is the only guard that catches a QR-code signup.** The link goes straight to Authentik; the site sees nothing until `next=` brings the browser back. Do not move logic out of it on the grounds that `/rush/how-it-works` already checks — most rushees never load that page.
- **`switchAccount()` must not become `logoutEverywhere()`.** It clears only our cookie on purpose: Authentik's session may be the *other* person's brand-new account, and ending it makes them sign up again.
- **The `prompt=login` on `/login?switch=1` is load-bearing**, not belt-and-braces. Without it, "sign in as someone else" silently reuses Authentik's session and returns the account the person just rejected — a loop, on `/auth/start`.
- **Every entry point needs its own `takeAutoSignInSlot` name.** Sharing one broke signup once already; see `lib/sso.js`.
- **`AutoSignIn`'s cooldown branch must not redirect** — it stops and waits for a click. It used to `router.replace('/login')`, which closed a loop the day `/login` gained a button leading back toward `/auth/start`. The guard fires exactly when something upstream is already bouncing the browser, so redirecting hands control to a page that may hand it straight back. Keep the stop.

### "Signed out" may not mean signed out of Authentik

Confirmed 2026-08-09: signing out cleared our cookie but left the **Authentik SSO session alive**, because the OAuth2 provider's *Invalidation flow* was the provider-scoped one (`default-provider-invalidation-flow`), which ends only the application session. `post_logout_redirect_uri` is still honoured, so it looks like it worked.

Nothing in this repo can detect it — a `refresh_token` is not tied to the browser session. **Do not debug this in code.** Check Authentik → Providers → ktpapp → Invalidation flow, and verify by signing out then opening `auth.ugaktp.com` directly.

This is the enabler for the whole "two sessions in one browser" family, up to and including rush enrollment renaming the account that was still signed in.
