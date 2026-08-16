'use client';

import { useCallback, useEffect, useState } from 'react';
import { getEvents } from './portal-api';
import { isRedirectError } from './is-redirect-error';

// How many upcoming events are still waiting on THIS member's RSVP.
//
// ⚠ DELIBERATELY NOT useTabNotifications. That hook is a "new since you last
// looked" cursor: opening the tab calls markTabSeen and the badge goes to
// zero. That is right for announcements, and exactly wrong here — an RSVP
// badge has to survive being looked at and disappear only when the member
// actually answers. Routing this through the cursor would clear the badge for
// everyone who glanced at the calendar and decided later, which is the
// specific failure this is meant to prevent.
//
// There is no counting endpoint: GET /events already returns `requiresRsvp`
// and `myRsvp` per event, so the count is derived client-side from data the
// calendar fetches anyway. That deliberately avoids adding an rsvpSummary to
// the list route, which would cost a users-table scan per event.
export const RSVP_CHANGED_EVENT = 'ktp:rsvp-changed';

// Called after a successful RSVP so the sidebar updates immediately instead of
// up to a poll-interval later. The badge sits in PortalShell, which is a
// layout in a different React tree from the calendar page, so there is no
// shared state to update — same reason PROFILE_PICTURE_CHANGED_EVENT exists.
export function announceRsvpChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(RSVP_CHANGED_EVENT));
}

// Slower than messages (10s) and than tab notifications (30s): an unanswered
// RSVP is a standing to-do, not news. The window event above covers the one
// case where latency would actually be noticed.
const POLL_INTERVAL_MS = 60000;

export function usePendingRsvpCount() {
  const [count, setCount] = useState(0);

  const load = useCallback(() => {
    getEvents()
      .then((events) => {
        if (!Array.isArray(events)) return;
        const now = Date.now();
        setCount(events.filter((event) => (
          event.requiresRsvp
          && !event.myRsvp
          // Past events are not actionable, and the API refuses an RSVP after
          // endDate with a 409. Badging one would be a number you cannot
          // clear. Matches the API's cut-off exactly: endDate, not startDate.
          && new Date(event.endDate).getTime() >= now
        )).length);
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        // Swallowed on purpose: a failed count must not take the whole shell
        // down, and the next poll will retry. The badge simply holds its last
        // value, which is better than flashing to zero and reading as "done".
      });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    window.addEventListener(RSVP_CHANGED_EVENT, load);
    return () => {
      clearInterval(interval);
      window.removeEventListener(RSVP_CHANGED_EVENT, load);
    };
  }, [load]);

  return count;
}
