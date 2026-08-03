'use client';

import { BarChart2, Megaphone, Calendar, MessageSquare, Users, UsersRound, Vote, FolderOpen, Image as ImageIcon, ShieldAlert, Settings, Images, QrCode, CalendarClock, UserSearch } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';
import { useRushCount } from '@/lib/use-rush-count';

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
// Nothing was added or removed — all 16 items are still here.
function buildNav(hasRushees) {
  return [
  {
    heading: 'Overview',
    items: [{ href: '/admin', label: 'Analytics', icon: BarChart2 }],
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
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
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
        // Only while rush is running — see useRushCount.
        ...(hasRushees ? [{ href: '/admin/rushees', label: 'Rushees', icon: UserSearch }] : []),
    ],
  },
  {
    heading: 'People',
    items: [
      { href: '/admin/users', label: 'User Management', icon: Users },
      { href: '/admin/committees', label: 'Committees', icon: UsersRound },
      { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
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
  const rushCount = useRushCount();

  return (
    <PortalShell portalName="Admin Portal" accent="red" homeHref="/admin" nav={buildNav(rushCount > 0)} responsive={false}>
      {children}
    </PortalShell>
  );
}
