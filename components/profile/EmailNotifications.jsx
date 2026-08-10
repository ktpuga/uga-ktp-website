'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { getNotificationPreferences, updateNotificationPreferences, getNotificationChannels } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';

// The member-facing half of the email channel. Only eboard content explicitly
// marked "also send this as an email" is ever sent, so this switch is the only
// thing standing between a member and that mail — which is why it is in
// Settings rather than buried behind a support request.
//
// The push categories on the same preferences row are deliberately NOT shown
// here: they only mean anything on a device with the iOS app installed, and a
// toggle in a browser that silently governs a different device is worse than
// no toggle at all.
export default function EmailNotifications({ accent }) {
  const [enabled, setEnabled] = useState(null);
  const [available, setAvailable] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Separate catches rather than one Promise.all — see TODO trap #1. These
    // are independent questions and a failure of either must not blank both.
    getNotificationPreferences()
      .then((preferences) => {
        if (cancelled) return;
        // Absent means the row has never been written, and the column default
        // is TRUE — so treat a missing value as on rather than as off.
        setEnabled(preferences?.email_enabled ?? true);
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        if (!cancelled) setError('Could not load your email setting.');
      });

    getNotificationChannels()
      .then((channels) => { if (!cancelled) setAvailable(Boolean(channels?.email)); })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        if (!cancelled) setAvailable(false);
      });

    return () => { cancelled = true; };
  }, []);

  async function toggle(next) {
    // Optimistic: the switch moves under the finger, and rolls back only if
    // the write actually fails.
    const previous = enabled;
    setEnabled(next);
    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await updateNotificationPreferences({ email_enabled: next });
    setSaving(false);

    if (result?.error) {
      setEnabled(previous);
      setError(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (enabled === null || available === null) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 size={14} className="animate-spin" />
        Loading…
      </p>
    );
  }

  // Stated plainly rather than hidden. Unlike the compose-side checkbox — which
  // just disappears, because an option nobody can use is clutter to whoever is
  // posting — a member arriving in Settings is here to ask "will you email me?"
  // and deserves the real answer, not an absent section implying they already
  // opted out.
  if (!available) {
    return (
      <p className="text-sm text-muted-foreground">
        Email notifications aren&apos;t switched on for the chapter yet. Announcements
        and events still appear in the portal and on your sidebar.
      </p>
    );
  }

  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          disabled={saving}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border"
          style={{ accentColor: accent?.base }}
        />
        <span>
          <span className="block text-sm font-medium text-foreground">
            Email me important announcements and events
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Only what Eboard marks as worth emailing — typically required events and
            time-sensitive announcements. Everything still appears in the portal either way.
          </span>
        </span>
      </label>

      {saving && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" /> Saving…
        </p>
      )}
      {saved && !saving && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <Check size={12} /> Saved
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
