"use client";
import { Button } from "@/components/ui/button";
// Used only by the commented-out static executive board section below.
// import Card from "@/components/ui/card";
import { Link2, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import Footer from "../components/ui/footer";
import { PUBLIC_NAV_LINKS } from "./PublicHeader";
import dnTTb from "../public/datenight_x_TT_beta.jpeg";
import main from "../public/glitchKTP.gif";
import mtdspa from "../public/mytie_x_dsp_alpha.jpeg";
import mtdspexec from "../public/mytie_x_dsp_exec.jpeg";
import pcAlpha from "../public/PCalpha.jpg";
import retreat1 from "../public/retreat_1_whiteshirts.jpeg";
import tg from "../public/tailgate.jpeg";
// Homepage alumni cards are intentionally disabled: /members-list renders the
// current API-backed alumni roster.
// import AlumniSection from "./AlumniSection";
import GallerySection from "./GallerySection";
import SpotlightGallery from "./SpotlightGallery";
import { AOSInit } from "./ui/timeline";

// NEW: Hackathon photos (same set used on /hackathon)
import ktpHacks1 from "@/public/ktpHacks1.jpeg";
import ktpHacks2 from "@/public/ktpHacks2.jpeg";
import ktpHacks4 from "@/public/ktphacks2_1.jpeg";
import ktpHacks13 from "@/public/ktphacks2_10.jpeg";
import ktpHacks5 from "@/public/ktphacks2_2.jpeg";
import ktpHacks6 from "@/public/ktphacks2_3.jpeg";
import ktpHacks7 from "@/public/ktphacks2_4.jpeg";
import ktpHacks8 from "@/public/ktphacks2_5.jpeg";
import ktpHacks9 from "@/public/ktphacks2_6.jpeg";
import ktpHacks10 from "@/public/ktphacks2_7.jpeg";
import ktpHacks11 from "@/public/ktphacks2_8.jpeg";
import ktpHacks12 from "@/public/ktphacks2_9.jpeg";
import ktpHacks3 from "@/public/ktpHacks3.jpeg";

/* -------------------------------------------------------------------------- */
/*                             UTILITY: IMPORT ALL                            */
/* -------------------------------------------------------------------------- */
function importAll(r) {
  const images = {};
  r.keys().forEach((item) => {
    images[item.replace("./", "")] = r(item);
  });
  return images;
}

export default function TemplatePage({ spotlightLinks = [] }) {
  const { data: session } = useSession();

  /* ---------------------- Collect leadership head‑shots ---------------------
     KEPT, COMMENTED OUT with the Exec Board section further down, which was
     the only thing that read it. Restore both together.

     Commenting this out also drops every file under public/leadership/ from
     the bundle, since require.context is what pulled them in.

  const images = importAll(
    require.context("../public/leadership/", false, /\.(png|jpe?g|svg)$/),
  );
  ------------------------------------------------------------------------- */

  /* ------------------- Original hero collage layout ----------------- */
  const rotation = [
    "rotate-[3deg]",
    "-rotate-[2deg]",
    "rotate-[1deg]",
    "-rotate-[3deg]",
    "rotate-[2deg]",
    "-rotate-[1deg]",
  ];

  /* ------------------- Media for the hero collage ------------------ */
  const heroPics = [
    pcAlpha.src,
    dnTTb.src,
    mtdspa.src,
    mtdspexec.src,
    retreat1.src,
    tg.src,
  ].filter(Boolean);

  const heroPhotoPositions = [
    "left-[3%] top-[7%] z-10 w-[42%] -rotate-[8deg]",
    "right-[2%] top-[3%] z-20 w-[42%] rotate-[7deg]",
    "left-[28%] top-[28%] z-30 w-[45%] -rotate-[2deg]",
    "bottom-[2%] left-[1%] z-20 w-[37%] rotate-[6deg]",
    "bottom-[2%] right-[1%] z-10 w-[40%] -rotate-[7deg]",
    "bottom-[4%] right-[35%] z-40 w-[29%] rotate-[4deg]",
  ];

  /* ------------------- Hackathon images for highlights --------------
     KEPT, COMMENTED OUT. Superseded by the eboard-managed gallery
     collections that <GallerySection /> renders below — "Hackathon
     Highlights" is now a collection eboard can edit without a deploy,
     instead of this array plus the hardcoded section further down.

     Commented rather than deleted at Yash's request, so the original is
     here if the data-driven version needs to be backed out. The array and
     the JSX section go together: uncommenting one without the other is
     either an unused variable or an undefined one.

     Note if you do restore it: the image imports at the top of this file
     (ktpHacks1…13) are still live, because /hackathon uses them too.

  const hackPics = [
    ktpHacks1,
    ktpHacks2,
    ktpHacks3,
    ktpHacks4,
    ktpHacks5,
    ktpHacks6,
    ktpHacks7,
    ktpHacks8,
    ktpHacks9,
    ktpHacks10,
    ktpHacks11,
    ktpHacks12,
    ktpHacks13,
  ];
  ------------------------------------------------------------------- */

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------------------------- Mobile nav menu ----------------------------
   * The header used to lay the logo, all six nav links and the Portal Login
   * button out in a single row at every width. At 390px that row measured
   * 446px, so the WHOLE PAGE scrolled sideways by 56px — the login button was
   * the element hanging off the right edge. Below `md` the links now collapse
   * into a dropdown, leaving a header that fits.
   * -------------------------------------------------------------------- */
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_LINKS = PUBLIC_NAV_LINKS.map((link) =>
    link.label === 'Contact' ? { ...link, href: '#contact' } : link
  );

  return (
    <div className="flex min-h-screen flex-col scroll-smooth font-sans bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <AOSInit />

      {/* ===============================  NAVBAR  ============================== */}
      <header
        className={`sticky top-0 z-50 flex h-16 items-center border-b border-[#0f2758] bg-[#14326E]/95 px-4 backdrop-blur-md transition-all duration-300 lg:px-6 ${scrolled ? "shadow-md" : "shadow-sm"}`}
      >
        <Link href="#" className="flex items-center gap-2">
          <Image
            src="/KTP PHI CHAPTER.svg"
            alt="KTP Phi Chapter"
            width={100}
            height={40}
            className="h-8 w-auto"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </Link>
        {/* Inline links from md up; below that they live in the dropdown. */}
        <nav className="ml-auto hidden gap-4 md:flex md:gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="relative text-sm font-medium text-white transition-colors duration-300 before:absolute before:-bottom-0.5 before:left-0 before:h-0.5 before:w-full before:origin-left before:scale-x-0 before:bg-blue-200 before:transition-transform before:duration-300 hover:text-blue-200 hover:before:scale-x-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* ml-auto below md (where the nav is hidden and nothing else pushes
            this right), then the original ml-6 once the nav is present.
            shrink-0 so it can never be the thing that overflows again. */}
        <Link
          href={session ? "/auth/redirect" : "/login"}
          className="ml-auto shrink-0 whitespace-nowrap rounded-md border border-white bg-white px-3 py-1.5 text-sm font-medium text-[#14326E] transition-colors duration-300 hover:border-blue-100 hover:bg-blue-100 md:ml-6"
        >
          <span className="relative before:absolute before:-bottom-0.5 before:left-0 before:h-0.5 before:w-full before:origin-left before:scale-x-0 before:bg-[#14326E] before:transition-transform before:duration-300 [a:hover_&]:before:scale-x-100">
            {session ? "My Portal" : "Portal Login"}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="ml-2 shrink-0 rounded-md p-2 text-white transition-colors hover:bg-white/15 md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Dropdown panel. `sticky top-16` keeps it under the sticky header
          rather than scrolling away from it. */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          className="sticky top-16 z-40 flex flex-col border-b border-[#0f2758] bg-[#14326E]/95 px-4 py-2 shadow-sm backdrop-blur-md md:hidden"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-2 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 hover:text-blue-200"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}

      <main className="flex-1">
        {/* ===============================  HERO  ============================== */}
        {false && <>
        <section className="relative overflow-hidden py-20 md:py-28 flex items-center min-h-[70vh]">
          {/* Animated gradient blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -left-20 top-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-25 blur-[120px]" />
            <div className="absolute -bottom-24 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-20 blur-[110px]" />
          </div>

          <div className="container mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-4 md:grid-cols-2 md:px-6">
            {/* Hero Copy */}
            <div
              className="space-y-8"
              data-aos="fade-up"
              data-aos-duration="600"
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/60 px-3 py-1 text-xs font-semibold tracking-wider text-blue-900 shadow-sm">
                UGA's Professional Technology Fraternity
              </p>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight bg-gradient-to-tr text-blue-900 bg-clip-text drop-shadow-xl">
                Kappa Theta Pi
              </h1>
              <p className="max-w-prose text-lg md:text-xl text-slate-700">
                Empowering technologists through leadership, mentorship, and
                community. On a mission to build what matters.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/about">
                  <Button className="rounded-full bg-blue-900 px-8 py-4 text-lg font-semibold text-white shadow-md transition-colors hover:bg-blue-800">
                    About
                  </Button>
                </Link>
                <Link href="/members-list">
                  <Button
                    variant="outline"
                    className="rounded-full border-blue-900 bg-blue-900 px-8 py-4 text-lg text-white shadow-md hover:border-blue-800 hover:bg-blue-800 hover:text-white"
                  >
                    Members
                  </Button>
                </Link>
              </div>

              {/* Sponsor marquee */}
              {/* <div className="relative mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white/60">
                <div className="flex items-center gap-8 whitespace-nowrap animate-[marquee_22s_linear_infinite] p-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">Supported by:</span>
                  <span>GitHub</span>
                  <span>Red Bull</span>
                  <span>DoorDash</span>
                  <span>UGAHacks</span>
                  <span>GitHub / GitHub Education</span>
                  <span>Red Bull</span>
                  <span>DoorDash</span>
                </div>
              </div>
              <style jsx>{`
                @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
              `}</style> */}
            </div>

            {/* Decorative Image Collage */}
            <div
              className="flex items-center justify-center"
              data-aos="fade-up"
              data-aos-delay="150"
            >
              <div className="relative w-full max-w-md sm:max-w-lg">
                <div className="grid grid-cols-3 gap-4">
                  {heroPics.slice(0, 6).map((src, i) => (
                    <Image
                      key={i}
                      unoptimized
                      src={src}
                      alt={`KTP collage ${i + 1}`}
                      width={400}
                      height={300}
                      className={`h-36 w-full rounded-xl object-cover shadow-2xl transition-transform duration-500 hover:scale-110 ${rotation[i % rotation.length]}`}
                      style={{
                        transform: `translateY(${(i % 2 === 0 ? -1 : 1) * 10}px)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        </>}

        {/* ===== CURRENT REDESIGNED HERO ===== */}

        <section className="relative isolate flex min-h-[74vh] items-center overflow-hidden bg-[#14326E] py-20 text-white md:py-28">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 top-0 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-25 blur-[120px]" />
            <div className="absolute -bottom-24 right-0 h-[32rem] w-[32rem] rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-20 blur-[110px]" />
          </div>

          <div className="relative container mx-auto grid max-w-[112rem] grid-cols-1 items-center gap-14 px-4 md:grid-cols-[0.92fr_1.08fr] md:px-8 xl:gap-24">
            <div className="space-y-8" data-aos="fade-up" data-aos-duration="600">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-white shadow-sm backdrop-blur-sm">
                UGA's Professional Technology Fraternity
              </p>
              <h1 className="max-w-2xl whitespace-nowrap text-[clamp(2.25rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-tight text-white drop-shadow-xl">
                Kappa Theta Pi
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-blue-100 md:text-xl">
                Empowering technologists through leadership, mentorship, and community. On a mission to build what matters.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <SocialLink href="https://www.instagram.com/ugaktp/" label="Kappa Theta Pi on Instagram" text="Instagram"><InstagramIcon className="h-5 w-5" /></SocialLink>
                <SocialLink href="https://www.linkedin.com/company/kappa-theta-pi-uga/" label="Kappa Theta Pi on LinkedIn" text="LinkedIn"><LinkedinIcon className="h-5 w-5" /></SocialLink>
                <CopyEmailButton />
                <SocialLink href="https://linktr.ee/uga.ktp" label="Kappa Theta Pi on Linktree" text="Linktree"><Link2 className="h-5 w-5" /></SocialLink>
              </div>
              <dl className="grid max-w-xl grid-cols-3 gap-3 border-t border-white/25 pt-6 sm:gap-6">
                {[["Founded", "2024"], ["Based at", "UGA"], ["Built in", "Athens, GA"]].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-blue-200">{label}</dt>
                    <dd className="mt-1 text-sm font-bold text-white sm:text-base">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex items-center justify-center" data-aos="fade-up" data-aos-delay="150">
              <div className="relative aspect-[1.04/1] w-full max-w-3xl sm:aspect-[1.2/1]">
                <div aria-hidden className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-300/60 via-white/60 to-cyan-200/70 blur-2xl" />
                {heroPics.slice(0, 6).map((src, index) => (
                  <figure key={src} className={`group absolute overflow-hidden rounded-[1.35rem] border-[5px] border-white bg-slate-200 shadow-[0_18px_35px_-18px_rgba(30,58,138,0.55)] transition-transform duration-500 hover:z-50 hover:scale-105 ${heroPhotoPositions[index]}`}>
                    <div className="relative aspect-[4/3]">
                      <Image unoptimized src={src} alt={`KTP chapter moment ${index + 1}`} fill sizes="(max-width: 768px) 45vw, 24vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================== RUSH FILM ============================ */}
        <section className="relative z-10 -mt-8 overflow-hidden bg-[#111111] py-14 text-white md:-mt-12 md:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#6b1c2a]/30 blur-[100px]" />
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#d4af37]/15 blur-[110px]" />
          </div>

          <div className="relative container mx-auto grid max-w-[112rem] items-center gap-10 px-4 md:grid-cols-[0.8fr_1.2fr] md:gap-14 md:px-8">
            <div data-aos="fade-up" data-aos-duration="500">
              <p className="inline-flex items-center rounded-full border border-[#d4af37] bg-[#2a1219] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#d4af37]">
                Fall Rush 2026
              </p>
              <h2 className="mt-5 max-w-xl text-4xl font-extrabold tracking-tight sm:text-5xl">
                Ante up for Fall Rush.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#e8e0d5] md:text-lg">
                Meet the people, energy, and ambition behind Kappa Theta Pi at UGA.
              </p>
              <Link href="/rush" className="mt-7 inline-flex rounded-full border-2 border-[#f0d060] bg-[#d4af37] px-5 py-2.5 text-sm font-bold text-[#1a1a1a] transition-colors hover:bg-[#f0d060]">
                Explore Rush
              </Link>
            </div>

            <div className="relative" data-aos="fade-up" data-aos-delay="120" data-aos-duration="500">
              <div className="absolute -inset-3 rounded-[1.75rem] border border-[#6b1c2a]" aria-hidden="true" />
              <div className="relative aspect-video overflow-hidden rounded-[1.35rem] border-4 border-[#6b1c2a] bg-black shadow-2xl shadow-black/50">
                <video controls playsInline preload="metadata" className="h-full w-full bg-black object-contain">
                  <source src="/fall-rush-2026-promo.mp4" type="video/mp4" />
                  Your browser does not support this video.
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* ========================== MEMBER SPOTLIGHT ======================== */}
        <section className="relative overflow-hidden bg-[#14326E] py-16 text-white md:py-20">
          <div aria-hidden className="pointer-events-none absolute -right-28 top-0 h-80 w-80 rounded-full bg-blue-300/20 blur-[110px]" />
          <div className="relative mx-auto max-w-[100rem] px-4 sm:px-6">
            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Phi Chapter Spotlight</p>
                <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Our Members&apos; Work</h2>
                <p className="mt-4 max-w-2xl text-lg leading-7 text-blue-100">
                  Internships, projects, research, and milestones from members building beyond the classroom.
                </p>
              </div>
              <Link href="/spotlight" className="inline-flex w-fit rounded-full border border-white bg-white px-5 py-2.5 text-sm font-bold text-[#14326E] transition-colors hover:bg-blue-100">
                View All Spotlights
              </Link>
            </div>
            <SpotlightGallery links={spotlightLinks} />
          </div>
        </section>

        {/* =========================== CHAPTER GALLERY ========================= */}
        {/* Eboard-curated via /admin/homepage-media. Renders nothing at all
            when no photos are configured, so it can't leave an empty band. */}
        <GallerySection />

        {/* ===== HACKATHON HIGHLIGHTS — KEPT, COMMENTED OUT =====
            Replaced by an eboard-managed gallery collection, rendered by
            <GallerySection /> above. This is the original hardcoded version,
            kept at Yash's request so it can be put back if needed.

            To restore: uncomment this AND the hackPics array near the top of
            this file. One without the other does not compile.

            The JSX below sits inside a block comment, so the inline JSX
            comments it used to carry were stripped: a nested comment closer
            would end this one early and leave the rest as broken markup.

        <section className="relative py-12 md:py-16 bg-white/70">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                  Hackathon Highlights
                </h2>
                <p className="text-slate-600">
                  Second Edition • Fall 2025 • 8 projects • 12 hours
                </p>
              </div>
              <Link
                href="/hackathon"
                className="text-indigo-600 hover:underline font-medium"
              >
                See more →
              </Link>
            </div>

            <div className="group relative">
              <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
                {hackPics.map((img, i) => (
                  <figure
                    key={i}
                    className="relative h-56 w-[300px] shrink-0 snap-start overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100"
                  >
                    <Image
                      unoptimized
                      src={img}
                      alt={`KTP Hacks highlight ${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </figure>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="https://uga-ktp-hackathon-fall-25.devpost.com/"
                target="_blank"
              >
                <Button className="rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-cyan-500 px-6 py-3 text-white shadow-md hover:from-fuchsia-500 hover:to-indigo-600">
                  View 2025 Devpost
                </Button>
              </Link>
              <Link
                href="https://uga-ktp-hackathon-f24.devpost.com/"
                target="_blank"
                className="text-sm text-slate-600 hover:underline"
              >
                or view 2024
              </Link>
            </div>
          </div>
        </section>
        ===================================================== */}


        {/* ===============================  ABOUT  ============================= */}
        {false && <section id="about" className="bg-card py-16 md:py-24">
          <div
            className="container mx-auto max-w-6xl px-4 md:px-6"
            data-aos="fade-up"
            data-aos-duration="500"
          >
            <div className="grid gap-10 md:grid-cols-2 md:gap-16">
              <div className="relative flex items-center justify-center">
                <Image
                  unoptimized
                  src={main.src}
                  width={420}
                  height={420}
                  alt="About KTP"
                  className="rounded-2xl shadow-xl"
                />
                <span className="absolute -inset-2 -z-10 animate-pulse rounded-3xl bg-gradient-to-br from-blue-400 via-teal-400 to-green-300 opacity-10 blur-2xl" />
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-primary">
                  About KTP Phi Chapter
                </h2>
                <p className="text-lg text-foreground">
                  KTP develops technical skills and professionalism while
                  fostering strong friendships and an international network. Our
                  UGA chapter is committed to leaving a lasting legacy on campus
                  and beyond 🌎.
                </p>
                <p className="text-base text-foreground">
                  <Link
                    href="https://ktpmichigan.com"
                    target="_blank"
                    className="text-indigo-600 hover:underline"
                  >
                    The Alpha Chapter
                  </Link>
                  , founded on January 10, 2012 at the University of Michigan,
                  paved the way for our growing fraternity.
                </p>
              </div>
            </div>
          </div>
        </section>}

        {/* =========  VALUES  ========= */}
        {false && <section
          id="values"
          className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white/70 to-slate-100"
        >
          <span className="pointer-events-none absolute -right-1/3 -top-1/4 -z-10 h-[60vw] w-[60vw] rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 opacity-10 blur-3xl" />

          <div
            className="container mx-auto max-w-6xl px-4 md:px-6"
            data-aos="fade-up"
            data-aos-duration="500"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-primary">
                Our Values
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-foreground">
                The pillars that guide and shape every KTP member.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
              {[
                {
                  title: "Leadership",
                  desc: "We empower members to lead through committee roles and executive opportunities that make real impact.",
                },
                {
                  title: "Professionalism",
                  desc: "Interview prep, resume reviews, mentorship & more help our members thrive in tech careers.",
                },
                {
                  title: "Community",
                  desc: "The friendships built in KTP last well beyond college & span the globe through countless events.",
                },
              ].map((v, i) => (
                <div
                  key={v.title}
                  className={`group rounded-xl bg-white p-6 shadow-lg ring-1 ring-slate-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-indigo-200/50`}
                  data-aos="fade-up"
                  data-aos-delay={100 + i * 100}
                >
                  <h3 className="mb-2 text-xl font-bold text-primary group-hover:text-indigo-600">
                    {v.title}
                  </h3>
                  <p className="text-foreground">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>}

        {/* =========  EXEC BOARD  =========  KEPT, COMMENTED OUT

            Hidden at Yash's request. Commented rather than deleted so the
            card list and every bio survive for whoever puts it back.

            FOUR THINGS RESTORE TOGETHER:
              1. this section,
              2. the `images` const near the top of this file, which only
                 this section reads,
              3. the "Leadership" entry in NAV_LINKS, removed because a nav
                 item scrolling to a section that is not rendered does
                 nothing at all when clicked, and
              4. the "Leadership" nav entries on the two OTHER public pages
                 that link to /#leadership: app/hackathon/page.jsx and
                 app/code-of-conduct/page.jsx. Both are commented out in
                 place for the same reason as 3. This section owns the
                 anchor, so nothing outside this file can link to it while
                 the section is hidden.

            The JSX below had its own inline comments stripped: a nested
            comment closer would end this block early and leave the rest as
            broken markup.

        <section id="leadership" className="bg-card py-16 md:py-24">
          <div
            className="container mx-auto max-w-6xl px-4 md:px-6"
            data-aos="fade-up"
            data-aos-duration="600"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-primary">
                Meet the Exec Board
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-foreground">
                The leaders driving KTP forward.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-6 text-sm p-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              <Card name="Daniel Rifai" title="President" bio="Daniel Rifai is a third year Computer Science and Finance major. He enjoys the outdoors, sports, film, and card games." avatarSrc={images["danny.jpeg"].default.src} fallbackInitials="DR" instagramUrl="https://www.instagram.com/drifai2" linkedinUrl="https://www.linkedin.com/in/daniel-rifai-19226a292/" />
              <Card
                name="William Tomaszewski"
                title="VP of Membership"
                bio="Will is a sophomore Computer Science major at UGA."
                avatarSrc={images["will.jpg"].default.src}
                fallbackInitials="WT"
                instagramUrl="https://www.instagram.com/will_.tom/"
              />
              <Card
                name="Alli Gay"
                title="VP of Finance"
                bio="Alli is a Data Science major at UGA. She is also involved in UGA’s Club Cross Country/Track team and Delta Zeta Sorority. She loves to run, be outside, paint, and listen to music."
                avatarSrc={images["alli.jpeg"].default.src}
                fallbackInitials="AG"
                instagramUrl="https://www.instagram.com/allisonngayy/"
                linkedinUrl="https://www.linkedin.com/in/allison-gay-8956a7296/"
              />
              <Card
                name="Ajeetha Murugappan"
                title="VP of Marketing"
                bio="Ajeetha is a junior Computer Science major and Business minor. She enjoys golfing, going to concerts, and long walks!"
                avatarSrc={images["ajeetha.jpeg"].default.src}
                fallbackInitials="AM"
                instagramUrl="https://www.instagram.com/ajeetha.05/"
                linkedinUrl="https://www.linkedin.com/in/ajeetha-murugappan-43b6a01b5/"
              />
              <Card
                name="Yoshna Agarwal"
                title="VP of Internal Affairs"
                bio="2nd Year CS major @ University of Georgia"
                avatarSrc={images["yoshna.jpg"].default.src}
                fallbackInitials="YA"
                instagramUrl="https://www.instagram.com/yoshnaagarwal/"
                linkedinUrl="https://www.linkedin.com/in/yoshna-agarwal/"
              />
              <Card
                name="Jonah Criswell"
                title="VP of External Affairs"
                bio="CS & Business @ UGA | Incoming SWE Intern @ Wells Fargo | SWE @ UGA Small Satellite Research Lab"
                avatarSrc={images["jonah_cropped.jpeg"].default.src}
                fallbackInitials="JC"
                instagramUrl="https://www.instagram.com/jonah.criswell/"
                linkedinUrl="https://www.linkedin.com/in/jonah-criswell/"
              />
              <Card
                name="Manya Vikram"
                title="VP of Professional Dev"
                bio="Manya is a junior CS major."
                avatarSrc={images["manya.jpeg"].default.src}
                fallbackInitials="MV"
                instagramUrl="https://www.instagram.com/manya.vv/"
                linkedinUrl="https://www.linkedin.com/in/manya-vikram-bb0652220/"
              />
              <Card
                name="Adithya Lakshmikanth"
                title="VP of Technical Dev"
                bio="Junior at the University of Georgia pursuing degrees in Computer Science and Applied Mathematics, currently serving as a Technical Organizer for UGAHacks."
                avatarSrc={images["adithya.jpg"].default.src}
                fallbackInitials="AL"
                instagramUrl="https://www.instagram.com/ladithya27/"
                linkedinUrl="https://www.linkedin.com/in/ladithya/"
              />
            </div>
          </div>
        </section>
        ========================================================= */}


        {/* =========  ALUMNI  =========  KEPT, COMMENTED OUT

            The static alumni card grid is hidden because /members-list is the
            single source of truth for the API-backed chapter roster. Restore
            this component and its import together only if a separate static
            homepage alumni section is wanted again.

        <AlumniSection />
        ================================================ */}

        {/* =========  CONTACT  ========= */}
        <section id="contact" className="bg-[#14326E] py-16 text-white md:py-24">
          {/* fade-up, not flip-up. flip-up was the only one on the page and it
              applies `perspective(2500px) rotateX(-100deg)` in its
              pre-animation state — a perspective projection is WIDER than the
              element itself, so this 390px container measured 405px and pushed
              the whole page 8px sideways until you scrolled far enough to
              trigger the animation. Vertical fades don't distort width. */}
          <div
            className="container mx-auto max-w-4xl px-4 text-center md:px-6"
            data-aos="fade-up"
            data-aos-duration="300"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Contact
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-blue-100">
              Join us for Rush and become part of the KTPhamily.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <SocialLink href="https://www.instagram.com/ugaktp/" label="Kappa Theta Pi on Instagram" text="Instagram">
                <InstagramIcon className="h-5 w-5" />
              </SocialLink>
              <SocialLink href="https://www.linkedin.com/company/kappa-theta-pi-uga/" label="Kappa Theta Pi on LinkedIn" text="LinkedIn">
                <LinkedinIcon className="h-5 w-5" />
              </SocialLink>
              <CopyEmailButton />
              <SocialLink href="https://linktr.ee/uga.ktp" label="Kappa Theta Pi on Linktree" text="Linktree">
                <Link2 className="h-5 w-5" />
              </SocialLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

/* -----------------------------  Helpers  ----------------------------- */
function SocialLink({ href, children, label, text }) {
  return (
    <Link
      href={href}
      target="_blank"
      prefetch={false}
      aria-label={label}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white bg-white px-5 text-sm font-semibold text-[#14326E] shadow-md transition-transform duration-300 hover:-translate-y-1 hover:bg-blue-100"
    >
      {children}
      <span>{text}</span>
    </Link>
  );
}

function CopyEmailButton() {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText('uga.ktp@gmail.com');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be unavailable in a non-secure browser context.
      window.prompt('Copy the KTP email address:', 'uga.ktp@gmail.com');
    }
  }

  return (
    <button
      type="button"
      onClick={copyEmail}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white bg-white px-5 text-sm font-semibold text-[#14326E] shadow-md transition-transform duration-300 hover:-translate-y-1 hover:bg-blue-100"
      aria-label="Copy Kappa Theta Pi email address"
      title={copied ? 'Email copied' : 'Copy email address'}
    >
      <MailIcon className="h-5 w-5" />
      <span>{copied ? 'Copied' : 'Email'}</span>
    </button>
  );
}

function InstagramIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function MailIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LinkedinIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
