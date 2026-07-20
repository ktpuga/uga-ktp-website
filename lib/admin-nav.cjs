const { BarChart2, Calendar, FolderOpen, Image: ImageIcon, Images, Megaphone, MessageSquare, Settings, ShieldAlert, Users, UsersRound, Vote } = require('lucide-react');

function buildAdminNav(groups = []) {
  const nav = [
    { href: '/admin', label: 'Analytics', icon: BarChart2 },
    { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
    { href: '/admin/committees', label: 'Committees', icon: UsersRound },
    { href: '/admin/polls', label: 'Polls', icon: Vote },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/reports', label: 'Reports', icon: ShieldAlert },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/files', label: 'Files & Photos', icon: FolderOpen },
  ];

  if ((groups ?? []).includes('eboard')) {
    nav.push({ href: '/admin/slideshow', label: 'Slideshow', icon: Images });
  }

  nav.push({ href: '/admin/homepage-photos', label: 'Homepage Photos', icon: ImageIcon });
  nav.push({ href: '/admin/settings', label: 'Settings', icon: Settings });
  return nav;
}

module.exports = { buildAdminNav };
