"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Footer from "@/components/ui/footer";
import { AOSInit } from "@/components/ui/timeline";
import { FaGoogle, FaUniversity, FaUps } from "react-icons/fa";

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

/* -------------------------------------------------------------------------- */
/*                               COMPANY LOGOS                                */
/* -------------------------------------------------------------------------- */
const logos = {
  invesco:
    "https://images.seeklogo.com/logo-png/32/1/invesco-logo-png_seeklogo-321428.png",
  statefarm:
    "https://freepnglogo.com/images/all_img/1725554212state-farm-symbol-logo.png",
  deloitte:
    "https://upload.wikimedia.org/wikipedia/commons/2/2b/DeloitteNewSmall.png",
  lexisNexis:
    "https://images.icon-icons.com/2699/PNG/512/lexisnexis_logo_icon_169270.png",
  georgiaTech:
    "https://upload.wikimedia.org/wikipedia/commons/8/84/Georgia_Tech_logo_2021_Cropped.png",
};

/* -------------------------------------------------------------------------- */
/*                                  ICONS                                     */
/* -------------------------------------------------------------------------- */
function InstagramIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
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

function LinkedinIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
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

/* -------------------------------------------------------------------------- */
/*                           MEMBER CARD                                      */
/* -------------------------------------------------------------------------- */
function MemberCard({ name, title, avatarSrc, fallbackInitials, instagramUrl, linkedinUrl }) {
  return (
    <div className="group flex flex-col">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100 shadow-md">
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-blue-50 text-2xl font-bold text-blue-300">
            {fallbackInitials}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex justify-center gap-4 bg-white/90 px-3 py-2.5 backdrop-blur-sm">
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                className="text-slate-500 transition-colors hover:text-pink-500">
                <InstagramIcon />
              </a>
            )}
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="text-slate-500 transition-colors hover:text-blue-600">
                <LinkedinIcon />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="font-semibold text-slate-900 leading-tight text-sm">{name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{title}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           ALUMNI CARD                                      */
/* -------------------------------------------------------------------------- */
function AlumniCard({ alum }) {
  const badgeEl = (() => {
    if (!alum.icon) return null;
    if (typeof alum.icon === "string")
      return <img src={alum.icon} alt="organization logo" className="h-6 w-6 object-contain" />;
    const Icon = alum.icon;
    return <Icon className="text-slate-400" />;
  })();

  return (
    <div className="group flex flex-col">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100 shadow-md">
        {alum.avatarSrc ? (
          <Image src={alum.avatarSrc} alt={alum.name} fill unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-blue-50 text-2xl font-bold text-blue-300">
            {alum.fallbackInitials}
          </div>
        )}
        {badgeEl && (
          <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm text-lg">
            {badgeEl}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex justify-center gap-4 bg-white/90 px-3 py-2.5 backdrop-blur-sm">
            {alum.instagramUrl && (
              <a href={alum.instagramUrl} target="_blank" rel="noopener noreferrer"
                className="text-slate-500 transition-colors hover:text-pink-500">
                <InstagramIcon />
              </a>
            )}
            {alum.linkedinUrl && (
              <a href={alum.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="text-slate-500 transition-colors hover:text-blue-600">
                <LinkedinIcon />
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="font-semibold text-slate-900 leading-tight text-sm">{alum.name}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {alum.class && <span className="font-medium">{alum.class} · </span>}
          Class of {alum.classYear}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               MAIN PAGE                                    */
/* -------------------------------------------------------------------------- */
export default function MembersPage() {
  const leadershipImages = importAll(
    require.context("../../public/leadership/", false, /\.(png|jpe?g|svg)$/),
  );
  const memberImages = importAll(
    require.context("../../public/members/", false, /\.(png|jpe?g|svg)$/),
  );
  const allImages = { ...leadershipImages, ...memberImages };

  const execMembers = [
    { name: "Daniel Rifai", title: "President", avatarKey: "danny.jpeg", fallbackInitials: "DR", instagramUrl: "https://www.instagram.com/drifai2", linkedinUrl: "https://www.linkedin.com/in/daniel-rifai-19226a292/" },
    { name: "William Tomaszewski", title: "VP of Membership", avatarKey: "will.jpg", fallbackInitials: "WT", instagramUrl: "https://www.instagram.com/will_.tom/" },
    { name: "Alli Gay", title: "VP of Finance", avatarKey: "alli.jpeg", fallbackInitials: "AG", instagramUrl: "https://www.instagram.com/allisonngayy/", linkedinUrl: "https://www.linkedin.com/in/allison-gay-8956a7296/" },
    { name: "Ajeetha Murugappan", title: "VP of Marketing", avatarKey: "ajeetha.jpeg", fallbackInitials: "AM", instagramUrl: "https://www.instagram.com/ajeetha.05/", linkedinUrl: "https://www.linkedin.com/in/ajeetha-murugappan-43b6a01b5/" },
    { name: "Yoshna Agarwal", title: "VP of Internal Affairs", avatarKey: "yoshna.jpg", fallbackInitials: "YA", instagramUrl: "https://www.instagram.com/yoshnaagarwal/", linkedinUrl: "https://www.linkedin.com/in/yoshna-agarwal/" },
    { name: "Jonah Criswell", title: "VP of External Affairs", avatarKey: "jonah_cropped.jpeg", fallbackInitials: "JC", instagramUrl: "https://www.instagram.com/jonah.criswell/", linkedinUrl: "https://www.linkedin.com/in/jonah-criswell/" },
    { name: "Manya Vikram", title: "VP of Professional Dev", avatarKey: "manya.jpeg", fallbackInitials: "MV", instagramUrl: "https://www.instagram.com/manya.vv/", linkedinUrl: "https://www.linkedin.com/in/manya-vikram-bb0652220/" },
    { name: "Adithya Lakshmikanth", title: "VP of Technical Dev", avatarKey: "adithya.jpg", fallbackInitials: "AL", instagramUrl: "https://www.instagram.com/ladithya27/", linkedinUrl: "https://www.linkedin.com/in/ladithya/" },
  ];

  const alumniData = [
    { name: "Gargee Jamadagni", classYear: 2025, class: "Founder", avatarKey: "gargee.jpeg", fallbackInitials: "GJ", instagramUrl: "https://www.instagram.com/gargee.jam/", linkedinUrl: "https://www.linkedin.com/in/gargeejamadagni/", icon: FaUniversity },
    { name: "Siya Sharma", classYear: 2025, class: "Founder", avatarKey: "siya.jpeg", fallbackInitials: "SS", instagramUrl: "https://www.instagram.com/siyasharma.03/", linkedinUrl: "https://www.linkedin.com/in/siya-sharma-ss2025/", icon: logos.invesco },
    { name: "Jiya Patel", classYear: 2024, class: "Founder", avatarKey: "jiya.jpeg", fallbackInitials: "JP", instagramUrl: "https://www.instagram.com/jiyanpatel31/", linkedinUrl: "https://www.linkedin.com/in/jiya-patel-422615228/", icon: FaUps },
    { name: "Khushi Bhatamrekar", classYear: 2025, class: "Founder", avatarKey: "khushi.jpeg", fallbackInitials: "KB", instagramUrl: "https://www.instagram.com/khuxhix/", linkedinUrl: "https://www.linkedin.com/in/khushibhat/", icon: FaGoogle },
    { name: "Shriya Rasale", classYear: 2025, class: "Alpha", avatarKey: "ShriyaR.jpeg", fallbackInitials: "SB", instagramUrl: "https://www.instagram.com/shriya_rasale/", linkedinUrl: "https://www.linkedin.com/in/shriya-rasale", icon: logos.statefarm },
    { name: "Venn Reddy", classYear: 2025, class: "Affiliate", avatarKey: "venn.jpeg", fallbackInitials: "VR", instagramUrl: "https://www.instagram.com/venn.reddy/", linkedinUrl: "https://www.linkedin.com/in/venn-reddy/", icon: logos.deloitte },
    { name: "Yushus Komarlu", classYear: 2025, class: "Affiliate", avatarKey: "yushus.jpeg", fallbackInitials: "YK", instagramUrl: "https://www.instagram.com/yushus_komarlu/", linkedinUrl: "https://www.linkedin.com/in/yushuskomarlu/", icon: logos.lexisNexis },
    { name: "Stephen Sulimani", classYear: 2025, class: "Founder", avatarKey: "stephen.jpeg", fallbackInitials: "SS", instagramUrl: "https://www.instagram.com/stephensulimani/", linkedinUrl: "https://www.linkedin.com/in/stephensulimani/", icon: logos.georgiaTech },
    { name: "Hayden Crane", classYear: 2025, class: "Founder", avatarKey: "hayden.jpeg", fallbackInitials: "HC", instagramUrl: "https://www.instagram.com/haydencranee/", linkedinUrl: "https://www.linkedin.com/in/haydencrane/", icon: FaUniversity },
    { name: "Henry Lue", classYear: 2025, class: "Beta", avatarSrc: null, fallbackInitials: "HL", instagramUrl: "https://www.instagram.com/henry.lue/", linkedinUrl: "https://www.linkedin.com/in/henry-lue/", icon: FaUniversity },
    { name: "Anjali Devarapalli", classYear: 2025, class: "Alpha", avatarSrc: null, fallbackInitials: "AD", instagramUrl: "https://www.instagram.com/anjali.devarapalli/", linkedinUrl: "https://www.linkedin.com/in/anjali-devarapalli-b1677329a//", icon: FaUniversity },
    { name: "Tharushika Dehi", classYear: 2025, class: "Alpha", avatarSrc: null, fallbackInitials: "TD", instagramUrl: "https://www.instagram.com/tharushikadehi/", linkedinUrl: "https://www.linkedin.com/in/maryan-dehipitiarachchi/", icon: FaUniversity },
  ].sort((a, b) => a.classYear - b.classYear);

  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("exec-board");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const updateMobile = () => setMobile(window.innerWidth < 599);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const switchTab = (id) => {
    if (id === activeTab) return;
    setVisible(false);
    setTimeout(() => {
      setActiveTab(id);
      setVisible(true);
    }, 150);
  };

  const dirLinks = [
    { id: "exec-board", label: "Executive Board" },
    { id: "members", label: "Members" },
    { id: "alumni", label: "Alumni" },
  ];

  return (
    <div className="flex min-h-screen flex-col font-sans bg-white text-slate-900">
      <AOSInit />

      {/* ===============================  NAVBAR  ============================== */}
      <header
        className={`sticky top-0 z-50 flex h-16 items-center border-b px-4 backdrop-blur-md lg:px-6 transition-all duration-300 ${
          scrolled ? "bg-white border-slate-200 shadow-sm" : "bg-white/80 border-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2">
          <Image src="/KTP PHI CHAPTER.svg" alt="ΚΘΠ" width={48} height={48} className="h-10 w-auto object-contain" />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {[
            { href: "/rush", label: "Rush" },
            { href: "/#about", label: "About", hideOnMobile: true },
            { href: "/members-list", label: "Members" },
            { href: "/hackathon", label: "Hackathon" },
            { href: "/#contact", label: "Contact" },
          ]
            .filter((l) => !(mobile && l.hideOnMobile))
            .map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`relative text-sm font-medium transition-colors duration-300 before:absolute before:-bottom-0.5 before:left-0 before:h-0.5 before:w-full before:origin-left before:scale-x-0 before:bg-blue-900 before:transition-transform before:duration-300 hover:text-blue-900 hover:before:scale-x-100 ${
                  l.label === "Members" ? "text-blue-900 before:scale-x-100" : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
        </nav>
        <Link
          href="/login"
          className="ml-6 text-sm font-medium px-3 py-1.5 rounded-md bg-blue-900 text-white border border-blue-900 transition-colors duration-300 hover:bg-blue-800 hover:border-blue-800"
        >
          Portal Login
        </Link>
      </header>

      <main className="flex-1">
        {/* ===============================  HERO  ============================== */}
        <section className="border-b border-slate-100 py-10 md:py-14">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wider text-blue-600 shadow-sm mb-4">
                  University of Georgia&apos;s Professional Technology Fraternity
                </p>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-blue-900 mb-2">
                  Our Members
                </h1>
                <p className="max-w-xl text-base text-slate-600">
                  Meet the executive board, active brothers, and alumni of KTP Phi Chapter.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===============================  DIRECTORY + CONTENT  ================ */}
        <section className="py-10 md:py-14">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex flex-col md:flex-row gap-8">

              {/* ----- Sidebar directory nav (desktop) / tab row (mobile) ----- */}
              <aside className="md:w-52 shrink-0">
                {/* Mobile: horizontal pill tabs */}
                <div className="flex md:hidden gap-2 mb-6 overflow-x-auto pb-1">
                  {dirLinks.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => switchTab(id)}
                      className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 ${
                        activeTab === id
                          ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-900 hover:text-blue-900"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Desktop: vertical card nav */}
                <nav className="hidden md:flex sticky top-24 flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                  <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Directory
                  </p>
                  {dirLinks.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => switchTab(id)}
                      className={`w-full px-4 py-3 text-sm font-medium rounded-xl text-left transition-all duration-200 ${
                        activeTab === id
                          ? "bg-blue-900 text-white shadow-sm"
                          : "text-slate-600 hover:text-blue-900 hover:bg-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              </aside>

              {/* ----- Content panel ----- */}
              <div className="flex-1 min-w-0">
                <div
                  style={{ opacity: visible ? 1 : 0, transition: "opacity 150ms ease" }}
                >
                  {/* EXEC BOARD */}
                  {activeTab === "exec-board" && (
                    <div>
                      <div className="mb-7 pb-5 border-b border-slate-100">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                          Executive Board
                        </h2>
                        <p className="mt-1 text-slate-500 text-sm">
                          The leaders driving KTP forward this semester.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
                        {execMembers.map((member) => (
                          <MemberCard
                            key={member.name}
                            name={member.name}
                            title={member.title}
                            avatarSrc={
                              member.avatarKey && allImages[member.avatarKey]
                                ? allImages[member.avatarKey].default.src
                                : null
                            }
                            fallbackInitials={member.fallbackInitials}
                            instagramUrl={member.instagramUrl}
                            linkedinUrl={member.linkedinUrl}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MEMBERS */}
                  {activeTab === "members" && (
                    <div>
                      <div className="mb-7 pb-5 border-b border-slate-100">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                          Members
                        </h2>
                        <p className="mt-1 text-slate-500 text-sm">
                          Active brothers of KTP Phi Chapter.
                        </p>
                      </div>
                      <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-32">
                        <div className="text-center px-4">
                          <p className="text-slate-400 font-medium">Active member profiles coming soon.</p>
                          <p className="mt-1 text-xs text-slate-300">
                            Check back after the next pledge class is initiated.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ALUMNI */}
                  {activeTab === "alumni" && (
                    <div>
                      <div className="mb-7 pb-5 border-b border-slate-100">
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                          Alumni
                        </h2>
                        <p className="mt-1 text-slate-500 text-sm">
                          Celebrating KTP alumni and their ongoing impact.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
                        {alumniData.map((alum) => (
                          <AlumniCard
                            key={alum.name}
                            alum={{
                              ...alum,
                              avatarSrc:
                                alum.avatarSrc !== undefined
                                  ? alum.avatarSrc
                                  : alum.avatarKey && allImages[alum.avatarKey]
                                  ? allImages[alum.avatarKey].default.src
                                  : null,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
