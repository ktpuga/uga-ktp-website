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

export default function PrivacyPolicyPage() {
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
        <h1 className="mb-2 text-3xl font-extrabold text-white sm:text-4xl">Privacy Policy</h1>
        <p className="mb-8 text-sm text-indigo-300">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <p className="mb-8 text-sm leading-relaxed text-indigo-100 sm:text-base">
          This policy covers the KTP Life app and the ugaktp.com member portal (together, "the app"), operated by
          the Phi Chapter of Kappa Theta Pi at the University of Georgia. The app is only available to current
          chapter members, alumni, and pledges with an account created by chapter leadership.
        </p>

        <Section title="What we collect">
          <ul className="list-disc space-y-1 pl-5">
            <li>Profile information: name, preferred name, email, phone, major, graduation year, pledge class</li>
            <li>Your membership group (active, pledge, alumni, chair, or eboard) and committee memberships</li>
            <li>Messages you send — direct messages and group chats, including any photos or files you attach</li>
            <li>Photos and videos you upload to shared albums or the public gallery</li>
            <li>Documents you upload to the shared document library</li>
            <li>Poll votes, event RSVPs, and reports you submit</li>
            <li>A unique member ID and login identifier from our authentication system (see below)</li>
          </ul>
        </Section>

        <Section title="How you sign in">
          <p>
            The app does not store your password. Sign-in goes through Authentik, an identity system the chapter
            runs on its own server. Authentik issues a secure token that the app uses to verify who you are on each
            request.
          </p>
        </Section>

        <Section title="Why we collect it">
          <p>
            Every field above exists to run a specific feature — the directory needs your name and major, messaging
            needs a place to store messages, the calendar needs RSVPs, and so on. We don't collect anything beyond
            what a given feature needs to work.
          </p>
        </Section>

        <Section title="Who can see it">
          <p>
            Other members can see what's normally visible in a chapter directory and shared spaces — your name,
            major, graduation year, and anything you post in shared channels, subject to whatever audience you or
            eboard target it to. Direct messages are only visible to the people in that conversation. Chapter
            leadership (eboard) can additionally see membership records, review reports, and manage accounts as
            part of running the chapter.
          </p>
        </Section>

        <Section title="Sharing with third parties">
          <p>
            We don't sell or share your data with advertisers, and we don't use third-party analytics or tracking
            SDKs in the app. The backend, authentication, and photo storage are all self-hosted on the chapter's
            own server rather than run through outside companies. The only outside party involved is Apple, for
            distributing the app itself.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep your information for as long as you're a member (active or alumni) with an account. If you
            delete your account from Settings, your personal information is removed and your account is
            de-identified; content you're part of (messages, shared photos) stays in place for other members
            rather than being deleted out from under a conversation, but is no longer tied to your name.
          </p>
        </Section>

        <Section title="Your choices">
          <ul className="list-disc space-y-1 pl-5">
            <li>Update or correct your info anytime from Settings</li>
            <li>Block another member from messaging you, from Settings or their profile</li>
            <li>Report content or a member for eboard to review</li>
            <li>Delete your account from Settings — this is self-service and takes effect immediately</li>
          </ul>
        </Section>

        <Section title="Questions">
          <p>
            For privacy questions or concerns, contact chapter leadership at{' '}
            <a href="mailto:uga.ktp@gmail.com" className="text-cyan-400 hover:underline">uga.ktp@gmail.com</a>
            {' '}— confirm this is the right address to publish before relying on it.
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
