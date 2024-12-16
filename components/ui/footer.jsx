import Link from 'next/link'
import React, { Component } from 'react'
export class footer extends Component {
  render() {
    return (
        <footer className="bg-[#052039] py-6 w-full shrink-0 text-white">
        <div
          className="container mx-auto px-4 md:px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-['Source Sans Pro']">&copy; 2024 ΚΘΠ. All rights reserved.</p>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="/code-of-conduct"
              className="text-xs hover:underline underline-offset-4 font-['Source Sans Pro']"
              prefetch={false}>
              Code of Conduct
            </Link>
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
    )
  }
}

export default footer