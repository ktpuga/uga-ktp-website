'use client'
import CountdownTimer from "@/components/CountdownTimer"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { default as React, useEffect, useState } from 'react'
import gif from '../../public/cat_walking.gif'

export default function Page() {

    const now = new Date();
    const targetTime = new Date();
    targetTime.setDate(now.getDate() + 1); // Set to tomorrow
    targetTime.setHours(10, 0, 0, 0); // Set to 10:00 am
    const initialTimeLeft = targetTime.getTime() - now.getTime();
    const [timeLeft, setTimeLeft] = useState(initialTimeLeft);

    const [mobile, setMobile] = useState(false);
   useEffect(() => {
     // Update the mobile state based on window width
     const updateMobile = () => setMobile(window.innerWidth < 599);
 
     // Call once to set initial state based on current window width
     updateMobile();
 
     // Setup event listener for resizing the window
     window.addEventListener('resize', updateMobile);
 
     // Cleanup the event listener when the component unmounts
     return () => window.removeEventListener('resize', updateMobile);
   }, []);
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const calculatedTimeLeft = targetTime.getTime() - now.getTime();
            setTimeLeft(calculatedTimeLeft > 0 ? calculatedTimeLeft : 0); // Ensure no negative time
        };

        calculateTimeLeft(); // Initial calculation
        const timer = setInterval(calculateTimeLeft, 1000); // Update every second

        return () => clearInterval(timer); // Clear timer on component unmount
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
            <span className="ml-2 font-semibold text-lg">Phi Colony at UGA</span>
          }
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
        <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulsetransition-colors" href="/rush">
            Rush
          </Link>
          <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulse transition-colors" href="/#about">
            About
          </Link>
          
          <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulse transition-colors" href="/#leadership">
            Leadership
          </Link>
          <Link className="text-sm font-medium hover:text-black-900 hover:animate-pulse transition-colors" href="/hackathon">
            Hackathon
          </Link>
          <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulse transition-colors" href="/#contact">
            Contact
          </Link>
        </nav>
            </header>

            <main className="flex-1">
                <section className="bg-gray-800 mx-auto py-12 md:py-20 flex flex-col items-center justify-center">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="gap-6 md:gap-10 text-center">
                            <div className="space-y-4">
                                <h1 className="animate-fade-in-top text-3xl font-bold text-indigo-400 tracking-tighter md:text-4xl lg:text-5xl">
                                    KTP Hacks
                                </h1>
                                <p className="animate-pulse text-gray-300 md:text-xl">
                                    Private Hackathon Exclusively Available to Brothers
                                </p>

                                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                                    <Link href="https://uga-ktp-hackathon-f24.devpost.com/" target="_blank">
                                        <Button className="hover:animate-pulse bg-indigo-600 hover:bg-indigo-500 text-white">
                                            DevPost
                                        </Button>
                                    </Link>
                                </div>

                                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                                    <p className="text-gray-300 md:text-xl">
                                        Time Till Event:
                                    </p>
                                    <div className="text-gray-300 md:text-md">
                                        <CountdownTimer timeLeft={timeLeft} />
                                    </div>
                                    
                                </div>
                                <Image unoptimized width="400" height="50" className="mx-auto" src={gif.src}/>
                            </div>
                           
                        </div>
                    </div>

                </section>
               
            </main>
            <footer className="bg-gray-800 py-6 w-full text-gray-300">
                <div className="container mx-auto px-4 md:px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs">&copy; 2024 ΚΘΠ. All rights reserved.</p>
                    <nav className="flex gap-4 sm:gap-6">
                        <Link href="https://www.instagram.com/ugaktp/" target="_blank" className="text-xs hover:text-indigo-400 transition-colors">
                            Instagram
                        </Link>
                        <Link href="https://www.linkedin.com/company/kappa-theta-pi-uga/" target="_blank" className="text-xs hover:text-indigo-400 transition-colors">
                            LinkedIn
                        </Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
