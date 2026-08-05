'use client';

import { useEffect, useState } from 'react';
import { getBlockedUsers, blockUser, unblockUser } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';

// One shared copy of "who have I blocked" for the whole client session.
//
// Every BlockButton used to fetch the whole blocked list itself on mount,
// which was fine when a page had one or two of them. Now that a block control
// sits next to every report control — every message bubble, every photo tile —
// that would be a server-action round trip per control. Here it is one request
// per session no matter how many buttons mount, and a block/unblock anywhere
// updates every mounted control plus the Settings list at once, with no
// refetch and no page refresh.
//
// There is no "is X blocked" endpoint, only the full list, which is what makes
// a shared cache the natural shape: each button just asks whether its own id
// is in it.

let cache = null; // the list, or null until the first successful load
let inflight = null; // in-flight load, so simultaneous mounts share one request
const listeners = new Set();

function publish(list) {
  cache = list;
  for (const listener of listeners) listener(list);
}

function load() {
  if (!inflight) {
    inflight = getBlockedUsers()
      .then((list) => {
        publish(Array.isArray(list) ? list : []);
        return cache;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

async function reload() {
  const list = await getBlockedUsers();
  publish(Array.isArray(list) ? list : []);
  return cache;
}

// Returns `loaded: false` until the list is actually known, so callers can
// render nothing rather than flashing "Block" at someone already blocked.
export function useBlockedMembers() {
  const [list, setList] = useState(cache);

  useEffect(() => {
    listeners.add(setList);
    // The cache may have been filled or changed while this component was
    // unmounted, so re-read it rather than trusting the initial state.
    setList(cache);
    if (cache === null) {
      load().catch((err) => {
        if (isRedirectError(err)) throw err;
        // A failed load must not leave every block control invisible for the
        // rest of the session — fall back to "nothing blocked", which the
        // next block/unblock corrects.
        publish([]);
      });
    }
    return () => { listeners.delete(setList); };
  }, []);

  return { blockedMembers: list ?? [], loaded: list !== null };
}

export async function blockMember(userId) {
  await blockUser(userId);
  try {
    // Refetch instead of appending a bare id: the Settings list renders each
    // blocked member's name, username and photo, none of which the button
    // that triggered the block has on hand.
    await reload();
  } catch (err) {
    if (isRedirectError(err)) throw err;
    // The block itself succeeded, so reflect it locally even if the refetch
    // didn't land — an id alone is enough for every button to read as blocked.
    publish([...(cache ?? []).filter((m) => m.id !== userId), { id: userId }]);
  }
}

export async function unblockMember(userId) {
  await unblockUser(userId);
  publish((cache ?? []).filter((m) => m.id !== userId));
}
