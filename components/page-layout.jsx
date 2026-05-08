"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "./ui/footer";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/rush", label: "Rush" },
  { href: "/#about", label: "About", hideOnMobile: true },
  { href: "/members-list", label: "Members" },
  { href: "/ktp-life", label: "KTP Life" },
  // { href: "/hackathon", label: "Hackathon" },
];

export default function PageLayout({ children }) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 599);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col scroll-smooth font-sans bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <header
        className={`sticky top-0 z-50 flex h-16 items-center border-b px-4 backdrop-blur-md lg:px-6 transition-all duration-300 ${
          scrolled
            ? "bg-white border-slate-200 shadow-sm"
            : "bg-slate-50/0 border-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/KTP PHI CHAPTER.svg"
            alt="ΚΘΠ"
            width={48}
            height={48}
            className="h-10 w-auto object-contain"
          />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {NAV_LINKS.filter((l) => !(mobile && l.hideOnMobile)).map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="relative text-sm font-medium transition-colors duration-300 before:absolute before:-bottom-0.5 before:left-0 before:h-0.5 before:w-full before:origin-left before:scale-x-0 before:bg-indigo-500 before:transition-transform before:duration-300 hover:text-indigo-600 hover:before:scale-x-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {/* hide until we have a login page ready 
        <Link
          href='/login'
          className='ml-6 text-sm font-medium px-3 py-1.5 rounded-md bg-blue-900 text-white border border-blue-900 transition-colors duration-300 hover:bg-blue-800 hover:border-blue-800'
        >
          Portal Login
        </Link>
        */}
      </header>

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
