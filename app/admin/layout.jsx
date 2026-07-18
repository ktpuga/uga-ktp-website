'use client';

import { BarChart2, Megaphone, Calendar, MessageSquare, Users, UsersRound, Vote, FolderOpen, Image as ImageIcon, ShieldAlert, Settings } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';

const NAV = [
  { href: '/admin', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { href: '/admin/committees', label: 'Committees', icon: UsersRound },
  { href: '/admin/polls', label: 'Polls', icon: Vote },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/files', label: 'Files & Photos', icon: FolderOpen },
  { href: '/admin/homepage-photos', label: 'Homepage Photos', icon: ImageIcon },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }) {
  return (
    <PortalShell portalName="Admin Portal" accent="red" nav={NAV} responsive={false}>
      {children}
    </PortalShell>
  );
}
