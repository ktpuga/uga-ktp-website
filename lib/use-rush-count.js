'use client';

import { useEffect, useState } from 'react';
import { getRushCount } from '@/lib/portal-api';

/**
 * How many rushees exist, for deciding whether to offer the Rushees tab.
 *
 * Returns 0 both when there are none and when the caller isn't allowed to see
 * them, so a layout can simply test `> 0` with no permission branch of its own.
 *
 * Starts at 0 rather than null: the tab should appear once we know there are
 * rushees, not flicker in and out on every navigation. Between rush seasons
 * that means it's simply never rendered, which is the point — the user asked
 * for a tab that shows up when rush accounts exist and disappears when they
 * don't.
 *
 * `getRushCount` swallows its own errors, so a backend hiccup hides the tab
 * rather than breaking the sidebar on every page of every portal.
 */
export function useRushCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getRushCount().then((n) => { if (!cancelled) setCount(n); });
    return () => { cancelled = true; };
  }, []);

  return count;
}
