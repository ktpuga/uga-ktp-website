'use client';

import { useEffect, useState } from 'react';
import { Ban, CircleCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBlockedUsers, blockUser, unblockUser } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';

// Self-contained block/unblock toggle — figures out the current state itself
// (there's no single "is X blocked" endpoint, only the full blocked list) so
// it can be dropped in anywhere a user is shown without prop-drilling status
// down from a parent that may not have fetched it.
//
// Confirmation is a small inline overlay owned by this component, not the
// shared root-level useConfirm() dialog — this is very often rendered
// nested inside another full-screen modal (the directory profile view), and
// stacking a second independent z-50 overlay on top of that one is a real
// source of click/dismiss bugs. Matches how ReportButton handles its own
// dialog for the same reason.
export default function BlockButton({ userId, variant = 'outline', size = 'sm', className = '' }) {
  const [blocked, setBlocked] = useState(null); // null while loading
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getBlockedUsers()
      .then((list) => {
        if (!cancelled) setBlocked(list.some((u) => u.id === userId));
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        if (!cancelled) setBlocked(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      if (blocked) {
        await unblockUser(userId);
        setBlocked(false);
      } else {
        await blockUser(userId);
        setBlocked(true);
      }
      setConfirming(false);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? (blocked ? 'Failed to unblock' : 'Failed to block'));
    } finally {
      setBusy(false);
    }
  }

  if (blocked === null) return null;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          setError(null);
          setConfirming(true);
        }}
        className={`gap-1.5 ${blocked ? 'text-green-700 hover:text-green-800' : 'text-red-600 hover:text-red-700'} ${className}`}
      >
        {blocked ? <CircleCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
        {blocked ? 'Unblock' : 'Block'}
      </Button>

      {confirming && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            e.stopPropagation();
            if (!busy) setConfirming(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-5 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-gray-900 dark:text-slate-100">
                {blocked ? 'Unblock this member?' : 'Block this member?'}
              </p>
              <button type="button" onClick={() => !busy && setConfirming(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {blocked
                ? "They'll be able to message you again."
                : "They won't be able to message you, and you won't see their messages in group chats."}
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                className={blocked ? '' : 'bg-red-700 hover:bg-red-800'}
                onClick={handleConfirm}
                disabled={busy}
              >
                {busy ? 'Working...' : blocked ? 'Unblock' : 'Block'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
