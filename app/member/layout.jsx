'use client';

import { LayoutDashboard, Megaphone, Calendar, FolderOpen, Users, Settings, MessageSquare, UsersRound, Vote, QrCode, CalendarClock, ClipboardList, Table2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import PortalShell from '@/components/portal/PortalShell';
import { useInterviewerRounds } from '@/lib/use-interviewer-rounds';
import { useRushDataAccess } from '@/lib/use-rush-data-access';

// The sidebar renders exactly this, in this order. It used to be a flat array
// here plus a matching NAV_GROUPING entry in PortalShell keyed by accent —
// two files that had to agree, where an href in one and not the other silently
// vanished from the sidebar. Now there is only this.
const ATTENDANCE_ITEM = { href: '/member/attendance', label: 'Attendance', icon: QrCode };

function buildNav(isChair, canInterview, canViewRushData) {
  return [
    {
      heading: 'Main',
      items: [
        { href: '/member', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/member/announcements', label: 'Announcements', icon: Megaphone },
        { href: '/member/calendar', label: 'Calendar', icon: Calendar },
      ],
    },
    {
      heading: 'Community',
      items: [
        // Rushees used to be a sibling entry here. They're a tab inside the
        // Directory now, along with every other member group, so there is one
        // place to look people up rather than two.
        { href: '/member/directory', label: 'Directory', icon: Users },
        { href: '/member/meetings', label: 'Meetings', icon: CalendarClock },
        // Only for members of a committee eboard designated on a published
        // interview round. The API decides that — it returns no rounds to
        // anyone else — so this tab cannot appear for someone it would 403.
        ...(canInterview ? [{ href: '/member/interviews', label: 'Interviews', icon: ClipboardList }] : []),
        // Only for members of a committee eboard flagged with
        // can_view_rush_data (the pledge committee). Same shape as Interviews
        // above and for the same reason: the API answers the question, so this
        // entry cannot appear for someone the endpoint would then 403.
        ...(canViewRushData ? [{ href: '/member/rush-data', label: 'Rushee Data', icon: Table2 }] : []),
        { href: '/member/committees', label: 'Committees', icon: UsersRound },
        { href: '/member/polls', label: 'Polls', icon: Vote },
        // Chairs manage attendance for their own events; plain active members
        // never see this tab at all (eboard uses the /admin one instead —
        // eboard never lands on /member per proxy.ts's portal routing).
        ...(isChair ? [ATTENDANCE_ITEM] : []),
      ],
    },
    {
      heading: 'Resources',
      items: [
        { href: '/member/files', label: 'Files & Photos', icon: FolderOpen },
        { href: '/member/messages', label: 'Messages', icon: MessageSquare },
      ],
    },
    {
      heading: 'Account',
      items: [{ href: '/member/settings', label: 'Settings', icon: Settings }],
    },
  ];
}

export default function MemberLayout({ children }) {
  const { data: session } = useSession();
  const isChair = session?.user?.groups?.includes('chair') ?? false;
  const { rounds } = useInterviewerRounds();
  const { canView } = useRushDataAccess();

  return (
    <PortalShell
      portalName="Member Portal"
      accent="blue"
      homeHref="/member"
      nav={buildNav(isChair, rounds.length > 0, canView)}
    >
      {children}
    </PortalShell>
  );
}
