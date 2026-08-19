'use client';

import { LayoutDashboard, BarChart2, Megaphone, Calendar, MessageSquare, Users, UsersRound, Vote, FolderOpen, Image as ImageIcon, ShieldAlert, Settings, Images, QrCode, CalendarClock, CalendarCheck, BookUser, ScrollText, Table2 } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';

// The sidebar renders exactly this, in this order.
//
// Reorganised 2026-08-03. The previous grouping had three problems:
//   - "Engagement" held 8 of the 16 items — half the nav in one bucket, which
//     is the same as no grouping at all.
//   - The two rush surfaces were in DIFFERENT sections (Rush Announcements
//     under Engagement, Rush Signup under Moderation), so running rush meant
//     hunting in two places. They are now one section.
//   - "Moderation" contained User Management and Rush Signup, neither of which
//     is moderation. Reports is the only genuine moderation surface, and it
//     sits with the other people-management tools.
//
// Nothing was added or removed by that reorganisation — all 16 items survived
// it. The 17th, Dashboard, was added later when Analytics stopped being the
// landing page (see Overview below).
function buildNav() {
  return [
  {
    heading: 'Overview',
    items: [
      // The portal root is the same dashboard member/pledge/rushee land on.
      // Analytics used to live here; it moved to its own route so eboard sees
      // the chapter at a glance first, the way every other portal opens.
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    ],
  },
  {
    // What's happening and who turned up.
    heading: 'Programming',
    items: [
      { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
      { href: '/admin/meetings', label: 'Meetings', icon: CalendarClock },
      { href: '/admin/attendance', label: 'Attendance', icon: QrCode },
      { href: '/admin/polls', label: 'Polls', icon: Vote },
    ],
  },
  {
    // Talking TO the chapter, broadcast and direct.
    heading: 'Communication',
    items: [
      // Named for what the page actually holds: AnnouncementsContent has two
      // tabs, Announcements and Events, and events are created/edited here
      // rather than on the Calendar tab. "&" matches "Files & Photos" below.
      { href: '/admin/announcements', label: 'Announcements & Events', icon: Megaphone },
      { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    // Everything rush, in one place, because it's run as one job for a few
    // weeks a year and then goes quiet.
    heading: 'Rush',
    items: [
      { href: '/admin/rush-announcements', label: 'Rush Announcements', icon: Megaphone },
      { href: '/admin/rush-signup', label: 'Rush Signup', icon: QrCode },
      // The interest form answers, replacing the Google Forms response sheet.
      // Unconditional here because this whole portal is eboard-only; the
      // pledge committee reaches the same table at /member/rush-data, where
      // the entry IS conditional. One component behind both.
      { href: '/admin/rush-data', label: 'Rushee Data', icon: Table2 },
      // In Rush rather than beside Meetings: it runs one week a year as part
      // of rush, and Meetings is the chapter-wide feature rushees can't touch.
      { href: '/admin/interviews', label: 'Interviews', icon: CalendarCheck },
      // Rushees used to be a fourth entry here, appearing only during rush.
      // They're a tab inside the Directory now (People, below), so looking
      // somebody up is one destination whoever they are.
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
      { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
      // Everything created, edited or deleted site-wide. Sits with the other
      // people-oversight tools rather than under Overview: it answers "who
      // did that", which is a question about people.
      { href: '/admin/logs', label: 'Activity Log', icon: ScrollText },
    ],
  },
  {
    heading: 'Content',
    items: [
      { href: '/admin/files', label: 'Files & Photos', icon: FolderOpen },
      { href: '/admin/homepage-photos', label: 'Homepage Photos', icon: ImageIcon },
      { href: '/admin/ios-homepage-slideshow', label: 'Homepage Slideshow', icon: Images },
    ],
  },
  {
    heading: 'Account',
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
