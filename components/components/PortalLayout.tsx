'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Calendar, FolderOpen, Users, CalendarDays, 
  Library, Megaphone, BarChart3, UserCog, Menu, X, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const getPortalType = () => {
    if (pathname.startsWith('/member')) return 'member';
    if (pathname.startsWith('/alumni')) return 'alumni';
    if (pathname.startsWith('/admin')) return 'admin';
    return 'member';
  };

  const portalType = getPortalType();

  const navigationItems = {
    member: [
      { name: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard },
      { name: 'Calendar', href: '/member/calendar', icon: Calendar },
      { name: 'Files & Photos', href: '/member/files', icon: FolderOpen },
    ],
    alumni: [
      { name: 'Directory', href: '/alumni/directory', icon: Users },
      { name: 'Events', href: '/alumni/events', icon: CalendarDays },
      { name: 'Resources', href: '/alumni/resources', icon: Library },
    ],
    admin: [
      { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { name: 'User Management', href: '/admin/users', icon: UserCog },
    ],
  };

  const portalTitles = { member: 'Member Portal', alumni: 'Alumni Portal', admin: 'Admin Portal' };
  const navigation = navigationItems[portalType];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">ΚΘΠ</span>
                </div>
                <span className="hidden sm:block text-xl font-semibold text-gray-900">KTP Georgia</span>
              </Link>
              <div className="hidden md:block h-6 w-px bg-gray-300" />
              <span className="hidden md:block text-sm text-gray-600">{portalTitles[portalType]}</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/login')} className="hidden md:flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
              <button onClick={() => router.push('/login')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
