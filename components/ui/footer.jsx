import Link from "next/link";
import React, { Component } from "react";

export class footer extends Component {
  render() {
    return (
      <footer className="bg-[#052039] w-full shrink-0 text-white">
        {/* Contact row */}
        <div className="border-b border-white/10 py-8">
          <div className="container mx-auto px-4 md:px-6 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-white/70">
              Join us for Rush and become part of the KTPhamily.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/ugaktp/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/kappa-theta-pi-uga/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                <LinkedinIcon className="h-5 w-5" />
              </a>
              <a
                href="mailto:uga.ktp@gmail.com"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                <MailIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5">
          <div className="container mx-auto px-4 md:px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/60 font-['Source Sans Pro']">
              &copy; {new Date().getFullYear()} Κappa Theta Pi. All rights reserved.
            </p>
            <nav className="flex gap-4 sm:gap-6">
              <Link
                href="/code-of-conduct"
                className="text-xs text-white/60 hover:text-white hover:underline underline-offset-4 font-['Source Sans Pro']"
                prefetch={false}
              >
                Code of Conduct
              </Link>
              <Link
                href="/blog"
                className="text-xs text-white/60 hover:text-white hover:underline underline-offset-4 font-['Source Sans Pro']"
                prefetch={false}
              >
                Blog
              </Link>
              <Link
                href="https://www.instagram.com/ugaktp/"
                target="_blank"
                className="text-xs text-white/60 hover:text-white hover:underline underline-offset-4 font-['Source Sans Pro']"
                prefetch={false}
              >
                Instagram
              </Link>
              <Link
                href="https://www.linkedin.com/company/kappa-theta-pi-uga/"
                target="_blank"
                className="text-xs text-white/60 hover:text-white hover:underline underline-offset-4 font-['Source Sans Pro']"
                prefetch={false}
              >
                LinkedIn
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    );
  }
}

export default footer;

function InstagramIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function MailIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
