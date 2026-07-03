'use client';

import { signIn } from 'next-auth/react';

export default function SignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn('authentik', { callbackUrl: '/auth/redirect' })}
      className="w-full bg-[#2A5CCA] hover:bg-[#3570DB] text-white font-semibold tracking-wider py-3 rounded-md uppercase transition-colors shadow-lg"
    >
      Sign in with KTP SSO
    </button>
  );
}
