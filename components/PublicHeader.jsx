'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Menu, X } from 'lucide-react';

export const PUBLIC_NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/rush', label: 'Rush' },
  { href: '/about', label: 'About' },
  { href: '/members-list', label: 'Members' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/hackathon', label: 'Hackathon' },
];

export default function PublicHeader({ tone = 'light' }) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const dark = tone === 'dark';
  const linkClass = dark
    ? 'text-gray-100 hover:text-cyan-300'
    : 'text-slate-700 hover:text-indigo-600';

  return (
    <>
      <header className={`sticky top-0 z-50 flex h-16 items-center border-b px-4 shadow-sm backdrop-blur-md lg:px-6 ${dark ? 'border-indigo-900 bg-black/75' : 'border-slate-200 bg-white/90'}`}>
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/KTP PHI CHAPTER.svg"
            alt="KTP Phi Chapter"
            width={100}
            height={40}
            className="h-8 w-auto"
            style={dark ? { filter: 'brightness(0) invert(1)' } : undefined}
          />
        </Link>

        <nav className="ml-auto hidden gap-4 lg:flex lg:gap-6" aria-label="Main navigation">
          {PUBLIC_NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={`text-sm font-medium transition-colors ${linkClass}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href={session ? '/auth/redirect' : '/login'}
          className="ml-auto rounded-md border border-blue-900 bg-blue-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:border-blue-800 hover:bg-blue-800 lg:ml-6"
        >
          <span className="sm:hidden">Portal</span>
          <span className="hidden sm:inline">{session ? 'My Portal' : 'Portal Login'}</span>
        </Link>

        <button
          type="button"
          className={`ml-3 rounded-md p-2 transition-colors lg:hidden ${dark ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="public-site-menu"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {menuOpen && (
        <nav
          id="public-site-menu"
          className={`sticky top-16 z-40 flex flex-col border-b px-4 py-2 shadow-sm backdrop-blur-md lg:hidden ${dark ? 'border-indigo-900 bg-black/95' : 'border-slate-200 bg-white/95'}`}
          aria-label="Main navigation"
        >
          {PUBLIC_NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`rounded-md px-2 py-2.5 text-sm font-medium transition-colors ${dark ? 'text-gray-100 hover:bg-white/10 hover:text-cyan-300' : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
