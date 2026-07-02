'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Calendar, FolderOpen, Users, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

const NAV = [
  { href: '/member', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/member/calendar', label: 'Calendar', icon: Calendar },
  { href: '/member/directory', label: 'Directory', icon: Users },
  { href: '/member/files', label: 'Files & Photos', icon: FolderOpen },
];

export default function MemberLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 md:flex-row">
      {/* Sidebar */}
      <aside className="sticky top-0 z-30 flex w-full shrink-0 flex-col border-b border-slate-200 bg-white/95 backdrop-blur-md md:static md:min-h-screen md:w-60 md:border-b-0 md:border-r md:bg-white/80">
        {/* Sidebar header with subtle blue gradient matching main site */}
        <div className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-blue-950/5 to-transparent px-4 md:h-16 md:px-5">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/KTP PHI CHAPTER.svg" alt="KTP" width={36} height={36} className="h-8 w-auto" />
            <span className="font-semibold text-blue-900 text-sm">Member Portal</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-2 py-2 md:flex-1 md:flex-col md:space-y-1 md:overflow-visible md:px-3 md:py-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:gap-3 ${
                  active
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-slate-200 px-3 py-4 md:block">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
