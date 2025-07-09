import Link from 'next/link';

export default function SponsorshipPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-gray-950 via-indigo-950 to-black text-gray-100 overflow-hidden">
      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-indigo-900 bg-black/70 backdrop-blur-md px-4 lg:px-6 shadow-lg">
        <Link href="/" className="flex items-center font-bold text-cyan-400 drop-shadow-neon">
          <span className="text-2xl md:text-3xl tracking-tight bg-gradient-to-tr from-indigo-400 via-cyan-400 to-fuchsia-500 bg-clip-text text-transparent animate-pulse">ΚΘΠ</span>
          <span className="ml-2 hidden text-sm font-semibold text-fuchsia-300 sm:inline">| Sponsorship</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-fuchsia-400">
            Home
          </Link>
        </nav>
      </header>

      {/* ---------- MAIN ---------- */}
      <main className="relative flex-1 overflow-hidden">
        {/* Neon grid and glowing blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 animate-pulse [background-image:radial-gradient(#00fff7_1px,transparent_1px)] [background-size:6px_6px] opacity-10" />
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -left-32 top-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-400 opacity-40 blur-[140px] animate-pulse" />
          <div className="absolute -bottom-28 right-0 h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-cyan-500 via-fuchsia-500 to-indigo-500 opacity-30 blur-[120px] animate-pulse" />
        </div>

        <section className="relative z-10 mx-auto max-w-3xl px-6 py-16 md:py-24 bg-black/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-indigo-900">
          {/* Intro */}
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-neon text-center">
            Kappa Theta Pi Sponsorship Packet
          </h1>
          <p className="mb-8 text-lg text-fuchsia-200 text-center">
            Partner with the nation’s premier professional technology fraternity at the University of Georgia.
          </p>

          {/* About Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">About Us</h2>
            <p className="text-gray-200">
              Kappa Theta Pi (ΚΘΠ) is UGA’s foremost co-ed professional technology fraternity, dedicated to fostering the next generation of tech leaders. Our members are passionate, driven, and actively involved in the campus and tech community.
            </p>
          </section>

          {/* Our Impact & Stats */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">Our Impact & Stats</h2>
            <div className="grid gap-6 md:grid-cols-3 mb-4">
              {/* Employment Rate */}
              <div className="rounded-xl border border-cyan-700 bg-gradient-to-br from-gray-900 via-cyan-950 to-black p-6 shadow-lg flex flex-col items-center">
                <span className="text-3xl font-extrabold text-cyan-300 mb-2">73.68%</span>
                <span className="text-lg text-gray-200 font-semibold mb-1">Members Employed</span>
                <span className="text-sm text-gray-400">28 members received at least 1 job/internship offer for Summer 2025</span>
              </div>
              {/* Total Summer Salaries */}
              <div className="rounded-xl border border-fuchsia-700 bg-gradient-to-br from-gray-900 via-fuchsia-950 to-black p-6 shadow-lg flex flex-col items-center">
                <span className="text-3xl font-extrabold text-fuchsia-300 mb-2">$250,000</span>
                <span className="text-lg text-gray-200 font-semibold mb-1">Total Summer '25 Salaries/Wages</span>
                <span className="text-sm text-gray-400">Estimated organization-wide earnings for Summer 2025</span>
              </div>
              {/* Aggregate Market Cap/Assets/Revenue */}
              <div className="rounded-xl border border-yellow-500 bg-gradient-to-br from-gray-900 via-yellow-900 to-black p-6 shadow-lg flex flex-col items-center">
                <span className="text-3xl font-extrabold text-yellow-300 mb-2">$10.05T</span>
                <span className="text-lg text-gray-200 font-semibold mb-1">Aggregate Market Cap, Assets & Revenue</span>
                <span className="text-sm text-gray-400">Grand total of all figures above (illustrative)</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              (All dollars U.S.; public-company caps are closing prices 23 May 2025. These numbers describe very different financial concepts—market value, assets, revenues, budgets—so the aggregate is purely illustrative.)
            </p>
          </section>

          {/* Value Proposition */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">Why Sponsor Us?</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-200">
              <li>Direct access to top student talent in technology and business.</li>
              <li>Brand exposure at campus events, workshops, and hackathons.</li>
              <li>Opportunities for company presentations, recruiting, and networking.</li>
              <li>Support diversity, leadership, and innovation in tech at UGA.</li>
            </ul>
          </section>

          {/* Sponsorship Tiers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-indigo-400 mb-6">Sponsorship Tiers</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Bronze */}
              <div className="rounded-xl border border-indigo-800 bg-gradient-to-br from-gray-900 via-indigo-950 to-black p-6 shadow-lg flex flex-col items-center">
                <h3 className="text-xl font-semibold text-cyan-300 mb-2">Bronze</h3>
                <p className="text-gray-300 mb-4">$250</p>
                <ul className="text-sm text-gray-400 space-y-1 mb-4">
                  <li>Logo on website</li>
                  <li>Social media mention</li>
                  <li>Host a workshop or info session</li>
                </ul>
              </div>
              {/* Silver */}
              <div className="rounded-xl border-2 border-fuchsia-500 bg-gradient-to-br from-gray-900 via-fuchsia-950 to-black p-6 shadow-xl flex flex-col items-center scale-105">
                <h3 className="text-xl font-semibold text-fuchsia-300 mb-2">Silver</h3>
                <p className="text-gray-300 mb-4">$500</p>
                <ul className="text-sm text-gray-400 space-y-1 mb-4">
                  <li>All Bronze benefits</li>
                  <li>Company spotlight at major events</li>
                  <li>Resume book access</li>
                  <li>Priority scheduling for workshops/info sessions</li>
                </ul>
              </div>
              {/* Gold */}
              <div className="rounded-xl border border-yellow-400 bg-gradient-to-br from-gray-900 via-yellow-900 to-black p-6 shadow-lg flex flex-col items-center">
                <h3 className="text-xl font-semibold text-yellow-300 mb-2">Gold</h3>
                <p className="text-gray-300 mb-4">$1000+</p>
                <ul className="text-sm text-gray-400 space-y-1 mb-4">
                  <li>All Silver benefits</li>
                  <li>Host <span className="font-bold text-yellow-200">unlimited</span> workshops/info sessions</li>
                  <li className="font-bold text-yellow-200">Curated Talent Portfolio</li>
                  <li className="font-bold text-yellow-200">Direct access to Exec Board Members</li>
                  <li className="font-bold text-yellow-200">Exclusive dinner with the Exec Board</li>
                  <li>Premium logo placement</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Workshops and info sessions can be held <span className="font-semibold text-cyan-300">online</span> or <span className="font-semibold text-fuchsia-300">in person</span> to best fit your needs.</p>
          </section>

          {/* Contact Section */}
          <section className="text-center mt-12">
            <h2 className="text-2xl font-bold text-indigo-400 mb-2">Ready to Partner?</h2>
            <p className="mb-4 text-gray-200">Contact us to discuss sponsorship opportunities, custom packages, or to request our full sponsorship packet PDF.</p>
            <a
              href="mailto:ktp.uga@gmail.com"
              className="inline-block rounded-lg bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-indigo-500 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:scale-105 transition-transform"
            >
              Email Us
            </a>
          </section>
        </section>
      </main>
    </div>
  );
} 