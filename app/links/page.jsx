'use client'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import React from 'react'
import pfp from '../../public/whiteKTPpfp.jpg'
// import rushImg from '../../public/favicon.ico'

export default function Page() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#8e2de2] to-[#4a00e0] text-white">
      <div className="max-w-md w-full px-6 py-12 bg-[#1b1b1b] rounded-2xl shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-full w-24 h-24 overflow-hidden">
            <Image
            unoptimized
              src={pfp.src}
              width={96}
              height={96}
              alt="KTP Avatar Picture"
              className="w-full h-full object-cover"
              style={{objectFit: "cover" }}
            />
          </div>
          <h1 className="text-2xl font-bold">Kappa Theta Pi</h1>
          <p className="text-muted-foreground">Phi Colony (UGA)</p>
        </div>
        <div className="mt-8 space-y-4">
          
          <Link
            href="https://docs.google.com/forms/d/e/1FAIpQLSc9YMfAP56eMwP9QhjGOPgyTtJZBPLWkZhno1R6r5C4YxVK6g/viewform"
            className="inline-flex items-center justify-between w-full px-4 py-3 rounded-lg bg-[#2b2b2b] hover:bg-[#3b3b3b] transition-colors"
            prefetch={false}
          >
            <div className="flex items-center space-x-3">
              <FormIcon className="w-5 h-5" />
              <span>Rush Form</span>
            </div>
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
          <Link
            href="https://www.canva.com/design/DAGJiHhrIrE/oREZAJR6d7Uy4eXMjGAEWQ/edit?utm_content=DAGJiHhrIrE&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton"
            className="inline-flex items-center justify-between w-full px-4 py-3 rounded-lg bg-[#2b2b2b] hover:bg-[#3b3b3b] transition-colors"
            prefetch={false}
          >
            <div className="flex items-center space-x-3">
              <FormIcon className="w-5 h-5" />
              <span>Info Session Slides</span>
            </div>
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-between w-full px-4 py-3 rounded-lg bg-[#2b2b2b] hover:bg-[#3b3b3b] transition-colors"
            prefetch={false}
          >
            <div className="flex items-center space-x-3">
              <GlobeIcon className="w-5 h-5" />
              <span>To Website</span>
            </div>
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
          <Link
            href="https://www.linkedin.com/company/kappa-theta-pi-uga/"
            className="inline-flex items-center justify-between w-full px-4 py-3 rounded-lg bg-[#2b2b2b] hover:bg-[#3b3b3b] transition-colors"
            prefetch={false}
          >
            <div className="flex items-center space-x-3">
              <LinkedinIcon className="w-5 h-5" />
              <span>LinkedIn</span>
            </div>
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
          <Link
            href="https://github.com/ktpuga"
            className="inline-flex items-center justify-between w-full px-4 py-3 rounded-lg bg-[#2b2b2b] hover:bg-[#3b3b3b] transition-colors"
            prefetch={false}
          >
            <div className="flex items-center space-x-3">
              <GithubIcon className="w-5 h-5" />
              <span>GitHub</span>
            </div>
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
          <Link
            href="mailto:uga.ktp@gmail.com"
            className="inline-flex items-center justify-between w-full px-4 py-3 rounded-lg bg-[#2b2b2b] hover:bg-[#3b3b3b] transition-colors"
            prefetch={false}
          >
            <div className="flex items-center space-x-3">
              <MailIcon className="w-5 h-5" />
              <span>Email</span>
            </div>
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </main>
  )
}

function ArrowRightIcon(props) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
function GithubIcon(props) {
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
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S19 0.65 17 2.48a13.38 13.38 0 0 0-8 0C7 0.65 6.09 1 6.09 1A5.07 5.07 0 0 0 6 4.77 5.44 5.44 0 0 0 4.5 9.49c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.61V22" />
    </svg>
  );
}



// function GitlabIcon(props) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="m22 13.29-3.33-10a.42.42 0 0 0-.14-.18.38.38 0 0 0-.22-.11.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18l-2.26 6.67H8.32L6.1 3.26a.42.42 0 0 0-.1-.18.38.38 0 0 0-.26-.08.39.39 0 0 0-.23.07.42.42 0 0 0-.14.18L2 13.29a.74.74 0 0 0 .27.83L12 21l9.69-6.88a.71.71 0 0 0 .31-.83Z" />
//     </svg>
//   )
// }

function FormIcon(props) {
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="12" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  );
}

function GlobeIcon(props) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}


function LinkedinIcon(props) {
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
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
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


