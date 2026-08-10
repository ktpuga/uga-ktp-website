'use client';

import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  User,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Hash,
  ShieldCheck,
} from 'lucide-react';
import { getReports, updateReportStatus } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';

// Palette now comes from the portal accent context so the Admin red/blue
// toggle reaches this page, not just the sidebar. Each component asks for it
// directly — no prop threading through the sub-components in this file.

const CONTENT_META = {
  user: { icon: User, label: 'Member profile' },
  message: { icon: MessageSquare, label: 'Direct message' },
  group_message: { icon: MessageSquare, label: 'Group chat message' },
  photo: { icon: ImageIcon, label: 'Photo' },
};

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function personName(u, fallback = 'Unknown') {
  if (!u) return fallback;
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
  return name || u.username;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Tab bar ───

function TabBar({ active, onChange, openCount, historyCount }) {
  const MAROON = useAccentPalette();
  const tabs = [
    { id: 'open', label: 'Open', count: openCount },
    { id: 'history', label: 'History', count: historyCount },
  ];

  return (
    <div className="relative mb-6 flex items-center gap-0.5 border-b border-border">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 pb-3 pt-1 text-sm font-medium transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
              style={{ background: isActive ? tint(MAROON.base, 0.1) : 'transparent', color: isActive ? MAROON.light : 'inherit' }}
            >
              {tab.count}
            </span>
            {isActive && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ background: MAROON.base }} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Report card ───

function ReportCard({ report, onResolve, onDismiss }) {
  const MAROON = useAccentPalette();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const meta = CONTENT_META[report.content_type] ?? CONTENT_META.message;
  const Icon = meta.icon;
  const isOpen = report.status === 'open';

  async function handle(action) {
    setLoading(action);
    setError(null);
    try {
      if (action === 'resolve') await onResolve(report.id, note);
      else await onDismiss(report.id, note);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to update report');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="h-0.5 w-full" style={{ background: isOpen ? MAROON.gradient : 'transparent' }} aria-hidden="true" />

      <div className="space-y-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: tint(MAROON.base, 0.08), color: MAROON.light }}>
              <Icon size={11} strokeWidth={1.75} />
              {meta.label}
            </div>
            <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
              {report.reason}
            </span>
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{timeAgo(report.created_at)}</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-border bg-muted/20 px-4 py-2.5 text-xs">
          <div>
            <span className="text-muted-foreground">Reported by </span>
            <span className="font-medium text-foreground">{personName(report.reporter)}</span>
            {report.reporter && <span className="ml-1 text-muted-foreground">@{report.reporter.username}</span>}
          </div>
          <div>
            <span className="text-muted-foreground">Reported member </span>
            <span className="font-medium text-foreground">{personName(report.reported_user, '—')}</span>
            {report.reported_user && <span className="ml-1 text-muted-foreground">@{report.reported_user.username}</span>}
          </div>
        </div>

        {report.explanation && (
          <blockquote className="rounded-xl border-l-2 border-muted-foreground/25 bg-muted/20 px-4 py-2.5 text-xs italic leading-relaxed text-muted-foreground">
            {report.explanation}
          </blockquote>
        )}

        {report.content_id != null && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
            <Hash size={9} />
            Content ID: {report.content_id}
          </div>
        )}

        {isOpen && (
          <div className="space-y-2.5 pt-1">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional note for the record…"
              className="w-full resize-y rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1"
              style={{ ['--tw-ring-color']: tint(MAROON.base, 0.28) }}
              onFocus={(e) => { e.currentTarget.style.borderColor = tint(MAROON.base, 0.35); }}
              onBlur={(e) => { e.currentTarget.style.borderColor = ''; }}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => handle('dismiss')}
                className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                {loading === 'dismiss' ? 'Dismissing…' : 'Dismiss'}
              </button>
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => handle('resolve')}
                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
                style={{ background: MAROON.gradient }}
              >
                {loading === 'resolve' ? 'Resolving…' : 'Resolve'}
              </button>
            </div>
          </div>
        )}

        {!isOpen && (
          <div className="flex flex-wrap items-start justify-between gap-3 pt-0.5">
            {report.status === 'resolved' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                <CheckCircle2 size={10} />
                Resolved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                <XCircle size={10} />
                Dismissed
              </span>
            )}
            {report.moderator_response && (
              <p className="max-w-prose text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Note: </span>
                {report.moderator_response}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main export ───

export default function ModerationQueue() {
  const MAROON = useAccentPalette();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('open');

  function loadReports() {
    setLoading(true);
    getReports()
      .then((data) => setReports(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load reports');
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadReports, []);

  async function updateStatus(id, status, note) {
    const updated = await updateReportStatus(id, { status, moderatorResponse: note });
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
  }

  async function handleResolve(id, note) {
    await updateStatus(id, 'resolved', note);
  }

  async function handleDismiss(id, note) {
    await updateStatus(id, 'dismissed', note);
  }

  const openReports = useMemo(() => reports.filter((r) => r.status === 'open'), [reports]);
  const historyReports = useMemo(() => reports.filter((r) => r.status !== 'open'), [reports]);
  const listed = activeTab === 'open' ? openReports : historyReports;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: MAROON.light }}>
          Admin Panel
        </p>
        <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">Reports &amp; Moderation</h1>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <TabBar active={activeTab} onChange={setActiveTab} openCount={openReports.length} historyCount={historyReports.length} />

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading reports...</p>
      ) : listed.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card">
          {activeTab === 'open' ? (
            <>
              <ShieldCheck size={28} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No open reports. The queue is clear.</p>
            </>
          ) : (
            <>
              <Clock size={28} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No resolved or dismissed reports yet.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {listed.map((report) => (
            <ReportCard key={report.id} report={report} onResolve={handleResolve} onDismiss={handleDismiss} />
          ))}
        </div>
      )}
    </div>
  );
}
