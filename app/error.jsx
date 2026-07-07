'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md text-center">
        <Image
          src="/KTP PHI CHAPTER.svg"
          alt="Kappa Theta Pi — Phi Chapter"
          width={120}
          height={62}
          className="mx-auto mb-6 h-auto w-28"
        />
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-slate-600 mb-8">
          An unexpected error occurred. This sometimes happens if your session has ended — try signing in again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-md bg-slate-200 text-slate-800 text-sm font-medium hover:bg-slate-300 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/login"
            className="px-4 py-2 rounded-md bg-blue-900 text-white text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Sign in again
          </Link>
        </div>
        {error?.digest && (
          <p className="mt-6 text-xs text-slate-400">Error reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
