'use client'
import Link from "next/link";
import { useEffect, useState } from "react";
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
        <div className="flex flex-col min-h-screen font-sans bg-gray-900 text-gray-100 scroll-smooth">
            <style jsx global>{`
              @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap');
              body {
                font-family: 'Source Sans Pro', sans-serif;
              }
            `}</style>

            <header className="sticky top-0 px-4 lg:px-6 h-16 flex items-center border-b border-gray-700 bg-gray-800/[.85] backdrop-blur z-50">
                <Link className="flex items-center justify-center" href="/">
                    <span className="font-bold text-2xl text-indigo-500">ΚΘΠ</span>
                    {!mobile &&
                        <span className="ml-2 font-semibold text-lg">Phi Chapter at UGA</span>
                    }
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulse transition-colors" href="/rush">
                        Rush
                    </Link>
                    <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulse transition-colors" href="/#about">
                        About
                    </Link>
                    <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulse transition-colors" href="/#leadership">
                        Leadership
                    </Link>
                    <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulse transition-colors" href="/hackathon">
                        Hackathon
                    </Link>
                    <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulse transition-colors" href="/#contact">
                        Contact
                    </Link>
                </nav>
            </header>

            <main className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-900 to-black opacity-70"></div>
                <div className="absolute inset-0 bg-cover bg-center opacity-20"></div>
                    {/* bg-[url('/background-pattern.svg')] */}
                <section className="relative z-10 mx-auto py-16 px-6 max-w-4xl text-center">
                    <h1 className="animate-fade-in-top text-4xl font-extrabold text-indigo-400 tracking-tight mb-6 md:text-5xl lg:text-6xl">
                        KTP Code of Conduct
                    </h1>
                    <div className=" animate-fade-in-top delay-100 bg-gray-800/80 rounded-lg shadow-lg p-8 md:p-12 text-left">
                        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Purpose</h2>
                        <p className="text-gray-300 mb-6">
                            The ΚΘΠ Code of Conduct establishes standards for professionalism, inclusivity, and respectful behavior to ensure a thriving and innovative environment for all Brothers and Affiliates.
                        </p>

                        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Scope</h2>
                        <p className="text-gray-300 mb-6">
                            This Code of Conduct applies to all ΚΘΠ activities, events, and digital interactions. Actives/Brothers, Alumni, and/or Affiliates representing ΚΘΠ in public are expected to uphold these values.
                        </p>

                        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Standards of Positive Behavior</h2>
                        <ul className="list-disc list-inside space-y-4 text-gray-300 mb-6">
                            <li>Promoting inclusivity and respect in all interactions.</li>
                            <li>Actively contributing to events and community initiatives.</li>
                            <li>Providing constructive feedback and mentorship.</li>
                            <li>Taking responsibility for mistakes and learning from them.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Examples of Unacceptable Behavior</h2>
                        <ul className="list-disc list-inside space-y-4 text-gray-300 mb-6">
                            <li>Harassment, bullying, or discriminatory language.</li>
                            <li>Sharing private fraternity information to an external third party without permission.</li>
                            <li>Inappropriate or unprofessional conduct in any setting.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Enforcement</h2>
                        <p className="text-gray-300 mb-6">
                            Violations of this Code of Conduct will be reviewed by the executive board. Disciplinary actions may include warnings, suspension from activities, or revocation of membership.
                        </p>

                        <h2 className="text-2xl font-bold text-indigo-400 mb-4">Reporting Violations</h2>
                        <p className="text-gray-300">
                            If you witness or experience a violation, report it to the ΚΘΠ executive board. All reports will be treated confidentially to protect the reporter's privacy.
                        </p>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
