'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/'); // Redirect to home after login
    }
  }, [session, router]);

  if (status === 'loading') return <div>Loading...</div>;

  if (session) return <div>Redirecting...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to UGA KTP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access member-only content
          </p>
        </div>
        <div>
          <button
            onClick={() => signIn('auth0')}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}