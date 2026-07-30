'use client';

import { Calendar, LayoutDashboard, Megaphone, MessageSquare, Settings, Vote } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';

// NOTE: this portal lives at /rushee, NOT /rush — /rush is the PUBLIC rush
// marketing page (countdown timer, FAQ, schedule) linked from the homepage,
// code-of-conduct and members-list. Putting a portal layout at /rush would
// wrap that public page in the authenticated shell and break it.
//
// Deliberately the smallest nav of the five portals. No Directory, Files or
// Committees: those are gated on SHARED_ALBUM_GROUPS server-side, which
// excludes rush, so linking them would only offer doors that 403.
//
// No Attendance tab either — AttendancePage lists events you can *manage*, so
// it renders empty for a rushee. They check in by scanning a QR, which opens
// /checkin/[eventId]/[token] outside the portal.
//
// This array must stay in sync with NAV_GROUPING.violet in PortalShell.jsx —
// an href in one and not the other silently disappears from the sidebar.
const NAV = [
  { href: '/rushee', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/rushee/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/rushee/calendar', label: 'Calendar', icon: Calendar },
  { href: '/rushee/polls', label: 'Polls', icon: Vote },
  { href: '/rushee/messages', label: 'Messages', icon: MessageSquare },
  { href: '/rushee/settings', label: 'Settings', icon: Settings },
];

export default function RusheeLayout({ children }) {
  return (
    <PortalShell portalName="Rush Portal" accent="violet" nav={NAV}>
      {children}
    </PortalShell>
  );
}
