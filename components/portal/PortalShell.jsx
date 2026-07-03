'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LogOut, PanelLeft, PanelLeftClose } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { PortalThemeProvider } from './PortalThemeProvider';
import ThemeToggle from './ThemeToggle';

const STORAGE_KEY = 'ktp-portal-sidebar';

const ACCENTS = {
  blue: {
    title: 'text-blue-900 dark:text-blue-100',
    header: 'from-blue-950/5',
    active: 'bg-blue-50 text-blue-900 dark:bg-[#22252b] dark:text-blue-100',
  },
  amber: {
    title: 'text-amber-900 dark:text-amber-100',
    header: 'from-amber-900/5',
    active: 'bg-amber-50 text-amber-900 dark:bg-[#22252b] dark:text-amber-100',
  },
  red: {
    title: 'text-red-900 dark:text-red-100',
    header: 'from-red-900/5',
    active: 'bg-red-50 text-red-900 dark:bg-[#22252b] dark:text-red-100',
  },
};

const iconBtnClass =
  'flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#22252b] dark:hover:text-white';

export default function PortalShell({
  portalName,
  accent = 'blue',
  nav,
  children,
  responsive = true,
}) {
  const pathname = usePathname();
  const styles = ACCENTS[accent] ?? ACCENTS.blue;
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'collapsed') setCollapsed(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'expanded');
  }, [collapsed, mounted]);

  const sidebarWidth = collapsed ? 'w-16' : 'w-60';
  const desktopSidebarWidth = collapsed ? 'md:w-16' : 'md:w-60';

  const navLinkClass = (active) =>
    `flex shrink-0 items-center rounded-lg text-sm font-medium transition-colors ${
      collapsed ? 'justify-center p-2 md:justify-center' : 'w-full gap-2 px-3 py-2 md:gap-3'
    } ${
      active
        ? styles.active
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#22252b] dark:hover:text-white'
    }`;

  const shell = (
    <div
      className={`flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:bg-none dark:bg-background ${
        responsive ? 'flex-col md:flex-row' : 'flex-row'
      }`}
    >
      <aside
        className={`flex shrink-0 flex-col border-slate-200 bg-white/95 backdrop-blur-md dark:border-border dark:bg-card dark:backdrop-blur-none ${
          responsive
            ? `sticky top-0 z-30 w-full border-b md:static md:min-h-screen md:border-b-0 md:border-r md:bg-white/80 dark:md:bg-card ${desktopSidebarWidth}`
            : `min-h-screen border-r ${sidebarWidth}`
        }`}
      >
        <div
          className={`flex border-b border-slate-200 bg-gradient-to-r ${styles.header} to-transparent dark:border-border dark:bg-none dark:bg-card ${
            collapsed
              ? 'h-14 flex-col items-center justify-center gap-1 px-2 md:h-auto md:py-3'
              : 'h-14 flex-row items-center justify-between gap-3 px-4 md:h-16 md:px-5'
          }`}
        >
          <Link
            href="/"
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}
            title={collapsed ? portalName : undefined}
          >
            <Image src="/KTP PHI CHAPTER.svg" alt="KTP" width={36} height={36} className="h-8 w-auto" />
            {!collapsed && <span className={`font-semibold text-sm ${styles.title}`}>{portalName}</span>}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((open) => !open)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`${iconBtnClass} ${responsive ? 'hidden md:flex' : 'flex'}`}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>

          {responsive && (
            <div className="flex items-center gap-1 md:hidden">
              <ThemeToggle iconOnly />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                aria-label="Sign out"
                className={iconBtnClass}
              >
                <LogOut className="h-4 w-4 shrink-0" />
              </button>
            </div>
          )}
        </div>

        <nav
          className={
            responsive
              ? `flex flex-1 gap-1 overflow-x-auto px-2 py-2 md:flex-col md:space-y-1 md:overflow-visible md:py-4 ${collapsed ? 'md:px-2' : 'md:px-3'}`
              : `flex flex-1 flex-col space-y-1 py-4 ${collapsed ? 'px-2' : 'px-3'}`
          }
        >
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={navLinkClass(active)}
                title={collapsed ? label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {responsive ? (
                  <span className={collapsed ? 'md:hidden' : ''}>{label}</span>
                ) : (
                  !collapsed && label
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className={`border-t border-slate-200 dark:border-border ${
            collapsed ? 'px-2 py-3' : 'px-3 py-4'
          } ${responsive ? 'hidden md:block' : ''}`}
        >
          <ThemeToggle
            iconOnly={collapsed}
            className={`mb-2 ${collapsed ? 'w-full justify-center px-2' : 'w-full justify-start'}`}
          />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            aria-label="Sign out"
            className={`${iconBtnClass} w-full ${collapsed ? 'justify-center' : 'justify-start gap-3 px-3 py-2'}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );

  return <PortalThemeProvider>{shell}</PortalThemeProvider>;
}
