'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ChevronDown, Loader2, ScrollText, Search, ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAuditLog, getAuditLogTypes } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';

const PAGE_SIZE = 50;

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// "3m ago" for anything recent, an actual date once it stops being "recent".
// A log is scanned for "what just happened" far more often than for a date.
function relativeTime(value) {
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return '';
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const exactTime = (value) => new Date(value).toLocaleString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

// snake_case target types are what the API stores; this is display only.
const prettyType = (type) => (type ? type.replace(/_/g, ' ') : 'other');

function summaryText(summary) {
  if (!summary || typeof summary !== 'object') return null;
  return Object.entries(summary)
    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join(' · ');
}

function LogRow({ entry, accent }) {
  const failed = entry.status_code >= 400;

  return (
    <li className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ background: failed ? undefined : accent.gradient }}
      >
        {failed
          ? <ShieldAlert size={13} className="text-destructive" />
          : (entry.actor_name ?? '?').slice(0, 2).toUpperCase()}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{entry.actor_name ?? 'Someone'}</span>{' '}
          <span className="text-muted-foreground">{entry.action.toLowerCase()}</span>
          {entry.target_id && (
            <span className="text-muted-foreground/70"> #{entry.target_id}</span>
          )}
        </p>

        {summaryText(entry.summary) && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
            {summaryText(entry.summary)}
          </p>
        )}

        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground/70">
          <span title={exactTime(entry.created_at)}>{relativeTime(entry.created_at)}</span>
          <span className="rounded-full border border-border px-1.5 py-px">{prettyType(entry.target_type)}</span>
          <span className="font-mono">{entry.method} {entry.path}</span>
          {failed && (
            <span className="font-semibold text-destructive">failed · {entry.status_code}</span>
          )}
        </p>
      </div>
    </li>
  );
}

// `embedded` is set when this renders as the Activity Log tab of
// /admin/oversight rather than as a page of its own.
export default function ActivityLogPage({ embedded = false }) {
  const accent = useAccentPalette();

  const [entries, setEntries] = useState([]);
  const [types, setTypes] = useState([]);
  const [targetType, setTargetType] = useState('');
  const [failedOnly, setFailedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (pageIndex, { append = false } = {}) => {
    try {
      const data = await getAuditLog({
        limit: PAGE_SIZE,
        offset: pageIndex * PAGE_SIZE,
        targetType: targetType || undefined,
        failedOnly,
      });
      setReachedEnd(data.length < PAGE_SIZE);
      setEntries((prev) => (append ? [...prev, ...data] : data));
      setError('');
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load the activity log.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [targetType, failedOnly]);

  // Filters reset paging — appending page 2 of the old filter onto page 1 of
  // the new one produces a list that is quietly wrong.
  useEffect(() => {
    setLoading(true);
    setPage(0);
    load(0);
  }, [load]);

  useEffect(() => {
    getAuditLogTypes()
      .then(setTypes)
      .catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  // Client-side only, over what's loaded — the log is browsed, and a
  // server-side search would need its own index to be honest about matching
  // entries that haven't been fetched yet.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => (
      `${entry.actor_name ?? ''} ${entry.action} ${entry.path} ${summaryText(entry.summary) ?? ''}`
        .toLowerCase()
        .includes(q)
    ));
  }, [entries, search]);

  function loadMore() {
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    load(next, { append: true });
  }

  const selectClass = 'rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]';

  return (
    <div className={cn('mx-auto max-w-4xl', !embedded && 'px-4 pb-16 pt-8 sm:px-6 lg:px-8')}>
      {!embedded && (
        <div className="mb-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>Admin</p>
          <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>Activity Log</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Everything created, edited or deleted across the site, newest first. Direct messages and
            group chat conversations are deliberately excluded.
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search loaded entries…"
            className={cn(selectClass, 'w-full pl-8')}
          />
        </div>

        <div className="relative">
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            aria-label="Filter by type"
            className={cn(selectClass, 'appearance-none pr-8 capitalize')}
          >
            <option value="">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>{prettyType(type)}</option>
            ))}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        <button
          type="button"
          onClick={() => setFailedOnly((prev) => !prev)}
          aria-pressed={failedOnly}
          className={cn(
            'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
            failedOnly ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:bg-muted',
          )}
          style={failedOnly ? { background: accent.gradient } : undefined}
        >
          Failed only
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : entries.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <ScrollText size={22} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
          <p className="max-w-sm text-xs text-muted-foreground/80">
            Entries appear here as people create, edit and delete things.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-2.5" style={{ background: tint(accent.base, 0.03) }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {visible.length} {visible.length === 1 ? 'entry' : 'entries'}
                {search && ' matching'}
              </p>
            </div>
            <ul>
              {visible.map((entry) => (
                <LogRow key={entry.id} entry={entry} accent={accent} />
              ))}
            </ul>
          </div>

          {!reachedEnd && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                {loadingMore && <Loader2 size={13} className="animate-spin" />}
                Load older
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
