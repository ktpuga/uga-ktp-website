'use client'
import Link from "next/link";
import React, { useEffect, useState } from 'react';
import Footer from '../../components/ui/footer';

export default function Page() {
    const [mobile, setMobile] = useState(false);
    useEffect(() => {
        const updateMobile = () => setMobile(window.innerWidth < 599);
        updateMobile();
        window.addEventListener('resize', updateMobile);
        return () => window.removeEventListener('resize', updateMobile);
    }, []);

    return (
<div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-gray-950 via-slate-900 to-black text-gray-100 scroll-smooth overflow-hidden">            <header className="sticky top-0 px-4 lg:px-6 h-16 flex items-center border-b border-indigo-900 bg-black/70 backdrop-blur-md z-50 shadow-lg">
                <Link className="flex items-center justify-center" href="/">
                    <span className="font-bold text-2xl bg-gradient-to-tr from-indigo-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">ΚΘΠ</span>
                    {!mobile &&
                        <span className="ml-2 font-semibold text-lg text-indigo-200">Phi Chapter at UGA</span>
                    }
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:text-cyan-400 hover:underline transition-colors" href="/rush">
                        Rush
                    </Link>
                    <Link className="text-sm font-medium hover:text-cyan-400 hover:underline transition-colors" href="/#about">
                        About
                    </Link>
                    <Link className="text-sm font-medium hover:text-cyan-400 hover:underline transition-colors" href="/#leadership">
                        Leadership
                    </Link>
                    <Link className="text-sm font-medium hover:text-cyan-400 hover:underline transition-colors" href="/hackathon">
                        Hackathon
                    </Link>
                    <Link className="text-sm font-medium hover:text-cyan-400 hover:underline transition-colors" href="/#contact">
                        Contact
                    </Link>
                </nav>
            </header>

            <main className="flex-1 min-h-screen relative overflow-hidden">
                {/* Subtle animated background */}
                <div className="pointer-events-none absolute inset-0 -z-10 animate-pulse [background-image:radial-gradient(#6366f1_1px,transparent_1px)] [background-size:6px_6px] opacity-10" />
                <div className="absolute inset-0 -z-20">
                  <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-700 via-fuchsia-700 to-cyan-700 opacity-30 blur-[120px]" />
                  <div className="absolute -bottom-32 right-0 h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-cyan-700 via-fuchsia-700 to-indigo-700 opacity-20 blur-[100px]" />
                </div>
                <section className="relative z-10 mx-auto py-16 px-6 max-w-4xl text-center">
                    <h1 className="animate-fade-in-top text-4xl font-extrabold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent tracking-tight mb-6 md:text-5xl lg:text-6xl drop-shadow-lg">
                        KTP Code of Conduct
                    </h1>
                    {/* Core Values Section */}
                    <div className="mb-8 flex flex-col md:flex-row gap-6 justify-center">
                      <div className="flex-1 rounded-2xl bg-black/60 backdrop-blur-lg p-6 shadow-lg border border-indigo-900">
                        <h2 className="text-xl font-bold text-indigo-300 mb-2">Core Values</h2>
                        <ul className="list-disc list-inside text-left text-indigo-100 space-y-2">
                          <li>Integrity &amp; Accountability</li>
                          <li>Inclusivity &amp; Respect</li>
                          <li>Professionalism &amp; Growth</li>
                          <li>Collaboration &amp; Support</li>
                        </ul>
                      </div>
                      <div className="flex-1 rounded-2xl bg-black/60 backdrop-blur-lg p-6 shadow-lg border border-indigo-900">
                        <h2 className="text-xl font-bold text-indigo-300 mb-2">Confidential Reporting</h2>
                        <p className="text-indigo-100 text-left">All reports of violations are handled with strict confidentiality. Retaliation against reporters is strictly prohibited. Anonymous reporting is available upon a membership authentication process.</p>
                      </div>
                    </div>
                    <div className="animate-fade-in-top delay-100 bg-gradient-to-br from-slate-900/80 via-indigo-900/80 to-black/80 rounded-2xl shadow-2xl p-8 md:p-12 text-left border border-indigo-900">
                        <h2 className="text-2xl font-bold text-indigo-300 mb-4">Purpose</h2>
                        <p className="text-indigo-100 mb-6">
                            The ΚΘΠ Code of Conduct establishes standards for professionalism, inclusivity, and respectful behavior to ensure a thriving and innovative environment for all Brothers and Affiliates.
                        </p>

                        <h2 className="text-2xl font-bold text-indigo-300 mb-4">Scope</h2>
                        <p className="text-indigo-100 mb-6">
                            This Code of Conduct applies to all ΚΘΠ activities, events, and digital interactions. Actives/Brothers, Alumni, and/or Affiliates representing ΚΘΠ in public are expected to uphold these values.
                        </p>

                        <h2 className="text-2xl font-bold text-indigo-300 mb-4">Standards of Positive Behavior</h2>
                        <ul className="list-disc list-inside space-y-4 text-indigo-100 mb-6 pl-4">
                            <li>Promoting inclusivity and respect in all interactions.</li>
                            <li>Actively contributing to events and community initiatives.</li>
                            <li>Providing constructive feedback and mentorship.</li>
                            <li>Taking responsibility for mistakes and learning from them.</li>
                            <li>Upholding the reputation of ΚΘΠ and the tech community.</li>
                            <li>Supporting the success and well-being of all members, regardless of background or identity.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-indigo-300 mb-4">Examples of Unacceptable Behavior</h2>
                        <ul className="list-disc list-inside space-y-4 text-fuchsia-200 mb-6 pl-4">
                            <li>Harassment, bullying, or discriminatory language.</li>
                            <li>Sharing private fraternity information to an external third party without permission.</li>
                            <li>Inappropriate or unprofessional conduct in any setting.</li>
                            <li>Retaliation against individuals who report violations.</li>
                            <li>Plagiarism or misrepresentation of work in professional or academic settings.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-indigo-300 mb-4">Enforcement</h2>
                        <p className="text-indigo-100 mb-6">
                            Violations of this Code of Conduct will be reviewed by the executive board. Disciplinary actions may include warnings, suspension from activities, or revocation of membership.
                        </p>

                        <h2 className="text-2xl font-bold text-indigo-300 mb-4">Reporting Violations</h2>
                        <p className="text-indigo-100">
                            If you witness or experience a violation, report it to <strong>any ΚΘΠ executive board member</strong>. All reports will be treated confidentially to protect the reporter&apos;s privacy.
                        </p>
                    </div>
                </section>
            </main>
            <Footer/>
        </div>
    )
}
