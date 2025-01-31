import Link from "next/link"
import React from "react"

function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        {/* You could swap the emoji for an illustration or your logo */}
        <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow">
          <span className="text-6xl animate-pulse">😿</span>
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-gray-800 sm:text-6xl">
          404
        </h1>
        <h2 className="mt-2 text-2xl font-semibold text-gray-700 sm:text-3xl">
          Page Not Found
        </h2>

        <p className="mt-4 max-w-md mx-auto text-gray-600">
          We&apos;re sorry, but the page you were looking for doesn&apos;t seem to exist. 
          It&apos;s possible the page has been moved or deleted, or you may have followed 
          an outdated link.
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
