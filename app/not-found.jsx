import Link from "next/link"
import React from "react"

function NotFound() {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-black px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-400 opacity-40 blur-[140px] animate-pulse" />
        <div className="absolute -bottom-28 right-0 h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-cyan-500 via-fuchsia-500 to-indigo-500 opacity-30 blur-[120px] animate-pulse" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-md rounded-2xl bg-black/70 backdrop-blur-lg p-10 shadow-2xl border border-indigo-900 text-center">
        {/* Animated emoji */}
        <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-fuchsia-500 via-cyan-400 to-indigo-500 shadow-lg animate-bounce">
          <span className="text-6xl drop-shadow-neon">😿</span>
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-neon mb-2">
          404
        </h1>
        <h2 className="mt-2 text-2xl font-semibold text-fuchsia-300 sm:text-3xl">
          Page Not Found
        </h2>
        <p className="mt-4 max-w-md mx-auto text-indigo-200">
          We&apos;re sorry, but the page you were looking for doesn&apos;t seem to exist. 
          It&apos;s possible the page has been moved or deleted, or you may have followed 
          an outdated link.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-gradient-to-tr from-fuchsia-500 via-cyan-400 to-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:ring-offset-2"
            prefetch={false}
          >
            Take me back home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
