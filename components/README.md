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

The same applies to `profile/ProfileForm.jsx`, which is shared with the onboarding flow. Embed it as-is rather than rebuilding its fields.

## `Legacy*` files — removed 2026-08-02

Pre-redesign copies kept behind an accent check during the portal revamp. Every portal passes `blue`, `amber` or `red`, all of which took the revamped branch, so they had become unreachable — about 4,400 lines that could never execute.

They're deleted, along with the accent check. An unrecognised accent now renders the current design with the blue palette (every component already did `ACCENT_THEMES[key] ?? ACCENT_THEMES.blue`), which is a better failure than a second copy of the UI that nobody maintains.

**Why this mattered rather than being tidiness:** two copies of the same screen is exactly how the `CircleCheck`/`BlockButton` fix kept disappearing — it would land in one copy and not the other, and the bug looked like it had been reintroduced from nowhere.

All six are gone, including `LegacyCommitteesPage.jsx`, which was held back briefly only because `CommitteesPage.jsx` was being edited elsewhere at the time.

Git history has them if anything is ever needed back.
