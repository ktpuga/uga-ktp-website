'use client';

import { useEffect, useState } from 'react';
import { Ban, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBlockedUsers, blockUser, unblockUser } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useConfirm } from '@/components/ui/confirm-dialog';

// Self-contained block/unblock toggle — figures out the current state itself
// (there's no single "is X blocked" endpoint, only the full blocked list) so
// it can be dropped in anywhere a user is shown without prop-drilling status
// down from a parent that may not have fetched it.
export default function BlockButton({ userId, variant = 'outline', size = 'sm', className = '' }) {
  const confirm = useConfirm();
  const [blocked, setBlocked] = useState(null); // null while loading
  const [busy, setBusy] = useState(false);

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

  async function handleToggle() {
    if (blocked) {
      if (!(await confirm('Unblock this member? They\'ll be able to message you again.'))) return;
      setBusy(true);
      try {
        await unblockUser(userId);
        setBlocked(false);
      } catch (err) {
        if (isRedirectError(err)) throw err;
        window.alert(err.message ?? 'Failed to unblock');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!(await confirm('Block this member? They won\'t be able to message you, and you won\'t see their messages in group chats.'))) return;
    setBusy(true);
    try {
      await blockUser(userId);
      setBlocked(true);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to block');
    } finally {
      setBusy(false);
    }
  }

  if (blocked === null) return null;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={busy}
      className={`gap-1.5 ${blocked ? 'text-green-700 hover:text-green-800' : 'text-red-600 hover:text-red-700'} ${className}`}
    >
      {blocked ? <CircleCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
      {blocked ? 'Unblock' : 'Block'}
    </Button>
  );
}
