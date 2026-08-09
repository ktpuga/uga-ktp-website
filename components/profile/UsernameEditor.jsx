'use client';

import { useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { updateUsername } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';
import { cn } from '@/lib/utils';

// Inline rename control for the settings header card.
//
// Kept out of ProfileForm on purpose, mirroring the API split: this is the one
// profile field that writes to Authentik as well as our own database, and the
// one that can fail with something the member must act on ("that name is
// taken"). Inside the main form, that failure would surface as a whole-form
// error on a save that was really about their bio.
export default function UsernameEditor({ username, accent, onChange }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(username ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  function open() {
    setValue(username ?? '');
    setError(null);
    setSaved(false);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  async function save(e) {
    e.preventDefault();
    const next = value.trim();

    if (next === username) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await updateUsername(next);
      onChange?.(result?.username ?? next);
      setEditing(false);
      setSaved(true);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not change your username.');
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">@{username}</p>
          <button
            type="button"
            onClick={open}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Change username"
          >
            <Pencil size={12} />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {saved ? 'Username updated.' : 'This is how you sign in and how members find you.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={save}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">@</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          disabled={saving}
          maxLength={32}
          aria-label="Username"
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-40 rounded-md border bg-background px-2 py-1 text-sm text-foreground outline-none',
            error ? 'border-destructive' : 'border-border focus:border-transparent'
          )}
          style={error ? undefined : { outline: 'none', boxShadow: `0 0 0 2px ${accent.base}33` }}
        />
        <button
          type="submit"
          disabled={saving || !value.trim()}
          className="rounded-md p-1.5 text-white transition-opacity disabled:opacity-50"
          style={{ background: accent.base }}
          aria-label="Save username"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Cancel"
        >
          <X size={12} />
        </button>
      </div>

      <p className={cn('mt-1 text-[11px]', error ? 'text-destructive' : 'text-muted-foreground')}>
        {error ?? 'Letters, numbers, periods, underscores and hyphens. 3–32 characters.'}
      </p>
    </form>
  );
}
