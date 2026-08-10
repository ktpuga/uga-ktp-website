'use client';

import { useCallback, useEffect, useState } from 'react';
import { getInterviewerSchedules } from '@/lib/portal-api';

/**
 * The interview rounds this member may staff.
 *
 * Doubles as the permission check for the Interviews tab, which is why there is
 * no separate "am I on the pledge committee?" fetch: the API already answers
 * that question by returning only rounds whose `interviewer_committee_ids`
 * include a committee the caller belongs to. One request, no client-side
 * duplication of the rule — and no way for a nav entry to appear for someone the
 * API would then refuse.
 *
 * Same shape as useRushCount: starts empty so the tab appears once we know there
 * is something in it rather than flickering, and `getInterviewerSchedules`
 * swallows its own errors so a backend hiccup hides the tab instead of breaking
 * the sidebar everywhere.
 *
 * `reload` is exposed because the page itself uses this hook, and claiming a
 * slot has to refresh the list.
 */
export function useInterviewerRounds() {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await getInterviewerSchedules();
    setRounds(data);
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    getInterviewerSchedules().then((data) => {
      if (cancelled) return;
      setRounds(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { rounds, loading, reload };
}
