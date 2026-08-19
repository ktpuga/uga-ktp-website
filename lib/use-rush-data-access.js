'use client';

import { useEffect, useState } from 'react';
import { getRushDataAccess } from '@/lib/portal-api';

/**
 * Whether this member may read the rushee interest form data.
 *
 * Exists for one job: deciding whether to render the Rushee Data nav entry.
 * The sibling of `useInterviewerRounds`, and the same reasoning behind it --
 * the rule is "eboard, or a member of a committee eboard flagged", and
 * committee membership lives in Postgres rather than in the JWT. The session
 * object genuinely cannot answer this, so asking the API is not a duplicated
 * check; it is the only check there is.
 *
 * Starts false so the entry appears once we know it belongs there, rather than
 * flashing for everyone on every page load and vanishing a moment later.
 * `getRushDataAccess` swallows its own errors and answers false, so a backend
 * hiccup hides one tab instead of breaking the sidebar.
 */
export function useRushDataAccess() {
  const [canView, setCanView] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRushDataAccess().then((allowed) => {
      if (cancelled) return;
      setCanView(allowed);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { canView, loading };
}
