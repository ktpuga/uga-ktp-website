'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { checkInToEvent } from '@/lib/portal-api';

function CenteredCard({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
    </div>
  );
}

export default function CheckInPage() {
  const { eventId, token } = useParams();
  const { status } = useSession();
  const [attempted, setAttempted] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [eventTitle, setEventTitle] = useState('');

  useEffect(() => {
    // Only fire once the client actually knows we're authenticated —
    // avoids handing this off to the server action's own auth redirect,
    // which would drop the eventId/token and land the member on their
    // portal home instead of completing the check-in.
    if (status !== 'authenticated' || attempted) return;
    setAttempted(true);

    checkInToEvent(eventId, token)
      .then((data) => {
        setResult('success');
        setEventTitle(data?.event?.title ?? '');
      })
      .catch((err) => {
        setResult('error');
        setMessage(err.message ?? 'Could not check you in.');
      });
  }, [status, attempted, eventId, token]);

  if (status === 'loading') {
    return (
      <CenteredCard>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
      </CenteredCard>
    );
  }

  if (status !== 'authenticated') {
    return (
      <CenteredCard>
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Sign in to check in</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          You need to be signed into the KTP portal for this to count. Sign in, then scan the code again.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Sign in
        </Link>
      </CenteredCard>
    );
  }

  if (!result) {
    return (
      <CenteredCard>
        <p className="text-sm text-slate-500 dark:text-slate-400">Checking you in...</p>
      </CenteredCard>
    );
  }

  if (result === 'success') {
    return (
      <CenteredCard>
        <CheckCircle2 className="h-12 w-12 text-green-600" />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">You&apos;re checked in!</h1>
        {eventTitle && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{eventTitle}</p>}
      </CenteredCard>
    );
  }

  return (
    <CenteredCard>
      <XCircle className="h-12 w-12 text-red-600" />
      <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Check-in failed</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
    </CenteredCard>
  );
}
