'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getTabNotifications, markTabSeen } from './portal-api';
import { isRedirectError } from './is-redirect-error';

// Must match notificationCursorModel.TABS in the API and the CHECK constraint
// in migration 1787300000000. A tab missing here simply never badges — it
// does not error — so add to both sides together.
export const NOTIFICATION_TABS = ['announcements', 'calendar', 'meetings', 'polls', 'files', 'interviews'];

// Tabs whose count is NOT "new since you last looked" and therefore must not
// be zeroed by looking. `meetings` counts unanswered invitations, which clear
// when the member replies — looking at the list does not reply to anything.
// It stays in NOTIFICATION_TABS above because the API still returns it under
// that key (and the cursor row is harmless); only the clear-on-view behaviour
// is skipped. The calendar's pending-RSVP count follows the same rule, but
// lives outside this hook entirely — see lib/use-pending-rsvps.js.
const CLEARS_ON_ACTION_NOT_VIEW = new Set(['meetings']);

const EMPTY = Object.freeze(Object.fromEntries(NOTIFICATION_TABS.map((tab) => [tab, 0])));

// Portal nav hrefs are /<portal>/<tab>, so the last segment identifies the tab
// across /member, /pledge and /rushee alike. The portal root ('/member') has
// no tab segment and correctly resolves to null.
export function tabFromHref(href) {
  if (!href) return null;
  const segment = href.split('?')[0].split('/').filter(Boolean).pop();
  return NOTIFICATION_TABS.includes(segment) ? segment : null;
}

// Polled less often than messages (30s vs 10s): this asks the API for seven
// counts, and "a new announcement was posted" is not a thing anyone needs
// within ten seconds.
const POLL_INTERVAL_MS = 30000;

export function useTabNotifications() {
  const [counts, setCounts] = useState(EMPTY);
  const pathname = usePathname();
  const activeTab = tabFromHref(pathname);

  // Held in a ref so the polling effect never restarts when navigation
  // changes it — a restart would reset the interval on every click.
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const load = useCallback(() => {
    getTabNotifications()
      .then((data) => {
        if (!data) return;
        setCounts((previous) => ({
          ...EMPTY,
          ...data,
          // The tab being read cannot also be unread. Without this, content
          // arriving while someone sits on the page badges the very tab they
          // are looking at, which reads as a bug rather than as news.
          //
          // Except for the clears-on-action tabs: "you still owe 3 replies" is
          // true whether or not you happen to be looking at the list, and
          // blanking it here would re-create the bug this whole change fixes.
          ...(activeTabRef.current && !CLEARS_ON_ACTION_NOT_VIEW.has(activeTabRef.current)
            ? { [activeTabRef.current]: 0 }
            : {}),
        }));
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
      });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Visiting a tab is what marks it seen. Zeroing locally first means the
  // badge disappears on click rather than up to 30 seconds later; the server
  // write is what makes it stick.
  useEffect(() => {
    if (!activeTab) return;
    // markTabSeen still runs for every tab — the cursor row is written either
    // way and costs nothing — but the optimistic local zero is skipped for
    // counts that only a real action clears.
    if (!CLEARS_ON_ACTION_NOT_VIEW.has(activeTab)) {
      setCounts((previous) => (previous[activeTab] === 0 ? previous : { ...previous, [activeTab]: 0 }));
    }
    markTabSeen(activeTab).catch((err) => {
      if (isRedirectError(err)) throw err;
    });
  }, [activeTab]);

  return counts;
}
