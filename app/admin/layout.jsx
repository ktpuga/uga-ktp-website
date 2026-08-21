'use client';

import { LayoutDashboard, Megaphone, Calendar, MessageSquare, Users, UsersRound, Vote, FolderOpen, Image as ImageIcon, ShieldAlert, Settings, QrCode, CalendarClock, CalendarCheck, BookUser, Table2 } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';

// The sidebar renders exactly this, in this order.
//
// Reorganised 2026-08-03, then again after the tab merges below cut 21 entries
// to 17. The 2026-08-03 pass fixed three things worth not undoing:
//   - "Engagement" held 8 of the 16 items, which is the same as no grouping.
//   - The two rush surfaces sat in DIFFERENT sections, so running rush meant
//     hunting in two places. They are one section.
//   - "Moderation" contained User Management and Rush Signup, neither of which
//     is moderation.
//
// This pass changed the shape rather than the membership:
//   - Dashboard and Settings are `pinned`: each was a section holding a single
//     item, so its heading cost a click to reveal one link. They now sit
//     outside the accordion with a rule separating them.
//   - "Programming" is now "Events". In a TECHNOLOGY fraternity that word reads
//     as writing code, which is the one thing the section has nothing to do
//     with.
//   - Polls moved from there to Communication, which is what makes "Events" an
//     honest name for what is left: a poll is asking the chapter something, not
//     an event. Moving an item between sections is free -- notification badges
//     key on the href's last segment, never on the section.
//   - "Content" is now "Files & Media". It holds the INTERNAL document library
//     alongside the public homepage surfaces, so "Website" would have been
//     wrong for half of it.
//
// Five headings over 15 items, plus the 2 pinned: 3/3/4/3/2.
function buildNav() {
  return [
  {
    // Not a section. `pinned` renders the item with no heading; the heading is
    // still required because it keys the group. See PortalShell's `nav` shape.
    heading: 'Overview',
    pinned: true,
    items: [
      // The portal root is the same dashboard member/pledge/rushee land on.
      // Analytics is the second TAB on it rather than a route of its own, and
      // Dashboard is first there so eboard still sees the chapter at a glance
      // on arrival, the way every other portal opens.
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    // Talking TO the chapter: broadcast, direct, and asking.
    heading: 'Communication',
    items: [
      // Named for what the page actually holds: AnnouncementsContent has two
      // tabs, Announcements and Events, and events are created/edited here
      // rather than on the Calendar tab.
      { href: '/admin/announcements', label: 'Announcements & Events', icon: Megaphone },
      { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
      // Here rather than under Events: a poll asks the chapter something, which
      // is the same job as an announcement, not a thing on the calendar.
      { href: '/admin/polls', label: 'Polls', icon: Vote },
    ],
  },
  {
    // What's happening and who turned up.
    heading: 'Events',
    items: [
      { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
      { href: '/admin/meetings', label: 'Meetings', icon: CalendarClock },
      { href: '/admin/attendance', label: 'Attendance', icon: QrCode },
    ],
  },
  {
    heading: 'People',
    items: [
      // The same directory the member and pledge portals get, unchanged.
      // Eboard had no read-only view of the chapter at all: User Management
      // below is an editing tool, and answering "what's their major" meant
      // opening an edit form for somebody you had no intention of editing.
      { href: '/admin/directory', label: 'Directory', icon: BookUser },
      { href: '/admin/users', label: 'User Management', icon: Users },
      { href: '/admin/committees', label: 'Committees', icon: UsersRound },
      // Reports (what members flagged) and the Activity Log (everything created,
      // edited or deleted site-wide), merged: both answer "who did that", which
      // is a question about people, so this sits with the other people-oversight
      // tools rather than under Overview.
      { href: '/admin/oversight', label: 'Oversight', icon: ShieldAlert },
    ],
  },
  {
    // Everything rush, in one place, because it's run as one job for a few
    // weeks a year and then goes quiet.
    heading: 'Rush',
    items: [
      { href: '/admin/rush-announcements', label: 'Rush Announcements', icon: Megaphone },
      // Signup Links and Rushee Data, merged: one hands out the link, the other
      // reads what came back through it. The interest form answers replace the
      // Google Forms response sheet.
      //
      // Unconditional here because this whole portal is eboard-only; the pledge
      // committee reaches the same table at /member/rush-data, where the entry
      // IS conditional. One component behind both.
      { href: '/admin/rushees', label: 'Rushees', icon: Table2 },
      // In Rush rather than beside Meetings: it runs one week a year as part
      // of rush, and Meetings is the chapter-wide feature rushees can't touch.
      { href: '/admin/interviews', label: 'Interviews', icon: CalendarCheck },
      // Rushees used to be a fourth entry here, appearing only during rush.
      // They're a tab inside the Directory now (People, above), so looking
      // somebody up is one destination whoever they are.
    ],
  },
  {
    // The internal document library and the two public-facing homepage
    // surfaces. Not "Website": Files & Photos is the chapter's own library and
    // never appears on the public site.
    heading: 'Files & Media',
    items: [
      { href: '/admin/files', label: 'Files & Photos', icon: FolderOpen },
      // Homepage Photos (web gallery) and Homepage Slideshow (iOS app) were two
      // entries for one job: what a stranger sees when they open KTP. They are
      // now Website / iOS App tabs on a single page.
      { href: '/admin/homepage-media', label: 'Homepage Media', icon: ImageIcon },
    ],
  },
  {
    // Pinned, like Dashboard above: one item, no heading worth a click.
    heading: 'Account',
    pinned: true,
    items: [{ href: '/admin/settings', label: 'Settings', icon: Settings }],
  },
  ];
}

export default function AdminLayout({ children }) {
  return (
    <PortalShell portalName="Admin Portal" accent="red" homeHref="/admin" nav={buildNav()} responsive={false}>
      {children}
    </PortalShell>
  );
}
