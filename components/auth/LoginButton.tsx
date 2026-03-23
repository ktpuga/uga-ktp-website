'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;

  if (session) {
    return (
      <div className="flex items-center space-x-4">
        <span>Welcome, {session.user?.name}</span>
        <button onClick={() => signOut()} className="text-blue-600 hover:text-blue-800">
          Logout
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => signIn('auth0')} className="text-blue-600 hover:text-blue-800">
      Login
    </button>
  );
}