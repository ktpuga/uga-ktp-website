'use client'
import { Button } from "@/components/ui/button"
import Card from "@/components/ui/Card"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useState } from "react"
import Footer from "../components/ui/footer"
import dnTTb from "../public/datenight_x_TT_beta.JPEG"
import main from "../public/glitchKTP.gif"
import mtdspa from "../public/mytie_x_dsp_alpha.JPEG"
import mtdspexec from "../public/mytie_x_dsp_exec.JPEG"
import pcAlpha from "../public/PCalpha.jpg"
import retreat1 from "../public/retreat_1_whiteshirts.JPEG"
import tg from "../public/tailgate.JPEG"
import AlumniSection from "./AlumniSection"
import { AOSInit } from "./ui/timeline"

// NEW: Hackathon photos (same set used on /hackathon)
import ktpHacks1 from "@/public/ktpHacks1.jpeg"
import ktpHacks2 from "@/public/ktpHacks2.jpeg"
import ktpHacks4 from "@/public/ktphacks2_1.jpeg"
import ktpHacks13 from "@/public/ktphacks2_10.jpeg"
import ktpHacks5 from "@/public/ktphacks2_2.jpeg"
import ktpHacks6 from "@/public/ktphacks2_3.jpeg"
import ktpHacks7 from "@/public/ktphacks2_4.jpeg"
import ktpHacks8 from "@/public/ktphacks2_5.jpeg"
import ktpHacks9 from "@/public/ktphacks2_6.jpeg"
import ktpHacks10 from "@/public/ktphacks2_7.jpeg"
import ktpHacks11 from "@/public/ktphacks2_8.jpeg"
import ktpHacks12 from "@/public/ktphacks2_9.jpeg"
import ktpHacks3 from "@/public/ktpHacks3.jpeg"

/* -------------------------------------------------------------------------- */
/*                             UTILITY: IMPORT ALL                            */
/* -------------------------------------------------------------------------- */
function importAll(r) {
  const images = {}
  r.keys().forEach((item) => {
    images[item.replace("./", "")] = r(item)
  })
  return images
}

export default function TemplatePage() {
  /* ---------------------- Collect leadership head‑shots --------------------- */
  const images = importAll(
    require.context("../public/leadership/", false, /\.(png|jpe?g|svg)$/)
  )

  const rotation = [
    "rotate-[3deg]",
    "-rotate-[2deg]",
    "rotate-[1deg]",
    "-rotate-[3deg]",
    "rotate-[2deg]",
    "-rotate-[1deg]",
  ]

  /* ------------------- Media for the hero collage ------------------ */
  const heroPics = [
    pcAlpha.src,
    dnTTb.src,
    mtdspa.src,
    mtdspexec.src,
    retreat1.src,
    tg.src,
  ].filter(Boolean)

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
  ]

  /* --------------------------- Mobile breakpoint --------------------------- */
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const updateMobile = () => setMobile(window.innerWidth < 599)
    updateMobile()
    window.addEventListener("resize", updateMobile)
    return () => window.removeEventListener("resize", updateMobile)
  }, [])

  return (
    <div className="flex min-h-screen flex-col scroll-smooth font-sans bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <AOSInit />

      {/* ===============================  NAVBAR  ============================== */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-slate-200 bg-white/70 px-4 backdrop-blur-md lg:px-6">
        <Link href="#" className="flex items-center gap-2">
          <span className="bg-gradient-to-tr from-indigo-600 via-sky-500 to-teal-400 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            ΚΘΠ
          </span>
          {!mobile && (
            <span className="text-lg font-semibold text-slate-800/80">
              Phi Chapter at UGA
            </span>
          )}
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {[
            { href: "/rush", label: "Rush" },
            { href: "#about", label: "About", hideOnMobile: true },
            { href: "#leadership", label: "Leadership" },
            { href: "#alumni", label: "Alumni", hideOnMobile: true },
            { href: "/hackathon", label: "Hackathon" },
            { href: "#contact", label: "Contact" },
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
      </header>

      <main className="flex-1">
        {/* ===============================  HERO  ============================== */}
        <section className="relative overflow-hidden py-20 md:py-28 flex items-center min-h-[70vh]">
          {/* Animated gradient blobs */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-20 top-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-25 blur-[120px]" />
            <div className="absolute -bottom-24 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-20 blur-[110px]" />
          </div>

          <div className="container mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-4 md:grid-cols-2 md:px-6">
            {/* Hero Copy */}
            <div className="space-y-8" data-aos="fade-up" data-aos-duration="600">
              <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/60 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-700 shadow-sm">
                UGA's Professional Technology Fraternity
              </p>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight bg-gradient-to-tr from-indigo-500 via-fuchsia-600 to-cyan-500 bg-clip-text text-transparent drop-shadow-xl">
                Kappa Theta Pi
              </h1>
              <p className="max-w-prose text-lg md:text-xl text-slate-700">
                Empowering technologists through leadership, mentorship, and community. On a mission to build what matters.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/rush">
                  <Button className="relative px-8 py-4 text-lg font-semibold rounded-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-cyan-500 shadow-xl text-white hover:scale-105 transition-transform duration-300">
                    Spring Rush 2026
                  </Button>
                </Link>
                <Link href="/hackathon">
                  <Button variant="outline" className="px-8 py-4 text-lg rounded-2xl border-slate-300 hover:border-indigo-400 hover:text-indigo-700">
                    See KTP Hacks
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
            <div className="flex items-center justify-center" data-aos="fade-up" data-aos-delay="150">
              <div className="relative w-full max-w-md sm:max-w-lg">
                <div className="grid grid-cols-3 gap-4">
                  {heroPics.slice(0, 6).map((src, i) => (
                    <Image
                      key={i}
                      unoptimized
                      src={src}
                      alt={`ΚΘΠ collage ${i + 1}`}
                      width={400}
                      height={300}
                      className={`h-36 w-full rounded-xl object-cover shadow-2xl transition-transform duration-500 hover:scale-110 ${rotation[i % rotation.length]}`}
                      style={{ transform: `translateY(${(i % 2 === 0 ? -1 : 1) * 10}px)` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================== HACKATHON HIGHLIGHTS ===================== */}
        <section className="relative py-12 md:py-16 bg-white/70">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Hackathon Highlights</h2>
                <p className="text-slate-600">Second Edition • Fall 2025 • 8 projects • 12 hours</p>
              </div>
              <Link href="/hackathon" className="text-indigo-600 hover:underline font-medium">See more →</Link>
            </div>

            {/* Horizontal scroll / snap carousel (no extra deps) */}
            <div className="group relative">
              <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
                {hackPics.map((img, i) => (
                  <figure key={i} className="relative h-56 w-[300px] shrink-0 snap-start overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100">
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
              <Link href="https://uga-ktp-hackathon-fall-25.devpost.com/" target="_blank">
                <Button className="rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-cyan-500 px-6 py-3 text-white shadow-md hover:from-fuchsia-500 hover:to-indigo-600">View 2025 Devpost</Button>
              </Link>
              <Link href="https://uga-ktp-hackathon-f24.devpost.com/" target="_blank" className="text-sm text-slate-600 hover:underline">
                or view 2024
              </Link>
            </div>
          </div>
        </section>

        {/* ===============================  ABOUT  ============================= */}
        <section id="about" className="bg-card py-16 md:py-24">
          <div className="container mx-auto max-w-6xl px-4 md:px-6" data-aos="fade-up" data-aos-duration="500">
            <div className="grid gap-10 md:grid-cols-2 md:gap-16">
              <div className="relative flex items-center justify-center">
                <Image
                  unoptimized
                  src={main.src}
                  width={420}
                  height={420}
                  alt="About ΚΘΠ"
                  className="rounded-2xl shadow-xl"
                />
                <span className="absolute -inset-2 -z-10 animate-pulse rounded-3xl bg-gradient-to-br from-blue-400 via-teal-400 to-green-300 opacity-10 blur-2xl" />
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-primary">About ΚΘΠ Phi Chapter</h2>
                <p className="text-lg text-foreground">
                  KTP develops technical skills and professionalism while fostering strong friendships and an international
                  network. Our UGA chapter is committed to leaving a lasting legacy on campus and beyond 🌎.
                </p>
                <p className="text-base text-foreground">
                  <Link href="https://ktpmichigan.com" target="_blank" className="text-indigo-600 hover:underline">
                    The Alpha Chapter
                  </Link>
                  , founded on January 10, 2012 at the University of Michigan, paved the way for our growing fraternity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========  VALUES  ========= */}
        <section id="values" className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-white/70 to-slate-100">
          <span className="pointer-events-none absolute -right-1/3 -top-1/4 -z-10 h-[60vw] w-[60vw] rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 opacity-10 blur-3xl" />

          <div className="container mx-auto max-w-6xl px-4 md:px-6" data-aos="fade-up" data-aos-duration="500">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-primary">Our Values</h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-foreground">
                The pillars that guide and shape every ΚΘΠ member.
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
                  desc: "The friendships built in ΚΘΠ last well beyond college & span the globe through countless events.",
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

        {/* =========  EXEC BOARD  ========= */}
        <section id="leadership" className="bg-card py-16 md:py-24">
          <div className="container mx-auto max-w-6xl px-4 md:px-6" data-aos="fade-up" data-aos-duration="600">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-primary">Meet the Exec Board</h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-foreground">
                The leaders driving ΚΘΠ forward.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-6 text-sm p-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              {/* === Cards (unchanged) === */}
              {/* prettier-ignore */}
              <Card name="Ryan Majd" title="President" bio="Ryan is a junior Computer Science major and Mathematics minor at UGA. He enjoys playing basketball, going to the gym and working on his Company." avatarSrc={images["ryan.jpeg"].default.src} fallbackInitials="RM" instagramUrl="https://www.instagram.com/TheRyanMajd" linkedinUrl="https://www.linkedin.com/in/ryan-majd/" otherUrl="https://ryanmajd.com/" />
              <Card name="Andrew Warner" title="VP of Membership" bio="Andrew is a junior Computer Science major at UGA. He enjoys playing video games, watching movies, and spending time with friends." avatarSrc={images["andrew.jpeg"].default.src} fallbackInitials="AW" instagramUrl="https://www.instagram.com/andrew__warner/" linkedinUrl="https://www.linkedin.com/in/andrew-a-warner/" />
              <Card name="Alli Gay" title="VP of Marketing" bio="Alli is a Data Science major at UGA. She is also involved in UGA’s Club Cross Country/Track team and Delta Zeta Sorority. She loves to run, be outside, paint, and listen to music." avatarSrc={images["alli.jpeg"].default.src} fallbackInitials="AG" instagramUrl="https://www.instagram.com/allisonngayy/" linkedinUrl="https://www.linkedin.com/in/allison-gay-8956a7296/" />
              <Card name="Daniel Rifai" title="VP of Finance" bio="Daniel Rifai is a third year Computer Science and Finance major. He enjoys the outdoors, sports, film, and card games." avatarSrc={images["danny.jpeg"].default.src} fallbackInitials="DR" instagramUrl="https://www.instagram.com/dannyr_04/" linkedinUrl="https://www.linkedin.com/in/daniel-rifai-19226a292/" />
              <Card name="Ajeetha Murugappan" title="VP of Marketing" bio="Ajeetha is a sophomore Computer Science major and Business minor. She enjoys golfing, going to concerts, and long walks!" avatarSrc={images["ajeetha.jpeg"].default.src} fallbackInitials="AM" instagramUrl="https://www.instagram.com/ajeetha.05/" linkedinUrl="https://www.linkedin.com/in/ajeetha-murugappan-43b6a01b5/" />
              <Card name="Maadhavan Muthuselvan" title="VP of Internal Affairs" bio="3rd Year MIS major @ University of Georgia" avatarSrc={images["maadhavan.jpeg"].default.src} fallbackInitials="MM" instagramUrl="https://www.instagram.com/_maadhavan/" linkedinUrl="https://www.linkedin.com/in/maadhavan23/" otherUrl="https://www.maadhavan.com/"/>
              <Card name="Stephen Sulimani" title="VP of External Affairs" bio="Stephen is a senior Computer Science major from New York City. He is interested in FinTech and enjoys playing tennis and working on personal hobby projects." avatarSrc={images["stephen.jpeg"].default.src} fallbackInitials="SS" instagramUrl="https://www.instagram.com/stephensulimani/" linkedinUrl="https://www.linkedin.com/in/stephensulimani/" />
              <Card name="Manya Vikram" title="VP of Professional Dev" bio="empty" avatarSrc={images["manya.jpeg"].default.src} fallbackInitials="MV" instagramUrl="https://www.instagram.com/manya.vv/" linkedinUrl="https://www.linkedin.com/in/manya-vikram-bb0652220/" />
              <Card name="Ethan Ogle" title="VP of Technical Dev" bio="Junior at the University of Georgia pursuing degrees in Computer Science and Applied Mathematics, currently serving as a Cloud SWE Intern at Altagrove, Co-President of ACM, and Technical Organizer for UGAHacks." avatarSrc={images["ethan.jpeg"].default.src} fallbackInitials="EO" instagramUrl="https://www.instagram.com/etho_ogle/" linkedinUrl="https://www.linkedin.com/in/ethan-ogle/" />
            </div>
          </div>
        </section>

        <AlumniSection />

        {/* =========  CONTACT  ========= */}
        <section id="contact" className="bg-slate-100 py-16 md:py-24">
          <div className="container mx-auto max-w-4xl px-4 text-center md:px-6" data-aos="flip-up" data-aos-duration="300">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Contact</h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-700">
              Join us for Rush and become part of the KTPhamily.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <SocialLink href="https://www.instagram.com/ugaktp/">
                <InstagramIcon className="h-6 w-6" />
              </SocialLink>
              <SocialLink href="https://www.linkedin.com/company/kappa-theta-pi-uga/">
                <LinkedinIcon className="h-6 w-6" />
              </SocialLink>
              <SocialLink href="mailto:uga.ktp@gmail.com;ryan.majd@uga.edu">
                <MailIcon className="h-6 w-6" />
              </SocialLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

/* -----------------------------  Helpers  ----------------------------- */
function SocialLink({ href, children }) {
  return (
    <Link
      href={href}
      target="_blank"
      prefetch={false}
      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:text-indigo-600 hover:shadow-indigo-200/70"
    >
      {children}
    </Link>
  )
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
  )
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
  )
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
  )
}
