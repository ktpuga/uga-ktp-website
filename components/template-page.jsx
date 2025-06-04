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

  /* --------------------------- Mobile breakpoint --------------------------- */
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const updateMobile = () => setMobile(window.innerWidth < 599)
    updateMobile()
    window.addEventListener("resize", updateMobile)
    return () => window.removeEventListener("resize", updateMobile)
  }, [])

  return (
    <div className="flex min-h-screen flex-col scroll-smooth font-sans text-gray-900">
      <AOSInit />

      {/* ===============================  NAVBAR  ============================== */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-gray-200 bg-white/40 px-4 backdrop-blur-md lg:px-6">
        <Link href="#" className="flex items-center gap-2">
          <span className="bg-gradient-to-tr from-indigo-600 via-sky-500 to-teal-400 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            ΚΘΠ
          </span>
          {!mobile && (
            <span className="text-lg font-semibold text-slate-800/80 dark:text-black/90">
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
        <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
          {/* animated blue→green blob background */}
          <span className="pointer-events-none absolute -left-[20%] top-1/2 -z-10 h-[120vw] w-[120vw] -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-800 via-blue-600 to-green-500 opacity-20 blur-3xl will-change-transform md:-left-[10%] md:h-[80vw] md:w-[80vw]" />

          <div
            className="container mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 md:grid-cols-2 md:px-6"
            data-aos="fade-up"
            data-aos-duration="400"
          >
            {/* -----------------------------  Hero copy  ----------------------------- */}
            <div className="space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tighter text-slate-900 drop-shadow-sm md:text-5xl lg:text-6xl">
                <span className="bg-gradient-to-tr from-indigo-600 via-sky-500 to-teal-400 bg-clip-text text-transparent">
                  Kappa Theta Pi
                </span>
              </h1>
              <p className="max-w-prose text-lg text-slate-700 md:text-xl">
                UGA's first and only <strong>Professional Technology Fraternity</strong>, empowering students through
                leadership, networking, and lifelong friendships.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {/* <Link href="/rush">
                  <Button className="group relative overflow-hidden bg-indigo-600 text-white shadow-lg transition duration-300 hover:bg-indigo-700 inline-flex">
                    <span className="relative z-10">Fall Rush 2025</span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  </Button>
                </Link> */}
                <Link href="/rush" className="inline-flex items-center justify-center rounded-md text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50">
                  <Button className="group relative overflow-hidden bg-indigo-600 text-white shadow-lg transition duration-300 hover:bg-indigo-700 inline-flex">
                    <span>Fall Rush 2025</span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  </Button>
                </Link>
                <Link href="/blog" className="inline-flex items-center justify-center rounded-md text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50">
                  <Button className="group relative overflow-hidden bg-indigo-600 text-white shadow-lg transition duration-300 hover:bg-indigo-700 inline-flex">
                    <span>Blog</span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  </Button>
                </Link>
                {/* <Link
                  href="https://uga.campuslabs.com/engage/organization/ktp"
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-md border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                  prefetch={false}
                >
                  Involvement Network
                </Link> */}
              </div>
            </div>

            {/* -----------------------  Decorative Image Collage  ---------------------- */}
           <div className="flex items-center justify-center">
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
                      className={`h-36 w-full rounded-xl object-cover shadow-lg transition-transform duration-300 hover:scale-105 ${rotation[i % rotation.length]}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===============================  ABOUT  ============================= */}
        <section id="about" className="bg-slate-50 py-16 md:py-24">
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
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">About ΚΘΠ Phi Chapter</h2>
                <p className="text-lg text-slate-700">
                  KTP develops technical skills and professionalism while fostering strong friendships and an international
                  network. Our UGA chapter is committed to leaving a lasting legacy on campus and beyond 🌎.
                </p>
                <p className="text-base text-slate-700">

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
        <section id="values" className="relative overflow-hidden py-16 md:py-24">
          {/* top-right blob */}
          <span className="pointer-events-none absolute -right-1/3 -top-1/4 -z-10 h-[60vw] w-[60vw] rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 opacity-10 blur-3xl" />

          <div className="container mx-auto max-w-6xl px-4 md:px-6" data-aos="fade-up" data-aos-duration="500">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Our Values</h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-700">
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
                  desc: "Interview prep, resume reviews, mentorship & more help our brothers and sisters thrive in tech careers.",
                },
                {
                  title: "Community",
                  desc: "The friendships built in ΚΘΠ last well beyond college & span the globe through countless social events.",
                },
              ].map((v, i) => (
                <div
                  key={v.title}
                  className={`group rounded-xl bg-slate-50 p-6 shadow-lg ring-1 ring-slate-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-indigo-200/50`}
                  data-aos="fade-up"
                  data-aos-delay={100 + i * 100}
                >
                  <h3 className="mb-2 text-xl font-bold text-slate-800 group-hover:text-indigo-600">
                    {v.title}
                  </h3>
                  <p className="text-slate-700">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========  EXEC BOARD  ========= */}
        <section id="leadership" className="bg-slate-50 py-16 md:py-24">
          
          <div className="container mx-auto max-w-6xl px-4 md:px-6" data-aos="fade-up" data-aos-duration="600">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Meet the Exec Board</h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-700">
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
              <Card name="Joey Vos" title="Judicial Chair" bio=".." avatarSrc={images["joey.jpeg"].default.src} fallbackInitials="JV" instagramUrl="https://www.instagram.com/joeyv0s/" linkedinUrl="https://www.linkedin.com/in/joseph-vos/" otherUrl="https://josephvos.com/" />
            </div>
          </div>
        </section>

      <AlumniSection />
        {/* =========  CONTACT  ========= */}
        <section id="contact" className="bg-slate-100 py-16 md:py-24">
          <div className="container mx-auto max-w-4xl px-4 text-center md:px-6" data-aos="flip-up" data-aos-duration="300">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Contact</h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-700">
              Join us for Fall Rush and become part of the KTP family.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <SocialLink href="https://www.instagram.com/ugaktp/">
                <InstagramIcon className="h-6 w-6" />
              </SocialLink>
              <SocialLink href="https://www.linkedin.com/company/kappa-theta-pi-uga/">
                <LinkedinIcon className="h-6 w-6" />
              </SocialLink>
              {/* <SocialLink href="https://groupme.com/join_group/105354211/NUNp5nWk">
                <GroupIcon className="h-6 w-6" />
              </SocialLink> */}
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

function GroupIcon(props) {
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
      <path d="M3 7V5c0-1.1.9-2 2-2h2" />
      <path d="M17 3h2c1.1 0 2 .9 2 2v2" />
      <path d="M21 17v2c0 1.1-.9 2-2 2h-2" />
      <path d="M7 21H5c-1.1 0-2-.9-2-2v-2" />
      <rect width="7" height="5" x="7" y="7" rx="1" />
      <rect width="7" height="5" x="10" y="12" rx="1" />
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
