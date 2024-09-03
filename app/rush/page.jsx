'use client'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import Link from "next/link"
import React from 'react'
import rushImg from '../../public/rush.png'
// import cliktp from '../public/CLIKTP.gif'


export default function Page() {
    return (
        (
        <div className="flex flex-col min-h-screen font-sans bg-white text-gray-900 scroll-smooth">
            <style jsx global>{`
              @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap');
              body {
                font-family: 'Source Sans Pro', sans-serif;
              }
            `}</style>
            <header className="sticky top-0 px-4 lg:px-6 h-16 flex items-center border-b border-gray-200 bg-white/[.3] backdrop-blur z-50">
              <Link className="flex items-center justify-center" href="/">
                <span className="font-bold text-2xl text-blue-600">ΚΘΠ</span>
            
                  <span className="ml-2 font-semibold text-lg">Phi Colony at UGA</span>
            
              
              </Link>
              <nav className="ml-auto flex gap-4 sm:gap-6">
              <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulsetransition-colors" href="/">
                  Home
                </Link>
                </nav>
                </header>
            <main className="flex-1">
            <section className="bg-[#F0F0F0] mx-auto py-12 md:py-20 flex flex-col items-center justify-center">
  <div className="container mx-auto px-4 md:px-6">
    <div className="gap-6 md:gap-10 text-center">
      <div className="space-y-4 animate-fade-in-right">
        <h1 className="hover:animate-bounce text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl font-['Source Sans Pro']">
          Fall 2024 Rush
        </h1>
        <p className="text-[#6B6B6B] md:text-xl font-['Source Sans Pro']">
          Our first week consists of 2 information sessions to tell you more about our mission. You only have to attend 1 of these; they will have the same information!
        </p>
        <Image src={rushImg} unoptimized className="mx-auto w-1/2" />
        <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
         
        </div>
      </div>
      <div className="flex items-center justify-center">
       
      </div>
    </div>
  </div>
</section>

              <section id="about" className="bg-[#E0E0E0] py-12 md:py-20">
                <div className="container mx-auto px-4 md:px-6">
                  <div className="container mx-auto text-center gap-6 md:gap-10">
                    <div className="flex items-center justify-center">
                    </div>
                    <div className="space-y-4 animate-fade-in-left">
                      <h2
                        className="text-3xl font-bold tracking-tighter md:text-4xl font-['Source Sans Pro']">
                            ΚΘΠ</h2>
                      <p className="text-[#6B6B6B] md:text-xl font-['Source Sans Pro']">
                        Our <Link className=" text-blue-500" href="https://forms.gle/RryVY362iana9ekU6" target="_blank">form</Link> for KTP Fall Rush 2024 (Required)
                      </p>
                      <p className="text-[#6B6B6B] md:text-xl font-['Source Sans Pro']">
                      Check out the <Link className=" text-blue-500" href="https://groupme.com/join_group/100592857/PWjF5nZz" target="_blank">GroupMe</Link> for instant updates on Rush
                      </p>
                      <p className="text-[#6B6B6B] md:text-xl font-['Source Sans Pro']">
                      Create a <Link className=" text-blue-500" href="https://epichire.com/clubs/125/invite?code=2qyrXs" target="_blank">EpicHire Account</Link> to join our Organization!
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            
             
            </main>
            <footer className="bg-[#052039] py-6 w-full shrink-0 text-white">
              <div
                className="container mx-auto px-4 md:px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-['Source Sans Pro']">&copy; 2024 ΚΘΠ. All rights reserved.</p>
                <nav className="flex gap-4 sm:gap-6">
                  {/* <Link
                    href="#"
                    className="text-xs hover:underline underline-offset-4 font-['Source Sans Pro']"
                    prefetch={false}>
                    Terms of Service
                  </Link> */}
                  {/* <Link
                    href="#"
                    className="text-xs hover:underline underline-offset-4 font-['Source Sans Pro']"
                    prefetch={false}>
                    Privacy Policy
                  </Link> */}
                  <Link
                    href="https://www.instagram.com/ugaktp/"
                    target="_Blank"
                    className="text-xs hover:underline underline-offset-4 font-['Source Sans Pro']"
                    prefetch={false}>
                    Instagram
                  </Link>
                  <Link
                    href="https://www.linkedin.com/company/kappa-theta-pi-uga/" target="_blank"
                    className="text-xs hover:underline underline-offset-4 font-['Source Sans Pro']"
                    prefetch={false}>
                    LinkedIn
                  </Link>
                </nav>
              </div>
            </footer>
          </div>)
        );
        
    
    
  }

  function InstagramIcon(props) {
    return (
      (<svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>)
    );
  }

  function LinkedinIcon(props) {
    return (
      (<svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path
          d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>)
    );
  }
  
  function GroupIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7V5c0-1.1.9-2 2-2h2" />
        <path d="M17 3h2c1.1 0 2 .9 2 2v2" />
        <path d="M21 17v2c0 1.1-.9 2-2 2h-2" />
        <path d="M7 21H5c-1.1 0-2-.9-2-2v-2" />
        <rect width="7" height="5" x="7" y="7" rx="1" />
        <rect width="7" height="5" x="10" y="12" rx="1" />
      </svg>
    )
  }

function MailIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    )
  }
  
  