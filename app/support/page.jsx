import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, CheckCircle2, ChevronRight, Clock3, ExternalLink, Mail, ShieldCheck } from 'lucide-react';
import SupportRequestForm from '@/components/support/SupportRequestForm';
import PublicHeader from '@/components/PublicHeader';

const SUPPORT_EMAIL = 'ugaktp@gmail.com';
const RESPONSE_TIME = '2-3 days';
const SUPPORT_HOURS = '10 AM-5 PM';
const LANGUAGES = 'English';
const DEVELOPER_NAME = 'Andrew Babatunde';
const LAST_UPDATED = '8/7/2026';
const YEAR = new Date().getFullYear();

const tocItems = [
  ['overview', 'Overview'],
  ['contact-support', 'Contact support'],
  ['troubleshooting', 'Common issues'],
  ['account-data', 'Account and data'],
  ['subscriptions', 'Subscriptions and payments'],
  ['privacy-legal', 'Privacy and legal'],
  ['safety-reporting', 'Safety and reporting'],
  ['accessibility', 'Accessibility'],
  ['availability', 'Service availability'],
  ['support-policy', 'Support policy'],
];

function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="mb-6 max-w-3xl">
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8a6200]">{eyebrow}</p>}
      <h2 className="text-2xl font-semibold tracking-tight text-[#052039] sm:text-3xl">{title}</h2>
      {children && <div className="mt-3 text-base leading-7 text-slate-600">{children}</div>}
    </div>
  );
}

function IssueList({ items }) {
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200">
      {items.map(([title, text]) => (
        <div key={title} className="grid gap-2 py-5 sm:grid-cols-[minmax(10rem,0.7fr)_1.5fr] sm:gap-8">
          <h3 className="text-base font-semibold text-[#052039]">{title}</h3>
          <p className="text-sm leading-6 text-slate-600">{text}</p>
        </div>
      ))}
    </div>
  );
}

function LinkList({ items }) {
  return (
    <ul className="space-y-3 text-sm leading-6 text-slate-600">
      {items.map(([title, text]) => (
        <li key={title} className="flex gap-3">
          <CheckCircle2 size={17} className="mt-1 shrink-0 text-[#8a6200]" aria-hidden="true" />
          <span><strong className="font-semibold text-slate-900">{title}:</strong> {text}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SupportPage() {
  const supportConfigured = !SUPPORT_EMAIL.includes('[');

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans text-slate-900">
      <PublicHeader tone="dark" />

      <main>
        <section className="border-b border-[#173a5a] bg-[#052039] text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-14 sm:px-8 lg:grid-cols-[1fr_22rem] lg:items-end lg:gap-16 lg:pb-20 lg:pt-20">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#f2c14e]">Public help center</p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">KTP App Support</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Clear, practical help for signing in, using the KTP app, reporting problems, and managing your account.
              </p>
            </div>
            <div className="border-l-2 border-[#f2c14e] pl-5 lg:mb-1">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">Need help now?</p>
              <p className="mt-2 break-words text-xl font-semibold text-white">{SUPPORT_EMAIL}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Expected response: {RESPONSE_TIME}</p>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16 lg:py-14">
          <aside className="lg:sticky lg:top-6 lg:h-fit" aria-label="Support page navigation">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-500">On this page</p>
            <nav className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-1">
              {tocItems.map(([id, label]) => (
                <a key={id} href={`#${id}`} className="group flex items-center gap-1.5 py-1 text-sm text-slate-600 transition hover:text-[#052039] focus:outline-none focus:ring-2 focus:ring-[#2a5cca] lg:py-1.5">
                  <ChevronRight size={14} className="text-slate-400 transition group-hover:text-[#8a6200]" aria-hidden="true" />
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            <section id="overview" className="scroll-mt-6 border-b border-slate-200 pb-12">
              <SectionHeading eyebrow="Start here" title="Overview">
                KTP Life is the KTP member app and portal for chapter communication and organization. It brings together member profiles and the directory, announcements, events, messages, shared photos and documents, polls, attendance, and committee information in one place.
              </SectionHeading>
              <div className="grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Intended for</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">Current chapter members, alumni, and pledges with an account created by chapter leadership.</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Current app version</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">Not provided in the current app metadata.</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Supported iOS versions</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">Not provided in the current app metadata.</p>
                </div>
              </div>
            </section>

            <section id="contact-support" className="scroll-mt-6 border-b border-slate-200 py-12">
              <SectionHeading eyebrow="Direct help" title="Contact support">
                Contact support when the troubleshooting steps below do not resolve the issue, or when you cannot access your account. Please include enough detail for the support team to reproduce the problem.
              </SectionHeading>
              <div className="mb-8 flex flex-col gap-4 border-l-4 border-[#f2c14e] bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Support email</p>
                  {supportConfigured ? (
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 inline-block break-all text-xl font-semibold text-[#052039] underline decoration-[#f2c14e] decoration-2 underline-offset-4 hover:text-[#2a5cca] focus:outline-none focus:ring-2 focus:ring-[#2a5cca]">{SUPPORT_EMAIL}</a>
                  ) : (
                    <p className="mt-1 break-all text-xl font-semibold text-[#052039]">{SUPPORT_EMAIL}</p>
                  )}
                </div>
                <p className="max-w-sm text-sm leading-6 text-slate-600">Expected response time: <strong className="text-slate-900">{RESPONSE_TIME}</strong></p>
              </div>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#052039]">Optional support form</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">This form prepares an email with the details support usually needs.</p>
                  </div>
                  <SupportRequestForm supportEmail={SUPPORT_EMAIL} />
                </div>
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Include these details</p>
                  <ul className="space-y-2 text-sm leading-6 text-slate-600">
                    <li>What you were trying to do</li>
                    <li>What happened instead</li>
                    <li>Steps to reproduce it</li>
                    <li>Device, iOS, and app versions</li>
                    <li>A screenshot, if it does not contain sensitive information</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="troubleshooting" className="scroll-mt-6 border-b border-slate-200 py-12">
              <SectionHeading eyebrow="Try these steps first" title="Common issues and troubleshooting" />
              <IssueList items={[
                ['App crashes or freezes', 'Force close the app, restart your device, and try again. Install any available app or iOS update. If the issue continues, report what you were doing immediately before the crash and include your device and version details.'],
                ['Login, signup, or password problems', 'Use the app sign-in flow and make sure you are using the account associated with KTP. If you cannot sign in or need account help, contact support. Do not send your password.'],
                ['Verification or account access', 'Access is tied to the account and membership information maintained by chapter leadership. Contact support if your account cannot be verified, your expected access is missing, or you cannot reach the sign-in flow.'],
                ['Missing, incorrect, or delayed content', 'Refresh the page or app, check your connection, and try again. If content is still missing or incorrect, report the specific item, where it appears, and what you expected to see.'],
                ['Notifications', 'Check that notifications are allowed for the KTP app in iOS Settings, confirm that your device is not in a mode that suppresses alerts, and reopen the app. Report the notification type and when it was expected.'],
                ['Connectivity or loading', 'Try a reliable Wi-Fi or cellular connection, then close and reopen the app. If other services work but KTP does not load, note the time and screen that failed when contacting support.'],
                ['Updating or reinstalling', 'Check the App Store for an available update. Reinstalling may require you to sign in again, so make sure you can access your account before removing the app.'],
                ['Reporting a bug', 'Describe the steps that reproduce the issue, the expected result, the actual result, and any visible error message. Include device, iOS, and app versions and attach a safe screenshot when useful.'],
              ]} />
            </section>

            <section id="account-data" className="scroll-mt-6 border-b border-slate-200 py-12">
              <SectionHeading eyebrow="Your information" title="Account and data requests">
                Use the app settings when the option is available. Contact support if you cannot sign in or if the request needs help from the team managing KTP accounts.
              </SectionHeading>
              <LinkList items={[
                ['Update account information', 'Open Settings in the app and edit the profile information available there.'],
                ['Access or correct data', `Email ${SUPPORT_EMAIL} with a clear description of the information you want to review or correct. Do not include passwords or authentication codes.`],
                ['Delete your account and associated data', 'Use the account deletion option in Settings when available, or contact support to request deletion if you cannot access the app. Shared content may be handled separately so that other members can continue to see the conversation or shared space it belongs to.'],
                ['Cannot access your account', `Contact ${SUPPORT_EMAIL} and explain what prevents access. Include your name and the account email, but do not send your password.`],
              ]} />
            </section>

            <section id="subscriptions" className="scroll-mt-6 border-b border-slate-200 py-12">
              <SectionHeading eyebrow="Apple purchases" title="Subscriptions and payments">
                Subscriptions and App Store purchases are processed by Apple, not by KTP support. KTP support cannot issue Apple refunds or resolve Apple billing disputes.
              </SectionHeading>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-[#052039]">Manage a subscription</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">On iPhone or iPad, open Settings, tap your name, then Subscriptions. Select the relevant subscription to change or cancel it.</p>
                </div>
                <div className="border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-[#052039]">Refunds and billing</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">For refunds or billing disputes, use Apple Support.</p>
                  <a href="https://support.apple.com/billing" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#2a5cca] underline underline-offset-4 hover:text-[#052039] focus:outline-none focus:ring-2 focus:ring-[#2a5cca]">Apple billing support <ExternalLink size={14} aria-hidden="true" /></a>
                </div>
              </div>
            </section>

            <section id="privacy-legal" className="scroll-mt-6 border-b border-slate-200 py-12">
              <SectionHeading eyebrow="Policies" title="Privacy and legal information">
                For privacy questions or legal concerns, contact the support address above. Include the relevant policy area and enough context to identify your question, without sending highly sensitive information.
              </SectionHeading>
              <div className="flex flex-col divide-y divide-slate-200 border-y border-slate-200">
                <Link href="/privacy" className="flex items-center justify-between gap-4 py-4 text-sm font-semibold text-[#2a5cca] underline underline-offset-4 hover:text-[#052039] focus:outline-none focus:ring-2 focus:ring-[#2a5cca]">Privacy Policy <ArrowUpRight size={16} aria-hidden="true" /></Link>
                <p className="flex items-center justify-between gap-4 py-4 text-sm text-slate-600">Terms of Use <span className="font-semibold text-slate-900">No public terms URL is currently available.</span></p>
                <Link href="/community-guidelines" className="flex items-center justify-between gap-4 py-4 text-sm font-semibold text-[#2a5cca] underline underline-offset-4 hover:text-[#052039] focus:outline-none focus:ring-2 focus:ring-[#2a5cca]">Community Guidelines / Safety Policy <ArrowUpRight size={16} aria-hidden="true" /></Link>
              </div>
            </section>

            <section id="safety-reporting" className="scroll-mt-6 border-b border-slate-200 py-12">
              <SectionHeading eyebrow="Community safety" title="Safety, abuse, and content reporting">
                The app includes user profiles, messaging, shared photos, and reporting controls. Use the report option on the relevant profile, message, or photo when it is available. Reports are reviewed by the team responsible for KTP community management.
              </SectionHeading>
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {['Abuse, harassment, or threats', 'Spam or scams', 'Inappropriate content', 'Impersonation', 'Copyright or other legal concerns'].map((item) => (
                  <div key={item} className="flex items-center gap-3 border-b border-slate-200 pb-3 text-sm text-slate-700">
                    <ShieldCheck size={17} className="shrink-0 text-[#8a6200]" aria-hidden="true" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-7 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
                <p className="text-sm leading-6 text-slate-600"><strong className="text-slate-900">Response:</strong> Reports are reviewed according to {RESPONSE_TIME}. Do not assume a report is monitored continuously.</p>
                <p className="flex items-start gap-2 text-sm leading-6 text-slate-600"><AlertTriangle size={17} className="mt-1 shrink-0 text-[#8a6200]" aria-hidden="true" /><span><strong className="text-slate-900">Emergency:</strong> The app is not a replacement for emergency services. If someone is in immediate danger, contact local emergency services.</span></p>
              </div>
            </section>

            <section id="accessibility" className="scroll-mt-6 border-b border-slate-200 py-12">
              <SectionHeading eyebrow="Inclusive access" title="Accessibility">
                The app supports the accessibility settings provided by iOS where the interface allows. To request accessibility assistance or report an accessibility problem, contact {SUPPORT_EMAIL} and describe the screen, control, or task that is difficult to use. Include your device and iOS version when possible.
              </SectionHeading>
            </section>

            <section id="availability" className="scroll-mt-6 border-b border-slate-200 py-12">
              <SectionHeading eyebrow="Service status" title="Service availability">
                Occasional maintenance, outages, network problems, or device compatibility issues may affect the app. No public status page is currently provided. If the service is unavailable, retry later and report the affected screen and approximate time to {SUPPORT_EMAIL}.
              </SectionHeading>
            </section>

            <section id="support-policy" className="scroll-mt-6 pt-12">
              <SectionHeading eyebrow="What to expect" title="Support policy" />
              <div className="grid gap-0 divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="py-5 sm:pr-7">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#052039]"><Clock3 size={16} className="text-[#8a6200]" aria-hidden="true" /> Support hours</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{SUPPORT_HOURS}</p>
                </div>
                <div className="py-5 sm:pl-7">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#052039]"><Mail size={16} className="text-[#8a6200]" aria-hidden="true" /> Supported languages</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{LANGUAGES}</p>
                </div>
              </div>
              <div className="mt-7 space-y-5 text-sm leading-6 text-slate-600">
                <p><strong className="text-slate-900">Expected response time:</strong> {RESPONSE_TIME}</p>
                <p><strong className="text-slate-900">Support can help with:</strong> app troubleshooting, account access, profile and data requests, content or safety reports, and accessibility concerns.</p>
                <p><strong className="text-slate-900">Support cannot help with:</strong> Apple refunds or billing disputes, emergency response, or recovering information that was never submitted to the app.</p>
                <p className="border-l-4 border-[#f2c14e] bg-white px-4 py-3 text-slate-700 shadow-sm"><strong className="text-slate-900">Privacy reminder:</strong> Never send passwords, payment card numbers, authentication codes, or other highly sensitive information through support.</p>
              </div>
            </section>

            <div className="mt-14 border-t-2 border-[#052039] pt-6 text-sm leading-6 text-slate-600">
              <p className="font-semibold text-[#052039]">App review and transparency</p>
              <p className="mt-2">This page is publicly viewable and does not require the app or an account. Product, policy, contact, and availability details should be updated when the underlying information changes.</p>
              <div className="mt-5 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-6">
                <span>{DEVELOPER_NAME}</span>
                <span>{SUPPORT_EMAIL}</span>
                <span>Copyright {YEAR}</span>
                <span>Last updated: {LAST_UPDATED}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
