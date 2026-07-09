'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, FolderOpen, MessageSquare, UsersRound, LogOut } from 'lucide-react';
import { logoutEverywhere } from '@/lib/auth-actions';
import { useUnreadCounts } from '@/lib/use-unread-counts';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/pledge', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pledge/committees', label: 'Committees', icon: UsersRound },
  { href: '/pledge/files', label: 'Files & Photos', icon: FolderOpen },
  { href: '/pledge/messages', label: 'Messages', icon: MessageSquare },
];

export default function PledgeLayout({ children }) {
  const pathname = usePathname();
  const { total: unreadTotal } = useUnreadCounts();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <aside className="w-60 shrink-0 bg-white/80 backdrop-blur-md border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 bg-gradient-to-r from-blue-950/5 to-transparent">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/KTP PHI CHAPTER.svg" alt="KTP" width={36} height={36} className="h-8 w-auto" />
            <span className="font-semibold text-blue-900 text-sm">Pledge Portal</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const showBadge = href.endsWith('/messages') && unreadTotal > 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="relative shrink-0">
                  <Icon className="w-4 h-4" />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold leading-none text-white">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200">
          <button
            onClick={() => logoutEverywhere()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
