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

## Profile pictures

Use a plain `<img>` with an `onError` handler falling back to initials. Prefer this over `ui/avatar.jsx`'s Radix-based `Avatar` — Radix's `AvatarFallback` can stay visible even after the image successfully loads, which has caused initials-only-avatar bugs here more than once.

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

## `Legacy*` files — removed 2026-08-02

Pre-redesign copies kept behind an accent check during the portal revamp. Every portal passes `blue`, `amber` or `red`, all of which took the revamped branch, so they had become unreachable — about 4,400 lines that could never execute.

They're deleted, along with the accent check. An unrecognised accent now renders the current design with the blue palette (every component already did `ACCENT_THEMES[key] ?? ACCENT_THEMES.blue`), which is a better failure than a second copy of the UI that nobody maintains.

**Why this mattered rather than being tidiness:** two copies of the same screen is exactly how the `CircleCheck`/`BlockButton` fix kept disappearing — it would land in one copy and not the other, and the bug looked like it had been reintroduced from nowhere.

All six are gone, including `LegacyCommitteesPage.jsx`, which was held back briefly only because `CommitteesPage.jsx` was being edited elsewhere at the time.

Git history has them if anything is ever needed back.
