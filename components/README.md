# components/

Most of what's in here is shared by **all four portals** — `/member`, `/admin`, `/alumni`, and `/pledge`. Editing one of these files changes the experience for every group at once. That's usually what you want; it's also the easiest way to break three portals while testing one.

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

### Nav badges

A nav item's badge number comes from `badgeFor(href)` in `PortalShell`, the one
place that decides it. The shell renders its nav **four times** — desktop
revamped, desktop legacy, and a mobile sheet for each — so a condition inlined
into one of them badges in some layouts and not others. That is exactly what
`href.endsWith('/messages')` used to do in all four.

Two sources feed it and they are not interchangeable:

- **Messages** — `useUnreadCounts()`, real per-message read receipts.
- **Everything else** — `useTabNotifications()`, a per-tab cursor. Visiting a
  tab marks it seen, and the tab currently being viewed never badges.

A new badged tab needs `NOTIFICATION_TABS` in `lib/use-tab-notifications.js`
**and** `notificationCursorModel.TABS` plus the `CHECK` constraint in the API.
Missing one side doesn't error — it just never badges.

## Profile pictures

Use a plain `<img>` with an `onError` handler falling back to initials. Prefer this over `ui/avatar.jsx`'s Radix-based `Avatar` — Radix's `AvatarFallback` can stay visible even after the image successfully loads, which has caused initials-only-avatar bugs here more than once.

**Build the `src` with `profilePictureSrc(id, avatarAssetId(member))` from `lib/avatar.js`, never as a template literal.** The media proxy sends no `Cache-Control`, so a URL keyed on the member id alone is identical before and after they change their photo and the browser keeps serving the old one — that is trap #9 in `TODO.md`, and it was live on seven surfaces at once because each built its own URL. The cache-buster is the Immich asset id, which changes exactly when the picture does; a timestamp or a render counter would change on every paint and re-download every avatar in the directory on every load.

Two things that follow from it:

- **Guard on the built `src`, not only on your `err` flag.** `profilePictureSrc` returns `null` when there is no user id, and React drops a `null` src attribute rather than failing to load it — so `onError` never fires and you get a permanently empty circle instead of initials.
- **Key the error state on the asset id, not a boolean**, anywhere the photo can change while the component stays mounted. A sticky `err` flag means a member who had no photo when the page loaded stays on their initials after uploading one. `SidebarAvatar` in `PortalShell` and `GroupChatAvatar` in `MessagesPage` both do this; the shell especially, since it is a layout and never remounts on client-side navigation.

### Profile links: `profile/LinksField.jsx` is shared, and that is a data guard

`ProfileForm` (a member editing themselves) and `AdminEditProfileModal` (eboard editing anyone) both build their request body with `buildProfilePayload`, and the profile write is a **whole-row upsert**. So a form that renders no links input still sends `links: []`, and eboard fixing a typo in someone's major would erase all their links. Same shape as the `preserveEmail` trap in the API.

Both forms therefore use `useProfileLinks` + `LinksField` + `LinksHiddenInput` from one file. **If you add a third profile-editing surface, wire all three or that surface will quietly delete links.**

Two details inside it that are not obvious:

- **Row keys are not indexes.** Deleting a middle row renumbers every index below it, so React reuses the wrong input for the wrong row and the text visibly jumps to a different link. Each row carries a generated key instead.
- **The URL input has no `type="url"`.** The browser would refuse `example.com/you` before the form ever submits, and accepting a scheme-less host is precisely what `normalizeWebUrl` exists to do — that is what people paste.

Rendering side: link chips go through `safeExternalHref` even though the API already canonicalised them on write. An `href` is a different trust context from a text node, and this is the second of the two checks that trap #6 in `TODO.md` describes.

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

Two fields are conditional, and both conditions are load-bearing:

- **Pledge Class** is hidden from rushees (`isRushee`) — a pledge class is the thing they're rushing to get.
- **UGA Email** is hidden from alumni (`isAlumni`), and the remaining input is relabelled from "Personal Email" to just "Email". A UGA address stops working at graduation, so the personal one is the only one that still reaches an alumnus.

The alumni case has a trap worth knowing about before you touch it. `PUT /users/me/profile` is a **whole-row upsert**: every key absent from the payload is written as `NULL`. Because the form no longer renders a UGA Email input for alumni, an alumnus saving an unrelated change sends no `email` — which would erase whatever address is on file. The API guards this (`userModel.updateProfile`'s `preserveEmail`), so the value survives, but the same trap applies to **any** field you make conditional here. Hiding an input in this form is equivalent to clearing the column unless the API is taught otherwise.

Both checks prefer the resolved `member_group` over the raw session `groups` list where one is available. Authentik doesn't remove someone's old group when they change status, so the raw list can still say `active` for an alumnus or `rush` for a new pledge.

## Don't point `ProfileForm` at another user

`admin/AdminEditProfileModal.jsx` is a separate form on purpose, and reunifying the two is a trap worth naming.

`ProfileForm` decides what to render by reading the **session**: `isRushee` and `isAlumni` describe whoever is logged in. Eboard editing someone else means the session is the *editor's*, so those checks would answer for the wrong person — an eboard member editing an alumnus would get the eboard field set — and the form posts to `/users/me/profile`, which would save the edit onto the editor's own row.

The two share the parts that actually need to stay in step: `buildProfilePayload` from `lib/profile.js`, so both send byte-identical bodies, and `services/profileFields.js` in the API, so both are validated by one set of rules rather than two copies that drift.

The admin modal also shows **every** field unconditionally, including UGA Email for alumni. It's the surface for fixing bad data, and the directory masks an alumnus's UGA address on read regardless.

## Every profile field is validated by the API, and the message has to survive

The rules live once, in `services/profileFields.js` — names ≤100 and trimmed before the required check, `major` ≤120, `pledge_class` ≤50, `phone` 7–15 digits, `dob` a real `YYYY-MM-DD` date no later than today, and `graduation_date` a semester plus a four-digit year. `about_me` is the one field that truncates instead of rejecting. Full table: [API docs](https://docs.ugaktp.com/api/endpoints#put-usersmeprofile).

Two consequences for this form:

- **`updateProfile` returns `{ error }` and does not throw.** It used to go through `apiPut`, which throws on a non-ok response, and a thrown Server Action error becomes React #441 in production (trap 8 in `TODO.md`). That was survivable while the only 400s came from rules the form pre-empts on the client; it stopped being survivable once a phone number or a graduation year could fail. Anything else here that a member must read needs the same shape.
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
