'use client';

import { BarChart2, Megaphone, Calendar, MessageSquare, Users, UsersRound, Vote, FolderOpen, Image as ImageIcon, ShieldAlert, Settings, Images, QrCode, CalendarClock } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';

// The sidebar renders exactly this, in this order. Note that the grouping is
// NOT the same order as the old flat array — Rush Signup sat fourth here but
// has always rendered under Moderation, because PortalShell's NAV_GROUPING
// decided the order and this array only decided which items existed. That
// split is gone; what you read here is what ships.
const NAV = [
  {
    heading: 'Overview',
    items: [{ href: '/admin', label: 'Analytics', icon: BarChart2 }],
  },
  {
    heading: 'Engagement',
    items: [
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/admin/rush-announcements', label: 'Rush Announcements', icon: Megaphone },
      { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
      { href: '/admin/committees', label: 'Committees', icon: UsersRound },
      { href: '/admin/polls', label: 'Polls', icon: Vote },
      { href: '/admin/attendance', label: 'Attendance', icon: QrCode },
      { href: '/admin/meetings', label: 'Meetings', icon: CalendarClock },
      { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    heading: 'Moderation',
    items: [
      { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
      { href: '/admin/users', label: 'User Management', icon: Users },
      { href: '/admin/rush-signup', label: 'Rush Signup', icon: QrCode },
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

export default function AdminLayout({ children }) {
  return (
    <PortalShell portalName="Admin Portal" accent="red" homeHref="/admin" nav={NAV} responsive={false}>
      {children}
    </PortalShell>
  );
}
