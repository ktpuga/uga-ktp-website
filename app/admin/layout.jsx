'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { BarChart2, Megaphone, Users, LogOut } from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Analytics', icon: BarChart2 },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/users', label: 'User Management', icon: Users },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/KTP_LOGO.png" alt="KTP" width={36} height={36} className="h-8 w-auto" />
            <span className="font-semibold text-blue-900 text-sm">Admin Portal</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
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
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-200">
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
