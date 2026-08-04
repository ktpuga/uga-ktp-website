'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  LogOut, PanelLeft, PanelLeftClose, Menu, X, Sun, Moon, ChevronLeft, ChevronRight, Home, Palette,
} from 'lucide-react';
import { logoutEverywhere } from '@/lib/auth-actions';
import { getProfile } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useUnreadCounts } from '@/lib/use-unread-counts';
import { cn } from '@/lib/utils';
import { memberDisplayName, memberInitials, formatMemberGroup } from '@/lib/portal-format';
import { PortalThemeProvider, usePortalTheme } from './PortalThemeProvider';
import { PortalAccentProvider } from './PortalAccentContext';
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
  // teal and violet are the Pledge and Rush portals, rendering the SAME blue as
  // Member. They only still exist as separate keys for backwards compatibility;
  // now that nav and homeHref are props, either could simply pass 'blue'.
  teal: {
    title: 'text-blue-900 dark:text-blue-100',
    header: 'from-blue-950/5',
    active: 'bg-blue-50 text-blue-900 dark:bg-[#22252b] dark:text-blue-100',
  },
  violet: {
    title: 'text-blue-900 dark:text-blue-100',
    header: 'from-blue-950/5',
    active: 'bg-blue-50 text-blue-900 dark:bg-[#22252b] dark:text-blue-100',
  },
};

// Any accent with an entry here renders the revamped sidebar. It no longer has
// to match a nav lookup — nav structure comes from the layout via props.
const REVAMPED_ACCENTS = {
  blue: {
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
    light: '#1d4ed8',
    muted: 'rgba(30,58,138,0.10)',
  },
  red: {
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
    light: '#991b1b',
    muted: 'rgba(127,29,29,0.10)',
  },
  amber: {
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    light: '#d97706',
    muted: 'rgba(180,83,9,0.10)',
  },
  // Pledge and Rush share Member's blue. Only Alumni keeps its own colour, and
  // Admin can be switched between red and blue per user (see ADMIN_ACCENT_KEY).
  teal: {
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
    light: '#1d4ed8',
    muted: 'rgba(30,58,138,0.10)',
  },
  violet: {
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
    light: '#1d4ed8',
    muted: 'rgba(30,58,138,0.10)',
  },
};

// Admin is the one portal whose colour is a preference rather than a fixed
// identity. Stored per browser alongside the sidebar-collapse and dark-mode
// settings — a cosmetic choice isn't worth a round trip or a users column.
const ADMIN_ACCENT_KEY = 'ktp-admin-accent';

// Nav grouping and the portal's home href both used to be looked up HERE, keyed
// by `accent`. That made `accent` do three jobs at once — palette, nav
// structure, and portal root path — so it could never be changed, and a portal
// whose accent had no NAV_GROUPING entry rendered an EMPTY sidebar rather than
// failing. Both now come from the layout that owns them, via the `nav` and
// `homeHref` props, so there is nothing left to keep in sync across files.
//
// `nav` shape: [{ heading, items: [{ href, label, icon }] }]

// "rush" last, matching ktp-api's constants/roleGroups.js — someone accepted
// out of rush keeps that group until it's removed, so a higher-privilege group
// has to win. Without rush listed at all, a rushee resolved to undefined and
// formatMemberGroup's fallback labelled them "Member" in the sidebar, which is
// exactly what they are not.
const GROUP_PRIORITY = ['eboard', 'chair', 'active', 'alumni', 'pledge', 'rush'];

const iconBtnClass =
  'flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#22252b] dark:hover:text-white';

// #rrggbb -> rgba(r,g,b,alpha), for building glows/tints from a single hex.
function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function hoverOn(accentColor) {
  return (e) => {
    e.currentTarget.style.background = `linear-gradient(90deg, ${tint(accentColor, 0.14)} 0%, transparent 88%)`;
  };
}
function hoverOff(e) {
  e.currentTarget.style.background = '';
}

// Small standalone component so it can read the theme context — PortalShell
// itself instantiates PortalThemeProvider below, so it can't consume that
// context in its own body (same reason the plain ThemeToggle is its own
// component too).
function RevampedThemeButton({ accentColor, accentMuted, collapsed }) {
  const { theme, toggleTheme } = usePortalTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'group flex w-full items-center rounded-lg py-[7px] text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground',
        collapsed ? 'justify-center px-0' : 'gap-3 pl-3 pr-2.5 text-left',
      )}
      onMouseEnter={hoverOn(accentColor)}
      onMouseLeave={hoverOff}
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-200 group-hover:-translate-y-px group-hover:scale-110"
        style={{ background: accentMuted }}
      >
        {isDark ? <Sun className="h-[15px] w-[15px]" strokeWidth={1.85} /> : <Moon className="h-[15px] w-[15px]" strokeWidth={1.85} />}
      </span>
      <span className={cn('overflow-hidden whitespace-nowrap transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
        {isDark ? 'Light mode' : 'Dark mode'}
      </span>
    </button>
  );
}

function SidebarAvatar({ authentikId, initials, gradient, glow }) {
  const [err, setErr] = useState(false);
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold text-white"
      style={{ background: gradient, boxShadow: `0 2px 10px -3px ${glow}` }}
    >
      {authentikId && !err ? (
        <img
          src={`/api/users/${authentikId}/profile-picture/media`}
          alt=""
          width={32}
          height={32}
          className="h-full w-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}

function RevampedNavItem({ href, label, Icon, active, badge, collapsed, accentColor, accentMuted, accentGradient }) {
  return (
    <li className="relative">
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 z-10 h-[60%] w-[3px] -translate-y-1/2 rounded-full"
          style={{ background: accentColor, boxShadow: `0 0 9px ${tint(accentColor, 0.85)}` }}
        />
      )}
      <Link
        href={href}
        className={cn(
          'group relative flex items-center rounded-lg py-[7px] text-sm font-medium transition-all duration-200 ease-out',
          collapsed ? 'justify-center px-0' : 'gap-3 pl-3 pr-2.5',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
        style={active ? {
          background: `linear-gradient(90deg, ${tint(accentColor, 0.18)} 0%, ${tint(accentColor, 0.06)} 62%, transparent 100%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 0 20px -8px ${tint(accentColor, 0.9)}`,
        } : undefined}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? label : undefined}
        onMouseEnter={active ? undefined : hoverOn(accentColor)}
        onMouseLeave={active ? undefined : hoverOff}
      >
        <span
          aria-hidden="true"
          className={cn(
            'relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-200',
            !active && 'group-hover:-translate-y-px group-hover:scale-110',
          )}
          style={active ? { background: accentGradient, boxShadow: `0 2px 8px -2px ${tint(accentColor, 0.8)}` } : { background: accentMuted }}
        >
          <Icon className="h-[15px] w-[15px]" strokeWidth={active ? 2.25 : 1.85} style={active ? { color: '#fff' } : undefined} />
          {collapsed && badge > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-card" style={{ background: accentColor }} />
          )}
        </span>
        {/* Wraps rather than clips when expanded. With whitespace-nowrap a
            label wider than the sidebar was silently cut off mid-word, which
            capped labels at about 18 characters — "Announcements & Events"
            didn't fit. Collapsed keeps nowrap so the width animation is
            unchanged. */}
        <span
          className={cn(
            'overflow-hidden transition-all duration-300',
            collapsed
              ? 'w-0 whitespace-nowrap opacity-0'
              : 'w-auto whitespace-normal leading-tight opacity-100',
          )}
        >
          {label}
        </span>
        {!collapsed && badge > 0 && (
          <span className="ml-auto rounded-full px-[7px] py-[1px] text-[10px] font-semibold tabular-nums text-white" style={{ background: accentColor }}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    </li>
  );
}

export default function PortalShell({
  portalName,
  accent = 'blue',
  nav,
  // Where the sidebar logo links. Was PORTAL_ROOT[accent]; now the layout says
  // so outright, which is the only place that actually knows.
  homeHref,
  children,
  responsive = true,
}) {
  const pathname = usePathname();

  // `nav` is grouped. The mobile drawers render one flat list, so they read
  // this instead of each re-flattening it.
  const flatNav = (nav ?? []).flatMap((group) => group.items ?? []);

  // Admin only: 'red' (default) or 'blue'. Read after mount rather than during
  // render — localStorage doesn't exist on the server, and reading it in the
  // initial render would make the server and client HTML disagree.
  const [adminAccent, setAdminAccent] = useState('red');
  const isAdminPortal = accent === 'red';
  // The colour key, which is NOT the same as `accent`: the admin toggle swaps
  // the palette while `accent` stays 'red', so `isAdminPortal` keeps working.
  const colorKey = isAdminPortal ? adminAccent : accent;

  const styles = ACCENTS[colorKey] ?? ACCENTS.blue;
  const revamped = REVAMPED_ACCENTS[colorKey] ?? null;
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { total: unreadTotal } = useUnreadCounts();
  const { data: session } = useSession();

  // The session carries authentik_id, groups and profile_complete — and no name
  // at all. Authentik's invitation flow only ever collects a username, so first
  // / last / preferred name live in ktp-api's Postgres. Without this fetch
  // memberDisplayName() fell through to its 'Member' fallback, which is also
  // exactly what formatMemberGroup('active') returns — so the sidebar showed
  // the same word twice and looked like it was printing the group as the name.
  //
  // GET /users/me is gated on requireAuth only (no group check), so this works
  // in all five portals including /rushee.
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'collapsed') setCollapsed(true);

    const storedAccent = window.localStorage.getItem(ADMIN_ACCENT_KEY);
    if (storedAccent === 'blue' || storedAccent === 'red') setAdminAccent(storedAccent);

    setMounted(true);
  }, []);

  function toggleAdminAccent() {
    setAdminAccent((prev) => {
      const next = prev === 'red' ? 'blue' : 'red';
      window.localStorage.setItem(ADMIN_ACCENT_KEY, next);
      return next;
    });
  }

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'expanded');
  }, [collapsed, mounted]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // ---------- Revamped path (blue / red only) ----------
  if (revamped) {
    const user = session?.user ?? {};
    // DB profile first, session second — the session fields are almost always
    // blank, but keep them as a fallback so the block still renders something
    // during the moment before the fetch resolves.
    const nameParts = {
      preferredName: profile?.preferred_name ?? user.preferredName ?? user.preferred_name,
      firstName: profile?.first_name ?? user.firstName ?? user.first_name,
      lastName: profile?.last_name ?? user.lastName ?? user.last_name,
      username: profile?.username ?? user.username,
    };
    const displayName = memberDisplayName(nameParts);
    const initials = memberInitials(nameParts);
    const resolvedGroup = GROUP_PRIORITY.find((g) => user.groups?.includes(g));
    const profileRole = accent === 'red' ? 'Chapter Administrator' : formatMemberGroup(resolvedGroup);

    // The layout already owns the grouping, so this is now just a guard against
    // an empty section rather than an href-by-href reconciliation of two lists.
    const groups = nav.filter((group) => group.items?.length > 0);

    return (
      <PortalThemeProvider>
       <PortalAccentProvider accent={colorKey}>
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
          <aside
            className={cn(
              'relative hidden h-full shrink-0 flex-col border-r border-border bg-card transition-all duration-300 ease-in-out md:flex',
              // 252 rather than 236 so "Announcements & Events" sits on one
              // line. Labels wrap if they still don't fit, so this is about
              // looking right, not about text being readable at all.
              collapsed ? 'md:w-[68px]' : 'md:w-[252px]',
            )}
            aria-label="Portal navigation"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: `linear-gradient(180deg, ${tint(revamped.light, 0.07)} 0%, transparent 26%, transparent 74%, ${tint(revamped.light, 0.06)} 100%)`,
              }}
            />

            <div className={cn('relative flex h-[70px] shrink-0 items-center', collapsed ? 'justify-center px-0' : 'px-4')}>
              <Link href={homeHref} className="flex shrink-0 items-center" title={collapsed ? portalName : undefined}>
                <Image src="/KTP PHI CHAPTER.svg" alt="KTP" width={36} height={36} className="h-8 w-auto" />
              </Link>
              <div className={cn('ml-3 overflow-hidden transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-40 opacity-100')}>
                <p className="whitespace-nowrap text-[13px] font-semibold leading-tight tracking-tight text-foreground">Kappa Theta Pi</p>
                <p className="whitespace-nowrap text-[10.5px] font-medium uppercase leading-tight tracking-[0.14em]" style={{ color: revamped.light }}>
                  {portalName}
                </p>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="relative mx-3 h-px shrink-0"
              style={{ background: `linear-gradient(90deg, ${tint(revamped.light, 0.55)}, transparent)` }}
            />

            <nav className="sidebar-scroll relative flex-1 overflow-y-auto overflow-x-hidden py-3" aria-label="Main navigation">
              {groups.map((group) => (
                <div key={group.heading} className="mb-3 last:mb-0">
                  {collapsed ? (
                    <div aria-hidden="true" className="mx-auto mb-2 h-px w-6 bg-border" />
                  ) : (
                    <p className="mb-1.5 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">{group.heading}</p>
                  )}
                  <ul className="flex flex-col gap-0.5 px-2">
                    {group.items.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href;
                      const badge = href.endsWith('/messages') ? unreadTotal : 0;
                      return (
                        <RevampedNavItem
                          key={href}
                          href={href}
                          label={label}
                          Icon={Icon}
                          active={active}
                          badge={badge}
                          collapsed={collapsed}
                          accentColor={revamped.light}
                          accentMuted={revamped.muted}
                          accentGradient={revamped.gradient}
                        />
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="relative shrink-0 border-t border-border p-2">
              <div className={cn('mb-1.5 flex items-center transition-all duration-300', collapsed ? 'justify-center' : 'gap-2.5 rounded-lg border border-border/70 bg-background/50 p-2.5')}>
                <SidebarAvatar
                  authentikId={user.authentik_id}
                  initials={initials}
                  gradient={revamped.gradient}
                  glow={tint(revamped.light, 0.8)}
                />
                <div className={cn('min-w-0 overflow-hidden transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
                  <p className="truncate text-[12px] font-bold leading-tight text-foreground dark:text-white">{displayName}</p>
                  <p className="truncate text-[10.5px] leading-tight text-muted-foreground">{profileRole}</p>
                </div>
              </div>

              <Link
                href="/"
                className={cn(
                  'group flex w-full items-center rounded-lg py-[7px] text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground',
                  collapsed ? 'justify-center px-0' : 'gap-3 pl-3 pr-2.5 text-left',
                )}
                aria-label="Back to homepage"
                title={collapsed ? 'Back to homepage' : undefined}
                onMouseEnter={hoverOn(revamped.light)}
                onMouseLeave={hoverOff}
              >
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-200 group-hover:-translate-y-px group-hover:scale-110" style={{ background: revamped.muted }}>
                  <Home className="h-[15px] w-[15px]" strokeWidth={1.85} />
                </span>
                <span className={cn('overflow-hidden whitespace-nowrap transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>Back to Homepage</span>
              </Link>

              <RevampedThemeButton accentColor={revamped.light} accentMuted={revamped.muted} collapsed={collapsed} />

              {/* Admin only — every other portal's colour is fixed identity. */}
              {isAdminPortal && (
                <button
                  type="button"
                  onClick={toggleAdminAccent}
                  aria-label={adminAccent === 'red' ? 'Switch admin portal to blue' : 'Switch admin portal to red'}
                  className={cn(
                    'group flex w-full items-center rounded-lg py-[7px] text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground',
                    collapsed ? 'justify-center px-0' : 'gap-3 pl-3 pr-2.5 text-left',
                  )}
                  onMouseEnter={hoverOn(revamped.light)}
                  onMouseLeave={hoverOff}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-200 group-hover:-translate-y-px group-hover:scale-110"
                    style={{ background: revamped.muted }}
                  >
                    <Palette className="h-[15px] w-[15px]" strokeWidth={1.85} />
                  </span>
                  <span className={cn('overflow-hidden whitespace-nowrap transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
                    {adminAccent === 'red' ? 'Use blue' : 'Use red'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => logoutEverywhere()}
                className={cn(
                  'group flex w-full items-center rounded-lg py-[7px] text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground',
                  collapsed ? 'justify-center px-0' : 'gap-3 pl-3 pr-2.5 text-left',
                )}
                aria-label="Sign out"
                title={collapsed ? 'Sign out' : undefined}
                onMouseEnter={hoverOn(revamped.light)}
                onMouseLeave={hoverOff}
              >
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-200 group-hover:-translate-y-px group-hover:scale-110" style={{ background: revamped.muted }}>
                  <LogOut className="h-[15px] w-[15px]" strokeWidth={1.85} />
                </span>
                <span className={cn('overflow-hidden whitespace-nowrap transition-all duration-300', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>Sign out</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="absolute -right-3 top-[23px] z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-200 hover:text-foreground"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </button>
          </aside>

          {/* Mobile header + dropdown — same interaction as the plain variant, simplified styling */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className={cn('sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4 md:hidden')}>
              <Link href={homeHref} className="flex items-center gap-2">
                <Image src="/KTP PHI CHAPTER.svg" alt="KTP" width={28} height={28} className="h-7 w-auto" />
                <span className="text-sm font-semibold text-foreground">{portalName}</span>
              </Link>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setMobileNavOpen((open) => !open)} aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileNavOpen} className={iconBtnClass}>
                  {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
                <Link href="/" aria-label="Back to homepage" className={iconBtnClass}>
                  <Home className="h-4 w-4" />
                </Link>
                <ThemeToggle iconOnly />
                <button type="button" onClick={() => logoutEverywhere()} aria-label="Sign out" className={iconBtnClass}>
                  <LogOut className="h-4 w-4 shrink-0" />
                </button>
              </div>
            </div>

            {mobileNavOpen && (
              <nav className="flex flex-col gap-1 border-b border-border bg-card px-2 py-2 md:hidden">
                {flatNav.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  const showBadge = href.endsWith('/messages') && unreadTotal > 0;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                      style={active ? { background: tint(revamped.light, 0.12) } : undefined}
                    >
                      <span className="relative shrink-0">
                        <Icon className="h-4 w-4" />
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
            )}

            <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
          </div>
        </div>
       </PortalAccentProvider>
      </PortalThemeProvider>
    );
  }

  // ---------- Plain path (amber / anything else, unchanged) ----------
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
              <button
                type="button"
                onClick={() => setMobileNavOpen((open) => !open)}
                aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileNavOpen}
                className={iconBtnClass}
              >
                {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <ThemeToggle iconOnly />
              <button
                type="button"
                onClick={() => logoutEverywhere()}
                aria-label="Sign out"
                className={iconBtnClass}
              >
                <LogOut className="h-4 w-4 shrink-0" />
              </button>
            </div>
          )}
        </div>

        {responsive && mobileNavOpen && (
          <nav className="flex flex-col gap-1 border-b border-slate-200 bg-white px-2 py-2 md:hidden dark:border-border dark:bg-card">
            {flatNav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              const showBadge = href.endsWith('/messages') && unreadTotal > 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? styles.active
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#22252b] dark:hover:text-white'
                  }`}
                >
                  <span className="relative shrink-0">
                    <Icon className="h-4 w-4" />
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
        )}

        <nav
          className={
            responsive
              ? `hidden flex-1 md:flex md:flex-col md:space-y-1 md:py-4 ${collapsed ? 'md:px-2' : 'md:px-3'}`
              : `flex flex-1 flex-col space-y-1 py-4 ${collapsed ? 'px-2' : 'px-3'}`
          }
        >
          {flatNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const showBadge = href.endsWith('/messages') && unreadTotal > 0;
            return (
              <Link
                key={href}
                href={href}
                className={navLinkClass(active)}
                title={collapsed ? label : undefined}
              >
                <span className="relative shrink-0">
                  <Icon className="h-4 w-4" />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold leading-none text-white">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                  )}
                </span>
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
            onClick={() => logoutEverywhere()}
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

  return (
    <PortalThemeProvider>
      <PortalAccentProvider accent={colorKey}>{shell}</PortalAccentProvider>
    </PortalThemeProvider>
  );
}
