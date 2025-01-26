'use client'
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useState } from 'react'
import Footer from '../../components/ui/footer'
import gif from '../../public/cat_walking.gif'
import ktpHacks from '../../public/ktpHacks1.jpeg'
export default function Page() {

    const [mobile, setMobile] = useState(false);
    const [gibberish, setGibberish] = useState("§k'rbuiafbvciu@R*(FH");

    useEffect(() => {
        const updateMobile = () => setMobile(window.innerWidth < 599);
        updateMobile();
        window.addEventListener('resize', updateMobile);

        // Update gibberish with random symbols every 50ms
        const gibberishInterval = setInterval(() => {
            const symbols = "!@#$%^&*()_+[]{}|;:',.<>?`~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            const newGibberish = Array.from({ length: 18 }, () =>
                symbols.charAt(Math.floor(Math.random() * symbols.length))
            ).join('');
            setGibberish(newGibberish);
        }, 50);

        return () => {
            window.removeEventListener('resize', updateMobile);
            clearInterval(gibberishInterval);
        };
    }, []);

    return (
        <div className="flex flex-col min-h-screen font-sans bg-gray-900 text-gray-100 scroll-smooth">
            <header className="sticky top-0 px-4 lg:px-6 h-16 flex items-center border-b border-gray-700 bg-gray-800/[.85] backdrop-blur-sm z-50">
                <Link className="flex items-center justify-center" href="/">
                    <span className="font-bold text-2xl text-indigo-500">ΚΘΠ</span>
                    {!mobile && <span className="ml-2 font-semibold text-lg">Phi Chapter at UGA</span>}
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
                <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-indigo-900 to-black opacity-70"></div>
                <div className="absolute inset-0 bg-cover bg-center opacity-20"></div> 
                {/* bg-[url('/background-pattern.svg')] */}

                <section className="animate-fade-in-top relative z-10 mx-auto py-16 px-6 max-w-4xl text-center">
  <h1 className=" text-4xl font-extrabold text-indigo-400 tracking-tight mb-6 md:text-5xl lg:text-6xl">
    KTP Hacks
  </h1>
  <p className=" text-gray-300 text-lg max-w-2xl mx-auto mb-6">
  KTP Hacks is a private hackathon designed exclusively for brothers to showcase their innovation and creativity.
  </p>
  <p className=" text-gray-400 text-sm max-w-2xl mx-auto mb-2">KTP Hacks does not take place during Spring semesters, as <Link target="_Blank" href="https://ugahacks.com" className="font-bold text-indigo-400">UGAHacks</Link> hosts the flagship hackathon during this time.</p>
  <div className="bg-gray-800/80 rounded-2xl shadow-2xl p-8 md:p-12">
    <div className="space-y-8">
      <div className="flex flex-wrap justify-center gap-4">
        <Image
          unoptimized
          width={200}
          height={200}
          alt="KTP Hacks Picture"
          src="/ktpHacks1.jpeg"
          className="rounded-lg shadow-md transition-transform hover:scale-105"
        />
        <Image
          unoptimized
          width={200}
          height={200}
          alt="KTP Hacks Picture 2"
          src="/ktpHacks2.jpeg"
          className="rounded-lg shadow-md transition-transform hover:scale-105"
        />
        <Image
          unoptimized
          width={200}
          height={200}
          alt="KTP Hacks Picture 3"
          src="/ktpHacks3.jpeg"
          className="rounded-lg shadow-md transition-transform hover:scale-105"
        />
      </div>
      <Link href="https://uga-ktp-hackathon-f24.devpost.com/" target="_blank">
        <Button className="hover:animate-pulse bg-indigo-600 hover:bg-indigo-500 text-white text-lg px-6 py-3 rounded-lg shadow-lg">
          Last Year&rsquo;s DevPost Link
        </Button>
      </Link>
    </div>
  </div>
</section>

            </main>
            <Footer />
        </div>
    );
}
