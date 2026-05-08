"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Footer from "./ui/footer";
import dnTTb from "../public/datenight_x_TT_beta.JPEG";
import ktpUpdated1 from "../public/KTP_UPDATED1.jpg";
import ktpUpdated2 from "../public/KTP_UPDATED2.jpg";
import ktpUpdated3 from "../public/KTP_UPDATED3.jpg";
import mtdspa from "../public/mytie_x_dsp_alpha.JPEG";
import mtdspexec from "../public/mytie_x_dsp_exec.JPEG";
import pcAlpha from "../public/PCalpha.jpg";
import pcDelta from "../public/pcDelta.jpg"
import retreat1 from "../public/retreat_1_whiteshirts.JPEG";
import tg from "../public/tailgate.JPEG";
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

export default function TemplatePage() {
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
    pcDelta.src,
    dnTTb.src,
    mtdspa.src,
    mtdspexec.src,
    retreat1.src,
    tg.src,
  ].filter(Boolean);

  /* ------------------- Hackathon images for highlights -------------- */
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

   /* ------------------- Jobs to Larp for more interest -------------- */
  const networkCompanies = [
    { src: '/ktpjobs/macys-logo-1.svg', alt: "Macy's" },
    { src: '/ktpjobs/Oracle_logo.svg', alt: 'Oracle' },
    { src: '/ktpjobs/IBM_logo.svg', alt: 'IBM' },
    { src: '/ktpjobs/Google_2015_logo.svg', alt: 'Google' },
    { src: '/ktpjobs/Claude_AI_logo.svg', alt: 'Claude' },
    { src: '/ktpjobs/Gulfstream_Aerospace_logo.svg', alt: 'Gulfstream' },
    { src: '/ktpjobs/GSKY.png', alt: 'GreenSky' },
    { src: '/ktpjobs/UPS.svg', alt: 'UPS' },
    { src: '/ktpjobs/NASA_logo.svg', alt: 'Nasa' },
  ];

  /* --------------------------- Mobile breakpoint --------------------------- */
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const updateMobile = () => setMobile(window.innerWidth < 599);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  /* --------------------------- Navbar scroll divider ----------------------- */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col scroll-smooth font-sans bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <AOSInit />

      {/* ===============================  NAVBAR  ============================== */}
      <header className={`sticky top-0 z-50 flex h-16 items-center border-b px-4 backdrop-blur-md lg:px-6 transition-all duration-300 ${scrolled ? "bg-white border-slate-200 shadow-sm" : "bg-slate-50/0 border-transparent"}`}>
        <Link href="#" className="flex items-center gap-2">

          <Image
            src="/KTP PHI CHAPTER.svg"
            alt="ΚΘΠ"
            width={48}
            height={48}
            className="h-10 w-auto object-contain"
          />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {[
            { href: "/", label: "Home" },
            { href: "/rush", label: "Rush" },
            { href: "#about", label: "About", hideOnMobile: true },
            { href: "/members-list", label: "Members" },
            { href: "/ktp-life", label: "KTP Life" },
            // { href: "/hackathon", label: "Hackathon" },
          ]
            .filter((l) => !(mobile && l.hideOnMobile))
            .map((l) => (
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
            href="/login"
            className="ml-6 text-sm font-medium px-3 py-1.5 rounded-md bg-blue-900 text-white border border-blue-900 transition-colors duration-300 hover:bg-blue-800 hover:border-blue-800"
          >
            <span className="relative before:absolute before:-bottom-0.5 before:left-0 before:h-0.5 before:w-full before:origin-left before:scale-x-0 before:bg-white before:transition-transform before:duration-300 [a:hover_&]:before:scale-x-100">
              Portal Login
            </span>
          </Link>
          */}
      </header>
      

      <main className="flex-1">
        {/* ===============================  HERO  ============================== */}

        {/* -------- OLD HERO DESIGN (two-column side-by-side layout) --------
        <section className="relative overflow-hidden py-20 md:py-28 flex items-center min-h-[70vh]">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-20 top-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-25 blur-[120px]" />
            <div className="absolute -bottom-24 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-20 blur-[110px]" />
          </div>
          <div className="container mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-4 md:grid-cols-2 md:px-6">
            <div className="space-y-8" data-aos="fade-up" data-aos-duration="600">
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/60 px-3 py-1 text-xs font-semibold tracking-wider text-blue-600 shadow-sm">
                UGA's Professional Technology Fraternity
              </p>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-blue-900 bg-clip-text drop-shadow-xl">
                Kappa Theta Pi
              </h1>
              <p className="max-w-prose text-lg md:text-xl text-slate-700">
                Empowering technologists through leadership, mentorship, and community. On a mission to build what matters.
              </p>
            </div>
            <div className="flex items-center justify-center" data-aos="fade-up" data-aos-delay="150">
              <div className="relative w-full max-w-md sm:max-w-lg">
                <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-blue-950/40 via-blue-900/30 to-indigo-900/15 blur-2xl" />
                <div className="grid grid-cols-3 gap-0">
                  {heroPics.slice(0, 6).map((src, i) => (
                    <Image key={i} unoptimized src={src} alt={`collage ${i + 1}`} width={400} height={500}
                      className={`h-52 w-full rounded-xl object-cover shadow-2xl transition-transform duration-500 hover:scale-110 ${rotation[i % rotation.length]}`}
                      style={{ transform: `translateY(${(i % 2 === 0 ? -1 : 1) * 14}px)`, marginLeft: i !== 0 ? "-12px" : "0" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        -------- END OLD HERO DESIGN -------- */}

        <section className="relative overflow-hidden py-10 md:py-16 min-h-[55vh]">
          {/* Animated gradient blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -left-20 top-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-25 blur-[120px]" />
            <div className="absolute -bottom-24 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-20 blur-[110px]" />
          </div>

          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            {/* Centered Hero Copy */}
            <div
              className="text-center max-w-3xl mx-auto mb-8"
              data-aos="fade-up"
              data-aos-duration="600"
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/60 px-3 py-1 text-xs font-semibold tracking-wider text-blue-600 shadow-sm mb-4">
                University of Georgia&apos;s Professional Technology Fraternity
              </p>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-blue-900 drop-shadow-xl mb-4">
                Kappa Theta Pi
              </h1>
              <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto">
                Empowering technologists through leadership, mentorship, and
                community. On a mission to build what matters.
              </p>
            </div>

            {/* Full-width Image Collage below text */}
            <div
              data-aos="fade-up"
              data-aos-delay="150"
            >
              <div className="relative">
                <div className="absolute -inset-6 -z-10 rounded-3xl " />
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {heroPics.slice(0, 6).map((src, i) => (
                    <Image
                      key={i}
                      unoptimized
                      src={src}
                      alt={`ΚΘΠ collage ${i + 1}`}
                      width={400}
                      height={300}
                      className={`h-56 md:h-72 w-full rounded-xl object-cover transition-transform duration-500 hover:scale-105 ${rotation[i % rotation.length]}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================== HACKATHON HIGHLIGHTS ===================== */}
        <section className="relative py-8 md:py-10 bg-white/70">
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

            {/* Horizontal scroll / snap carousel (no extra deps) */}
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

            {/* Devpost CTA */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="https://uga-ktp-hackathon-fall-25.devpost.com/"
                target="_blank"
              >
                <Button className="rounded-xl bg-gradient-to-r text-white px-6 py-3 shadow-md hover:from-blue-900 hover:to-indigo-600">
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

        {/* ===============================  ABOUT  ============================= */}
        <section id="about" className="bg-card py-10 md:py-16">
          <div
            className="container mx-auto max-w-6xl px-4 md:px-6"
            data-aos="fade-up"
            data-aos-duration="500"
          >
            <div className="grid gap-10 md:grid-cols-2 md:gap-16">
              {/* About section image collage — mirrors hero collage structure */}
              <div className="relative flex items-center justify-center overflow-visible -mx-8 md:-mx-16">
                {/* Blue-to-cyan gradient backdrop matching site theme */}
                <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-blue-900/40 via-sky-700/25 to-cyan-800/15 blur-2xl" />
                <div className="grid grid-cols-3 w-full">
                  {[ktpUpdated1, ktpUpdated2, ktpUpdated3].map((img, i) => (
                    <Image
                      key={i}
                      unoptimized
                      src={img.src}
                      alt={`ΚΘΠ about ${i + 1}`}
                      width={400}
                      height={500}
                      className={`h-72 w-full rounded-xl object-cover shadow-2xl transition-transform duration-500 hover:scale-110 ${rotation[i % rotation.length]}`}
                      style={{
                        transform: `translateY(${(i % 2 === 0 ? -1 : 1) * 14}px)`,
                        marginLeft: i !== 0 ? "-14px" : "0",
                      }}
                    />
                  ))}
                </div>
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
        </section>

        {/* =========  OUR NETWORK  ========= */}
        <section className="bg-card py-8 md:py-12">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl text-primary mb-3">
              Our Network
            </h2>
            <p className="text-center text-slate-600 mb-7">
              Where KTP members intern and work
            </p>

            <div className="flex flex-wrap items-center justify-center gap-10 md:gap-14">
              {networkCompanies.map((company, i) => (
                <div
                  key={i}
                  className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                  data-aos="fade-up"
                  data-aos-delay={80 * i}
                >
                  <img
                    src={company.src}
                    alt={company.alt}
                    className="h-10 w-auto max-w-[120px] object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========  VALUES  ========= */}
        <section
          id="values"
          className="relative overflow-hidden py-10 md:py-14 bg-gradient-to-b from-white/70 to-slate-100"
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

            <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
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
        </section>

      </main>
      <Footer />
    </div>
  );
}
