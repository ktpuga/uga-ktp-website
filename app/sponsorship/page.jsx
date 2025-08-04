import Card from '@/components/ui/Card';
import Link from 'next/link';
import manya from '../../public/leadership/manya.jpeg';
import ryan from '../../public/leadership/ryan.jpeg';
import stephen from '../../public/leadership/stephen.jpeg';

export default function SponsorshipPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-gray-950 via-indigo-950 to-black text-gray-100 overflow-hidden">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-indigo-900 bg-black/70 backdrop-blur-md px-4 lg:px-6 shadow-lg">
        <Link href="/" className="flex items-center font-bold text-cyan-400 drop-shadow-neon">
          <span className="text-2xl md:text-3xl tracking-tight bg-gradient-to-tr from-indigo-400 via-cyan-400 to-fuchsia-500 bg-clip-text text-transparent animate-pulse">ΚΘΠ</span>
          <span className="ml-2 hidden text-sm font-semibold text-fuchsia-300 sm:inline">| Sponsorship</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-fuchsia-400">Home</Link>
        </nav>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 animate-pulse [background-image:radial-gradient(#00fff7_1px,transparent_1px)] [background-size:6px_6px] opacity-10" />
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -left-32 top-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-400 opacity-40 blur-[140px] animate-pulse" />
          <div className="absolute -bottom-28 right-0 h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-cyan-500 via-fuchsia-500 to-indigo-500 opacity-30 blur-[120px] animate-pulse" />
        </div>

        <section className="relative z-10 mx-auto max-w-4xl px-6 py-16 md:py-24 bg-black/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-indigo-900">
          {/* Hero */}
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-neon text-center">
            2025–2026 Kappa Theta Pi Sponsorship Packet
          </h1>
          <p className="mb-12 text-lg text-fuchsia-200 text-center">
            Partner with UGA’s premier professional technology fraternity and support tomorrow’s tech leaders.
          </p>

          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">Introduction</h2>
            <p className="text-gray-200 leading-relaxed">
              Kappa Theta Pi (KTP) Phi Chapter at the University of Georgia is a professional technology fraternity committed to building a close-knit, forward-thinking community for students pursuing careers in tech. Our members come from diverse academic backgrounds, united by a shared passion for innovation, collaboration, and professional growth. Through workshops, tech talks, and networking events, we empower our members to develop technical and leadership skills and connect with industry professionals.
            </p>
          </section>

          {/* Sponsorship Tiers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-indigo-400 mb-6">Sponsorship Tiers</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {/* Tier 1 */}
              <div className="rounded-xl border border-cyan-700 bg-gradient-to-br from-gray-900 via-cyan-950 to-black p-6 shadow-lg flex flex-col">
                <h3 className="text-xl font-semibold text-cyan-300 mb-2">Tier 1: Catering Sponsor</h3>
                <p className="text-gray-300 mb-4">
                  Provide catering for a General Body meeting and engage with members in a relaxed professional setting.
                </p>
                <ul className="text-sm text-gray-400 space-y-1 mb-4">
                  <li>Direct engagement with KTP members</li>
                  <li>Presentation slot for internships or career roles</li>
                </ul>
                <p className="mt-auto font-semibold text-gray-200">Estimated Reach: 70–100 students per meeting</p>
                <p className=" font-semibold text-gray-200">Cost: Catering Fees</p>
              </div>

              {/* Tier 2 */}
              <div className="rounded-xl border border-fuchsia-700 bg-gradient-to-br from-gray-900 via-fuchsia-950 to-black p-6 shadow-lg flex flex-col">
                <h3 className="text-xl font-semibold text-fuchsia-300 mb-2">Tier 2: Chapter-Level Sponsor</h3>
                <p className="text-gray-300 mb-4">
                  Increase visibility with ongoing brand presence and direct access to our active members.
                </p>
                <ul className="text-sm text-gray-400 space-y-1 mb-4">
                  <li>Presentation opportunity at an event</li>
                  <li>Logo on website, materials, and merchandise</li>
                  <li>Dedicated social media highlight</li>
                  <li>Access to member resume book</li>
                  <li>Discord channel access with alumni & actives</li>
                </ul>
                <p className="mt-auto font-semibold text-gray-200">Estimated Reach: 100–150 students & alumni</p>
                <p className="font-semibold text-gray-200">Cost: $300</p>
              </div>

              {/* Tier 3 */}
              <div className="rounded-xl border border-yellow-500 bg-gradient-to-br from-gray-900 via-yellow-900 to-black p-6 shadow-lg flex flex-col">
                <h3 className="text-xl font-semibold text-yellow-300 mb-2">Tier 3: Private Hackathon Sponsor</h3>
                <p className="text-gray-300 mb-4">
                  Sponsor our exclusive 24-hour hackathon to engage with highly-driven students solving real-world challenges.
                </p>
                <ul className="text-sm text-gray-400 space-y-1 mb-4">
                  <li>Event branding on banners and digital materials</li>
                  <li>Mentor, judge, or guest speaker opportunities</li>
                  <li>Sponsored challenge aligned with your mission</li>
                  <li>Access to resumes and project outcomes</li>
                  <li>Primary supporter recognition</li>
                </ul>
                <p className="mt-auto font-semibold text-gray-200">Estimated Reach: 50+ engaged students</p>
                <p className="font-semibold text-gray-200">Cost: $500</p>
              </div>
            </div>
          </section>

          {/* Why Sponsor */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">Why Sponsor KTP at UGA?</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-200">
              <li><strong>Connect with Top Talent:</strong> Direct access to UGA's most ambitious tech students across CS, MIS, DS, and Engineering.</li>
              <li><strong>Elevate Your Brand:</strong> Gain visibility through our website, events, merchandise, and social media.</li>
              <li><strong>Support Innovation and Growth:</strong> Fund hands-on workshops, hackathons, and mentorship programs.</li>
              <li><strong>Demonstrate Commitment:</strong> Showcase your investment in the next generation of technology professionals.</li>
            </ul>
          </section>
          {/* Contact */}
          <section className="text-center mt-12">
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">Contact Information</h2>
            <p className="text-gray-200 mb-4">To learn more or become a sponsor, reach out to:</p>
            <div className="space-y-2 text-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card name="Ryan Majd" title="President"  bio="" avatarSrc={ryan.src} fallbackInitials="RM" email="ryan.majd@uga.edu" otherUrl="https://ryanmajd.com/" />
            <Card name="Stephen Sulimani" title="VP of External Affairs" bio="" avatarSrc={stephen.src} fallbackInitials="SS" email="stephen.sulimani@uga.edu"/>
            <Card name="Manya Vikram" title="VP of Professional Dev" bio="" avatarSrc={manya.src} fallbackInitials="MV" email="manya.vikram@uga.edu" />
            </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}