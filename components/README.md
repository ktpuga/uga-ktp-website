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

Shared portal components take an `accent` (sometimes `theme`) prop and look up their colors from a local `ACCENT_THEMES` map:

| Value | Portal |
|---|---|
| `blue` | Member |
| `red` | Admin |
| `amber` | Alumni |
| `teal` | Pledge |

Two things to know before touching this:

**Several of these components have no default accent value.** Omitting the prop doesn't throw — it silently renders the older, unstyled variant. If a page looks unexpectedly plain, check that its `page.jsx` wrapper actually passes an accent before assuming the component is broken.

**Adding a new accent requires editing `PortalShell.jsx` in two places** — `REVAMPED_ACCENTS` *and* `NAV_GROUPING`. `REVAMPED_ACCENTS` alone is what switches a portal onto the styled sidebar; if `NAV_GROUPING` has no matching key, the sidebar then renders with zero nav items. That's an empty sidebar, not a graceful fallback.

## Adding a nav item

Also two edits, for the same reason:

1. The `NAV` array in that portal's `app/<portal>/layout.jsx`
2. `NAV_GROUPING` in `portal/PortalShell.jsx`

The sidebar only renders hrefs listed in `NAV_GROUPING`. Miss step 2 and the item never appears, even though the route and layout are both correct.

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

`LegacyCommitteesPage.jsx` is the one survivor, still referenced by `CommitteesPage.jsx`. It was left in place only because that file was being edited elsewhere at the time; it's equally unreachable and can go the same way.

Git history has all of them if anything is ever needed back.
