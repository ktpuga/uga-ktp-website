'use client';

import Link from 'next/link';
import Footer from '@/components/ui/footer';

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-xl font-bold text-indigo-300">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-indigo-100 sm:text-base">{children}</div>
    </section>
  );
}

export default function CommunityGuidelinesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-950 via-slate-900 to-black font-sans text-gray-100">
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-indigo-900 bg-black/70 px-4 backdrop-blur-md lg:px-6">
        <Link className="flex items-center justify-center" href="/">
          <span className="bg-gradient-to-tr from-indigo-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent">ΚΘΠ</span>
          <span className="ml-2 hidden text-lg font-semibold text-indigo-200 sm:inline">Phi Chapter at UGA</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fuchsia-400">Draft — pending leadership review</p>
        <h1 className="mb-2 text-3xl font-extrabold text-white sm:text-4xl">Community Guidelines</h1>
        <p className="mb-8 text-sm text-indigo-300">
          These apply to everything you post or send in KTP Life — direct messages, group chats, photos, polls, and
          the directory. They're about how we treat each other in the app; for the chapter's broader values, see the{' '}
          <Link href="/code-of-conduct" className="text-cyan-400 hover:underline">Code of Conduct</Link>.
        </p>

        <Section title="The basics">
          <ul className="list-disc space-y-1 pl-5">
            <li>Treat other members with respect. No harassment, bullying, hate speech, or threats.</li>
            <li>Don't share someone else's messages, photos, or personal info without their OK.</li>
            <li>No spam, and no using the app to promote something unrelated to the chapter without asking eboard first.</li>
            <li>Keep photos and messages appropriate for a chapter-wide audience — assume anything you post could be seen by anyone in the app.</li>
            <li>Don't impersonate another member or eboard.</li>
          </ul>
        </Section>

        <Section title="If someone's bothering you">
          <p>
            You can block anyone from your Settings or their profile — they won't be able to message you, and
            you won't see their messages in shared group chats anymore. Blocking is immediate and doesn't require
            anyone's approval.
          </p>
        </Section>

        <Section title="Reporting">
          <p>
            Every message, photo, and profile has a report option. Reporting sends it to eboard's review queue with
            whatever reason and details you provide. Reports are reviewed by eboard, not by the person you're
            reporting, and you'll never be identified to the person you reported.
          </p>
        </Section>

        <Section title="What happens after a report">
          <p>
            Eboard reviews each report and decides what to do based on what actually happened — that can range from
            no action, to a conversation with the person involved, to removing content or restricting someone's
            access to the app. Consequences follow the chapter's normal standards process, not something this app
            automates on its own.
          </p>
        </Section>

        <Section title="Questions or something urgent">
          <p>
            For anything that needs immediate attention rather than waiting on the report queue, contact chapter
            leadership directly at{' '}
            <a href="mailto:postmaster@ugaktp.com" className="text-cyan-400 hover:underline">postmaster@ugaktp.com</a>
            {' '}— confirm this is the right contact before publishing.
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
