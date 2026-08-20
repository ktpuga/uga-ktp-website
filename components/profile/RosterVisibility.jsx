'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { setRosterVisibility } from '@/lib/portal-api';

// The one setting in this whole app about the OPEN INTERNET rather than about
// the chapter. Everything else a member fills in is members-only; the public
// roster at ugaktp.com/members-list puts their name, photo and role on a page
// anyone can load, and until now the only way off it was to delete your profile
// picture, which also removed you from the directory everybody actually uses.
//
// Deliberately worded around the consequence rather than the mechanism. "Show
// me on the public roster" is a question somebody can answer; "show_on_public_
// roster" is a column name.
//
// Follows EmailNotifications' shape: optimistic toggle, rollback on failure,
// brief "Saved" confirmation. The difference is that this one takes its initial
// value as a PROP rather than fetching it — Settings already loads the member's
// profile for the form below it, and a second request for one boolean would
// make the switch render in the wrong position for a beat. On a control about
// public visibility, a switch that starts wrong and corrects itself reads as
// the setting having failed to stick.
export default function RosterVisibility({ accent, initialVisible, onChange }) {
  const [visible, setVisible] = useState(initialVisible !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function toggle(next) {
    const previous = visible;
    setVisible(next);
    setSaving(true);
    setError(null);
    setSaved(false);

    // Returns { error } rather than throwing, so the API's message survives
    // instead of becoming React's #441 digest. See TODO trap #8.
    const result = await setRosterVisibility(next);
    setSaving(false);

    if (result?.error) {
      setVisible(previous);
      setError(result.error);
      return;
    }
    onChange?.(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={visible}
          disabled={saving}
          onChange={(e) => toggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border"
          style={{ accentColor: accent?.base }}
        />
        <span>
          <span className="block text-sm font-medium text-foreground">
            Show me on the public roster
          </span>
          {/* ⚠ This list must match memberModel.findPublicRoster's projection.
              It went stale once: doing_now and links were made public in
              deliberate reversals (2026-08-10 and 08-11) and this copy still
              said "name, photo, role and LinkedIn", so the one control in the
              app about the open internet was under-describing what it exposes.
              A member deciding whether to be on a page with no authentication
              has to be told the truth about what is on it. If you add a column
              to that query, add it here in the same commit. */}
          <span className="mt-0.5 block text-xs text-muted-foreground">
            The chapter page at ugaktp.com/members-list is visible to anyone, with no account
            needed. It lists your name, photo, role, pledge class, LinkedIn, any links you have
            added, what you have put as what you are doing now, and any traits the chapter has
            given you. Turning this off removes you from it and stops your photo being served
            there. Nothing changes inside the portal: you stay in the member directory, and
            everything else you have filled in was never public.
          </span>
        </span>
      </label>

      {saving && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" /> Saving...
        </p>
      )}
      {saved && !saving && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <Check size={12} /> Saved
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {/* Only when they are actually off it. A permanent caveat under a switch
          that is on for almost everybody is noise; this is the one state where
          somebody might wonder why they cannot find themselves on the page. */}
      {!visible && !saving && (
        <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          You are hidden from the public roster. The page can take a few minutes to update for
          people who already had it open.
        </p>
      )}
    </div>
  );
}
