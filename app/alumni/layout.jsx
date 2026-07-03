'use client';

import { LayoutDashboard, Calendar, FolderOpen, Users, Settings, MessageSquare } from 'lucide-react';
import PortalShell from '@/components/portal/PortalShell';

const NAV = [
  { href: '/alumni', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/alumni/calendar', label: 'Calendar', icon: Calendar },
  { href: '/alumni/directory', label: 'Directory', icon: Users },
  { href: '/alumni/files', label: 'Files & Photos', icon: FolderOpen },
  { href: '/alumni/messages', label: 'Messages', icon: MessageSquare },
  { href: '/alumni/settings', label: 'Settings', icon: Settings },
];

export default function AlumniLayout({ children }) {
  return (
    <PortalShell portalName="Alumni Portal" accent="amber" nav={NAV}>
      {children}
    </PortalShell>
  );
}
