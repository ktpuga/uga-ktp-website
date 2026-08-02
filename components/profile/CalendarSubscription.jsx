'use client';

import { useState } from 'react';
import { Calendar, Check, Copy, Loader2, RefreshCw, Trash2, AlertTriangle, Info } from 'lucide-react';
import { createCalendarFeed, deleteCalendarFeed } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';

// Subscribing puts every event you can see into Apple Calendar, Google
// Calendar or Outlook, and keeps it updated without you doing anything again.
//
// The link IS the credential — there is no login step for a calendar client —
// so the copy here has to say that plainly rather than treating it like an
// ordinary share link.
export default function CalendarSubscription({ initialToken = null }) {
  const accent = useAccentPalette();
  const [token, setToken] = useState(initialToken);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Built in the browser so it always matches the host the member is actually
  // on, rather than needing a NEXT_PUBLIC_ base URL that can drift.
  const httpUrl = token && typeof window !== 'undefined'
    ? `${window.location.origin}/api/calendar/feed/${token}.ics`
    : null;
  // webcal:// is what makes a click subscribe rather than download a one-off
  // snapshot. Same URL, different scheme; every major client understands it.
  const webcalUrl = httpUrl ? httpUrl.replace(/^https?:/, 'webcal:') : null;

  async function run(fn) {
    setBusy(true);
    setError('');
    try {
      return await fn();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Something went wrong.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    const result = await run(() => createCalendarFeed());
    if (result?.token) setToken(result.token);
  }

  async function regenerate() {
    // Same endpoint as create: issuing a new token is what revokes the old
    // link, so there is no separate "revoke" step to explain.
    const result = await run(() => createCalendarFeed());
    if (result?.token) setToken(result.token);
  }

  async function remove() {
    const ok = await run(async () => { await deleteCalendarFeed(); return true; });
    if (ok) setToken(null);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(httpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is unavailable outside a secure context; the URL is on
      // screen and selectable either way.
    }
  }

  if (!token) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Add every chapter event you can see to your own calendar app. It stays up to date on its
          own, so you don&apos;t have to check the portal for times and places.
        </p>
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertTriangle size={12} /> {error}</p>
        )}
        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-85 disabled:opacity-40"
          style={{ background: accent.gradient }}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
          Create my calendar link
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={webcalUrl}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-85"
          style={{ background: accent.gradient }}
        >
          <Calendar size={14} /> Subscribe
        </a>
        <button
          type="button"
          onClick={copy}
          className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}
        </button>
      </div>

      <p className="break-all rounded-lg bg-muted/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
        {httpUrl}
      </p>

      {/* Said explicitly because it's the one genuinely surprising thing about
          calendar subscriptions, and a member who doesn't know it will report
          the feature as broken. */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
        <Info size={12} className="mt-0.5 shrink-0" />
        <span>
          Calendar apps decide for themselves how often to check for changes. Apple usually updates
          within the hour; <strong>Google can take up to a day</strong>. Push notifications still
          reach you straight away, so use those for last-minute changes.
        </span>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
        <span>
          Anyone with this link can see your chapter calendar, and it doesn&apos;t ask them to log
          in. Don&apos;t post it anywhere shared. If it gets out, generate a new one below.
        </span>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertTriangle size={12} /> {error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={regenerate}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          {busy ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          Generate a new link
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-40"
        >
          <Trash2 size={11} /> Turn off
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Generating a new link immediately stops the old one working. Any calendar still subscribed
        to it will quietly stop updating, so re-subscribe on your devices afterwards.
      </p>
    </div>
  );
}
