'use client';

import { useEffect, useState } from 'react';
import { getUnreadMessageCount, getUnreadGroupChatCount } from './portal-api';
import { isRedirectError } from './is-redirect-error';

// Shared by the sidebar nav badge and the Messages page's own tab badges —
// each caller polls independently (matches this app's existing pattern of
// components fetching what they need themselves) rather than threading
// state down from a layout.
export function useUnreadCounts() {
  const [dmCount, setDmCount] = useState(0);
  const [groupChatCount, setGroupChatCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    function load() {
      Promise.all([getUnreadMessageCount(), getUnreadGroupChatCount()])
        .then(([dm, groups]) => {
          if (cancelled) return;
          setDmCount(dm?.count ?? 0);
          setGroupChatCount(groups?.count ?? 0);
        })
        .catch((err) => {
          if (isRedirectError(err)) throw err;
        });
    }

    load();
    const interval = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { dmCount, groupChatCount, total: dmCount + groupChatCount };
}
