'use client';

import { useEffect, useState } from 'react';
import { Ban, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlockedMembers, blockMember, unblockMember } from '@/lib/blocked-members';
import { isRedirectError } from '@/lib/is-redirect-error';

// Self-contained block/unblock toggle — reads its own state from the shared
// blocked-members store (see lib/blocked-members.js) so it can be dropped in
// anywhere a member is shown without prop-drilling status down from a parent,
// and without a fetch per instance.
//
// `iconOnly` renders it as a bare icon button sized to sit directly beside a
// ReportButton in a row of small controls (message bubbles, photo tiles).
// Everywhere blocking is the primary action of its own row, the default
// labelled button is the right one.
//
// Confirmation is a small inline overlay owned by this component, not the
// shared root-level useConfirm() dialog — this is very often rendered
// nested inside another full-screen modal (the directory profile view), and
// stacking a second independent z-50 overlay on top of that one is a real
// source of click/dismiss bugs. Matches how ReportButton handles its own
// dialog for the same reason.
export default function BlockButton({ userId, variant = 'outline', size = 'sm', className = '', iconOnly = false, onStatusChange }) {
  const { blockedMembers, loaded } = useBlockedMembers();
  const blocked = blockedMembers.some((m) => m.id === userId);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  // Parents use this to react to the state (the DM composer swaps itself for
  // a "you've blocked this member" notice). Fires on load and on every change,
  // including one made by a different button elsewhere on the page.
  useEffect(() => {
    if (loaded) onStatusChange?.(blocked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked, loaded]);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      if (blocked) {
        await unblockMember(userId);
      } else {
        await blockMember(userId);
      }
      setConfirming(false);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? (blocked ? 'Failed to unblock' : 'Failed to block'));
    } finally {
      setBusy(false);
    }
  }

  // The labelled button waits for the list so it never flips its own text from
  // "Block" to "Unblock" under the cursor. The icon variant does NOT wait: it
  // sits in a row of other small controls, and a control that shows up a beat
  // after its neighbours reads as "the button isn't there" — which is exactly
  // how it was reported. Worst case it shows the block icon for a fraction of
  // a second on someone already blocked, then swaps to the unblock check.
  if (!loaded && !iconOnly) return null;

  const label = blocked ? 'Unblock' : 'Block';
  const Icon = blocked ? CheckCircle2 : Ban;

  function openConfirm(e) {
    e.stopPropagation();
    setError(null);
    setConfirming(true);
  }

  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          onClick={openConfirm}
          title={`${label} this member`}
          aria-label={`${label} this member`}
          className={
            className ||
            `flex h-7 w-7 items-center justify-center rounded-full text-xs ${
              blocked
                ? 'text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/30'
                : 'text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400'
            }`
          }
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Button
          type="button"
          variant={variant}
          size={size}
          onClick={openConfirm}
          className={`gap-1.5 ${blocked ? 'text-green-700 hover:text-green-800' : 'text-red-600 hover:text-red-700'} ${className}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Button>
      )}

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
                {busy ? 'Working...' : label}
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
