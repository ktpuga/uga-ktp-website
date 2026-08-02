'use client';

import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, CalendarClock, Check, Copy, Info, Link2, Loader2, Power, QrCode, ShieldCheck,
} from 'lucide-react';
import { closeRushSignup, getRushSignup, openRushSignup } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';

// Palette now comes from the portal accent context so the Admin red/blue
// toggle reaches this page, not just the sidebar. Each component asks for it
// directly — no prop threading through the sub-components in this file.

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const INPUT = 'w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]';

function formatExpiry(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'no expiry';
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Two weeks out — long enough to cover a rush week plus stragglers, short
// enough that forgetting to close it isn't an open door for a semester.
function defaultExpiry() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard is blocked outside a secure context; the link is
          // selectable on screen either way, so this needn't surface an error.
        }
      }}
      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy link</>}
    </button>
  );
}

export default function RushSignupManager() {
  const MAROON = useAccentPalette();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [expires, setExpires] = useState(defaultExpiry);

  useEffect(() => { load(); }, []);

  async function load() {
    setError('');
    try {
      setStatus(await getRushSignup());
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not check rush signup status.');
    } finally {
      setLoading(false);
    }
  }

  async function open() {
    if (!name.trim()) { setError('Give this rush period a name, e.g. "fall-2026".'); return; }
    setBusy(true);
    setError('');
    try {
      await openRushSignup({ name: name.trim(), expires: new Date(expires).toISOString() });
      setName('');
      await load();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not open rush signup.');
    } finally {
      setBusy(false);
    }
  }

  async function close(pk) {
    setBusy(true);
    setError('');
    try {
      await closeRushSignup(pk);
      await load();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not close rush signup.');
    } finally {
      setBusy(false);
    }
  }

  const invitations = status?.invitations ?? [];
  const isOpen = Boolean(status?.is_open);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: MAROON.light }}>Admin Panel</p>
        <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">Rush Signup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Let prospective members create their own accounts, for a fixed window
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            {error}
            {/* The most common cause by far, and the message from Authentik
                alone doesn't make it obvious. */}
            <p className="mt-1 text-xs opacity-80">
              If this says the request failed, check that the <code>ktp-api-service</code> account
              has add/delete/view permission on <strong>Invitation</strong> in Authentik.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Checking status…
        </div>
      ) : (
        <div className="space-y-5">
          <div className={cn('overflow-hidden rounded-2xl border bg-card shadow-sm', isOpen ? 'border-emerald-300 dark:border-emerald-900' : 'border-border')}>
            <div className="flex items-center gap-3 px-5 py-4">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: isOpen ? 'rgba(16,185,129,0.12)' : tint(MAROON.base, 0.08) }}
              >
                <Power size={16} className={isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Rush signup is {isOpen ? 'open' : 'closed'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOpen
                    ? 'Anyone with the link or QR code can create a rushee account.'
                    : 'No new rushee accounts can be created right now.'}
                </p>
              </div>
            </div>
          </div>

          {invitations.length > 0 && (
            <div className="space-y-4">
              {invitations.map((invite) => (
                <div key={invite.pk} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(MAROON.base, 0.03) }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: MAROON.gradient }}>
                        <QrCode size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{invite.name}</p>
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarClock size={10} />
                          {invite.is_open ? `Closes ${formatExpiry(invite.expires)}` : `Expired ${formatExpiry(invite.expires)}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => close(invite.pk)}
                      disabled={busy}
                      className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-40"
                    >
                      {busy ? <Loader2 size={11} className="animate-spin" /> : <Power size={11} />}
                      Close
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-4 px-5 py-5 sm:flex-row sm:items-start">
                    {/* White plate regardless of theme — scanners need the
                        contrast, and a dark-mode QR on a dark card doesn't read. */}
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <QRCodeSVG value={invite.signup_url} size={148} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Signup link</p>
                        <p className="break-all rounded-lg bg-muted/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                          {invite.signup_url}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <CopyButton value={invite.signup_url} />
                        <a
                          href={invite.signup_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Link2 size={11} /> Open
                        </a>
                      </div>
                      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <ShieldCheck size={11} className="mt-0.5 shrink-0" />
                        Print the QR on the rush flyer. Accounts made through it get the{' '}
                        <strong>rush</strong> group — no photos, documents or member directory.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4" style={{ background: tint(MAROON.base, 0.03) }}>
              <p className="text-sm font-semibold text-foreground">Open a new rush period</p>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                <Info size={11} className="mt-0.5 shrink-0" />
                Issuing a separate code per event tells you which one actually converts — the signup
                is attributed to whichever link it came from.
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="rush-name" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Name
                  </label>
                  <input id="rush-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="fall-2026" className={INPUT} />
                </div>
                <div>
                  <label htmlFor="rush-expires" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Closes at
                  </label>
                  <input id="rush-expires" type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} className={INPUT} />
                </div>
              </div>

              <button
                type="button"
                onClick={open}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-85 disabled:opacity-40"
                style={{ background: MAROON.gradient }}
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
                Open rush signup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
