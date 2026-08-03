'use client';

import { Calendar, LayoutDashboard, Megaphone, MessageSquare, Settings, Vote, CalendarClock } from 'lucide-react';
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
// This used to carry a warning that it "must stay in sync with
// NAV_GROUPING.violet in PortalShell.jsx". There is no longer a second list to
// sync with — the sidebar renders exactly what is below.
const NAV = [
  {
    heading: 'Rush',
    items: [
      { href: '/rushee', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/rushee/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/rushee/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    heading: 'Take Part',
    items: [
      { href: '/rushee/polls', label: 'Polls', icon: Vote },
      { href: '/rushee/meetings', label: 'Meetings', icon: CalendarClock },
      { href: '/rushee/messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    heading: 'Account',
    items: [{ href: '/rushee/settings', label: 'Settings', icon: Settings }],
  },
];

// accent="violet" renders the same blue as Member and always has. See the note
// in app/pledge/layout.jsx — this can now safely become 'blue'.
export default function RusheeLayout({ children }) {
  return (
    <PortalShell portalName="Rush Portal" accent="violet" homeHref="/rushee" nav={NAV}>
      {children}
    </PortalShell>
  );
}
