'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  BarChart3,
  Users,
  Check,
  AlertTriangle,
  ChevronDown,
  Lock,
  Calendar,
  Tag,
  Building2,
} from 'lucide-react';
import {
  getPolls,
  createPoll,
  deletePoll,
  closePoll,
  votePoll,
  getPollStats,
  getCommittees,
} from '@/lib/portal-api';
import { memberDisplayName } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import LegacyPollsPage from './LegacyPollsPage';

const ACCENT_THEMES = {
  blue: { base: '#1e3a8a', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', light: '#1d4ed8', muted: 'rgba(30,58,138,0.10)' },
  red: { base: '#7f1d1d', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', light: '#991b1b', muted: 'rgba(127,29,29,0.10)' },
};

const DEFAULT_AUDIENCE = ['active', 'alumni', 'pledge', 'eboard'];

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDatetime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function audienceLabel(audience) {
  if (!audience || audience.length === 0) return 'All Members';
  const labels = { active: 'Active', alumni: 'Alumni', pledge: 'Pledges', eboard: 'Eboard' };
  return audience.map((a) => labels[a] ?? a).join(', ');
}

// ─── Shared: modal primitives ───

function ModalWrapper({ children, onClose, label, maxWidth = 'max-w-sm' }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className={cn('relative z-10 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl', maxWidth)}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ accent, title, icon, onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent.gradient }}>
          {icon}
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
        <X size={14} />
      </button>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function inputCls() {
  return 'w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2';
}

function bindFocus(accent) {
  return {
    style: { ['--tw-ring-color']: tint(accent.base, 0.3) },
    onFocus: (e) => { e.currentTarget.style.borderColor = tint(accent.base, 0.4); },
    onBlur: (e) => { e.currentTarget.style.borderColor = ''; },
  };
}

// ─── Confirm modal ───

function ConfirmModal({ title, body, confirmLabel, accent, onClose, onConfirm, danger = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose} label={title}>
      <div className="p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle size={18} className="text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
        <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
          Cancel
        </button>
        <button
          type="button" onClick={handleConfirm} disabled={busy}
          className={cn('rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50', danger && 'bg-destructive hover:bg-destructive/90')}
          style={!danger ? { background: accent.gradient } : undefined}
        >
          {busy ? 'Working...' : confirmLabel}
        </button>
      </div>
    </ModalWrapper>
  );
}

// ─── Create Poll modal ───

function CreatePollModal({ accent, committees, onClose, onCreated }) {
  const [question, setQuestion] = useState('');
  const [description, setDesc] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multiSelect, setMulti] = useState(false);
  const [expiresAt, setExpires] = useState('');
  const [targeting, setTargeting] = useState('chapter');
  const [selectedAudience, setAud] = useState(DEFAULT_AUDIENCE);
  const [selectedCommittee, setCom] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = question.trim().length > 0
    && options.filter((o) => o.trim()).length >= 2
    && (targeting === 'chapter' ? selectedAudience.length > 0 : selectedCommittee !== null);

  function addOption() { setOptions((prev) => [...prev, '']); }
  function removeOption(i) { setOptions((prev) => prev.filter((_, idx) => idx !== i)); }
  function setOption(i, val) { setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o))); }

  function toggleAudience(role) {
    setAud((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  async function submit() {
    if (!canSubmit || saving) return;
    setError(null);

    let expiresAtIso = null;
    if (expiresAt) {
      const parsed = new Date(expiresAt);
      if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
        setError('Expiration must be a valid time in the future.');
        return;
      }
      expiresAtIso = parsed.toISOString();
    }

    setSaving(true);
    try {
      const poll = await createPoll({
        question: question.trim(),
        description: description.trim(),
        options: options.map((o) => o.trim()).filter(Boolean),
        multiSelect,
        audience: targeting === 'chapter' ? selectedAudience : [],
        committeeId: targeting === 'committee' ? selectedCommittee : null,
        expiresAt: expiresAtIso,
      });
      onCreated(poll);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to create poll');
      setSaving(false);
    }
  }

  const fb = bindFocus(accent);
  const ROLES = [
    { value: 'active', label: 'Active Members' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'pledge', label: 'Pledges' },
    { value: 'eboard', label: 'Eboard' },
  ];

  return (
    <ModalWrapper onClose={onClose} label="Create poll" maxWidth="max-w-lg">
      <ModalHeader accent={accent} title="New Poll" icon={<BarChart3 size={14} strokeWidth={1.75} />} onClose={onClose} />
      <div className="max-h-[72vh] space-y-5 overflow-y-auto p-5">
        <FormField label="Question">
          <input autoFocus type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
            placeholder="What should we vote on?" className={inputCls()} {...fb} />
        </FormField>

        <FormField label="Description (optional)">
          <textarea rows={2} value={description} onChange={(e) => setDesc(e.target.value)}
            placeholder="Add context or details…" className={cn(inputCls(), 'resize-none')}
            style={fb.style} onFocus={fb.onFocus} onBlur={fb.onBlur} />
        </FormField>

        <FormField label="Options (min 2)">
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: accent.gradient }}>
                  {i + 1}
                </span>
                <input type="text" value={opt} onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`} className={cn(inputCls(), 'flex-1')} {...fb} />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-destructive" aria-label="Remove option">
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addOption} className="mt-1 flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-75" style={{ color: accent.light }}>
              <Plus size={12} /> Add option
            </button>
          </div>
        </FormField>

        <label className="flex cursor-pointer items-center gap-3">
          <div
            onClick={() => setMulti((p) => !p)}
            className={cn('relative h-5 w-9 rounded-full transition-colors', multiSelect ? '' : 'bg-muted')}
            style={multiSelect ? { background: accent.gradient } : undefined}
            role="checkbox" aria-checked={multiSelect} tabIndex={0}
            onKeyDown={(e) => { if (e.key === ' ') setMulti((p) => !p); }}
          >
            <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', multiSelect ? 'translate-x-4' : 'translate-x-0.5')} />
          </div>
          <span className="text-sm text-foreground">Allow selecting multiple options</span>
        </label>

        <FormField label="Closes At (optional — leave blank to close manually)">
          <div className="relative">
            <Calendar size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="datetime-local" value={expiresAt} onChange={(e) => setExpires(e.target.value)}
              className={cn(inputCls(), 'pl-8')} {...fb} />
          </div>
        </FormField>

        <FormField label="Audience">
          <div className="mb-3 inline-flex rounded-xl border border-border bg-muted/40 p-0.5 text-xs font-medium">
            {['chapter', 'committee'].map((mode) => (
              <button key={mode} type="button"
                onClick={() => setTargeting(mode)}
                className={cn('rounded-lg px-4 py-1.5 transition-all', targeting === mode ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                style={targeting === mode ? { background: accent.gradient } : undefined}
              >
                {mode === 'chapter' ? 'Chapter-wide' : 'Committee Only'}
              </button>
            ))}
          </div>

          {targeting === 'chapter' ? (
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const on = selectedAudience.includes(r.value);
                return (
                  <button key={r.value} type="button" onClick={() => toggleAudience(r.value)}
                    className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', on ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:border-current')}
                    style={on ? { background: accent.gradient } : undefined}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedCommittee ?? ''}
                onChange={(e) => setCom(e.target.value ? Number(e.target.value) : null)}
                className={cn(inputCls(), 'appearance-none pr-8')}
                style={{ ['--tw-ring-color']: tint(accent.base, 0.3) }}
              >
                <option value="">Select a committee…</option>
                {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}
        </FormField>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
        <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={!canSubmit || saving}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ background: accent.gradient }}>
          {saving ? 'Creating...' : 'Create Poll'}
        </button>
      </div>
    </ModalWrapper>
  );
}

// ─── Poll status badge ───

function StatusBadge({ poll, accent }) {
  if (poll.is_closed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
        <Lock size={9} /> Closed
      </span>
    );
  }
  if ((poll.my_option_ids ?? []).length > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: accent.gradient }}>
        <Check size={9} /> Voted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ borderColor: tint(accent.base, 0.3), color: accent.light, background: tint(accent.base, 0.06) }}>
      Vote now
    </span>
  );
}

// ─── Audience badge ───

function AudienceBadge({ poll, committees }) {
  const label = poll.committee_id
    ? `Committee: ${committees.find((c) => c.id === poll.committee_id)?.name ?? 'Unknown'}`
    : audienceLabel(poll.audience);

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
      {poll.committee_id ? <Building2 size={9} /> : <Tag size={9} />}
      {label}
    </span>
  );
}

// ─── Poll card ───

function PollCard({ poll, committees, accent, isEboard, onOpen, onDelete }) {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      onClick={onOpen}
      role="button" tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      aria-label={`View poll: ${poll.question}`}
    >
      <div className="h-1 w-full" style={{ background: accent.gradient }} aria-hidden="true" />

      <div className="px-5 py-4">
        <p className="mb-3 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{poll.question}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users size={10} />
            {poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            Posted {timeAgo(poll.created_at)}
          </span>
          {poll.expires_at && !poll.is_closed && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              Closes {formatDatetime(poll.expires_at)}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <AudienceBadge poll={poll} committees={committees} />
            <StatusBadge poll={poll} accent={accent} />
          </div>
          {isEboard && (
            <button type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              aria-label="Delete poll"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Result bar ───

function ResultBar({ option, total, isMyPick, accent }) {
  const pct = total > 0 ? Math.round((option.vote_count / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {isMyPick && <CheckCircle2 size={13} style={{ color: accent.light }} className="shrink-0" />}
          <span className={cn('truncate text-sm', isMyPick ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
            {option.label}
          </span>
        </div>
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          {option.vote_count} ({pct}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: isMyPick ? accent.gradient : tint(accent.base, 0.25) }}
        />
      </div>
    </div>
  );
}

// ─── Poll detail view ───

function PollDetail({ poll, committees, accent, isEboard, onBack, onVoted, onClosed }) {
  const [selected, setSelected] = useState(poll.my_option_ids ?? []);
  const [stats, setStats] = useState(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const hasVoted = (poll.my_option_ids ?? []).length > 0;
  const showResults = poll.is_closed || hasVoted;

  useEffect(() => {
    setSelected(poll.my_option_ids ?? []);
  }, [poll.id]);

  useEffect(() => {
    if (isEboard) {
      getPollStats(poll.id)
        .then(setStats)
        .catch((err) => { if (isRedirectError(err)) throw err; });
    }
  }, [poll.id, isEboard]);

  function toggle(id) {
    if (poll.multi_select) {
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelected([id]);
    }
  }

  async function handleVote() {
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await votePoll(poll.id, selected);
      onVoted(updated);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose() {
    await closePoll(poll.id);
    onClosed();
    setShowConfirmClose(false);
  }

  return (
    <>
      <div className="mb-6 flex items-start gap-3">
        <button type="button" onClick={onBack}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Back to polls">
          <ChevronLeft size={15} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl font-normal leading-tight text-foreground">{poll.question}</h2>
          {poll.description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{poll.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AudienceBadge poll={poll} committees={committees} />
            {poll.expires_at && !poll.is_closed && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={11} /> Closes {formatDatetime(poll.expires_at)}
              </span>
            )}
          </div>
        </div>
        {isEboard && !poll.is_closed && (
          <button type="button" onClick={() => setShowConfirmClose(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground">
            <Lock size={12} /> Close Voting
          </button>
        )}
      </div>

      {poll.is_closed && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border bg-muted/30 px-4 py-3">
          <Lock size={14} className="text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Voting is closed</p>
        </div>
      )}

      {!poll.is_closed && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3" style={{ background: tint(accent.base, 0.03) }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {poll.multi_select ? 'Select all that apply' : 'Choose one'}
            </p>
          </div>
          <div className="divide-y divide-border">
            {poll.options.map((opt) => {
              const isOn = selected.includes(opt.id);
              return (
                <label key={opt.id} className="flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30">
                  <div
                    onClick={() => toggle(opt.id)}
                    className={cn(
                      'flex h-4.5 w-4.5 shrink-0 items-center justify-center border-2 transition-colors',
                      poll.multi_select ? 'rounded-md' : 'rounded-full',
                      isOn ? 'border-transparent' : 'border-border bg-card'
                    )}
                    style={isOn ? { background: accent.gradient, borderColor: 'transparent' } : undefined}
                    role={poll.multi_select ? 'checkbox' : 'radio'}
                    aria-checked={isOn}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === ' ') toggle(opt.id); }}
                  >
                    {isOn && <Check size={9} strokeWidth={3} className="text-white" />}
                  </div>
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              );
            })}
          </div>
          {error && <p className="px-5 pb-2 text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end border-t border-border px-5 py-3">
            <button type="button" onClick={handleVote} disabled={selected.length === 0 || submitting}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: accent.gradient }}>
              {submitting ? 'Submitting...' : hasVoted ? 'Update Vote' : 'Submit Vote'}
            </button>
          </div>
        </div>
      )}

      {(showResults || isEboard) && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3" style={{ background: tint(accent.base, 0.03) }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Results</p>
              <p className="text-xs text-muted-foreground">{poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''} total</p>
            </div>
          </div>
          <div className="space-y-4 px-5 py-4">
            {poll.options.map((opt) => (
              <div key={opt.id}>
                <ResultBar option={opt} total={poll.total_votes} isMyPick={(poll.my_option_ids ?? []).includes(opt.id)} accent={accent} />
                {isEboard && stats && (() => {
                  const statOpt = stats.options.find((s) => s.id === opt.id);
                  if (!statOpt || statOpt.voters.length === 0) return null;
                  return (
                    <div className="ml-1 mt-2 flex flex-wrap gap-x-2 gap-y-0.5">
                      {statOpt.voters.map((v) => (
                        <span key={v.authentik_id} className="text-[11px] text-muted-foreground">{memberDisplayName(v)}</span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isEboard && !showResults && !poll.is_closed && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
          <BarChart3 size={14} className="shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Results are hidden until you vote.</p>
        </div>
      )}

      {showConfirmClose && (
        <ConfirmModal
          title="Close voting?"
          body="This will permanently close the poll. Members will no longer be able to vote or update their vote. This cannot be undone."
          confirmLabel="Close Voting"
          accent={accent}
          onClose={() => setShowConfirmClose(false)}
          onConfirm={handleClose}
        />
      )}
    </>
  );
}

// ─── Tab bar ───

function TabBar({ active, onChange, accent }) {
  const tabs = [
    { id: 'active', label: 'Active' },
    { id: 'history', label: 'History' },
  ];
  return (
    <div className="relative mb-6 flex items-center gap-1 border-b border-border">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button key={tab.id} type="button" onClick={() => onChange(tab.id)}
            className={cn('relative px-4 pb-3 pt-1 text-sm font-medium transition-colors duration-150', isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
            role="tab" aria-selected={isActive}>
            {tab.label}
            {isActive && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ background: accent.base }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main revamped page ───

function RevampedPollsPage({ accentKey }) {
  const accent = ACCENT_THEMES[accentKey] ?? ACCENT_THEMES.blue;
  const { data: session } = useSession();
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;

  const [polls, setPolls] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function loadPolls() {
    setLoading(true);
    Promise.all([getPolls(), getCommittees()])
      .then(([pollsData, committeesData]) => {
        setPolls(Array.isArray(pollsData) ? pollsData : []);
        setCommittees(Array.isArray(committeesData) ? committeesData : []);
      })
      .catch((err) => { if (isRedirectError(err)) throw err; })
      .finally(() => setLoading(false));
  }

  useEffect(loadPolls, []);

  const activePolls = useMemo(() => polls.filter((p) => !p.is_closed), [polls]);
  const historyPolls = useMemo(() => polls.filter((p) => p.is_closed), [polls]);
  const listed = activeTab === 'active' ? activePolls : historyPolls;

  const selected = selectedId ? (polls.find((p) => p.id === selectedId) ?? null) : null;

  function handlePollUpdated(updatedPoll) {
    setPolls((prev) => prev.map((p) => (p.id === updatedPoll.id ? updatedPoll : p)));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>
          Alpha Iota Chapter
        </p>
        <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">Polls</h1>
      </div>

      {selected ? (
        <PollDetail
          poll={selected}
          committees={committees}
          accent={accent}
          isEboard={isEboard}
          onBack={() => setSelectedId(null)}
          onVoted={handlePollUpdated}
          onClosed={loadPolls}
        />
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <div />
            {isEboard && (
              <button type="button" onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: accent.gradient }}>
                <Plus size={12} /> New Poll
              </button>
            )}
          </div>

          <TabBar active={activeTab} onChange={setActiveTab} accent={accent} />

          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Loading polls...</p>
          ) : listed.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card">
              <BarChart3 size={26} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{activeTab === 'active' ? 'No active polls' : 'No past polls'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {listed.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  committees={committees}
                  accent={accent}
                  isEboard={isEboard}
                  onOpen={() => setSelectedId(poll.id)}
                  onDelete={() => setDeleteTarget(poll)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreatePollModal
          accent={accent}
          committees={committees}
          onClose={() => setShowCreate(false)}
          onCreated={(poll) => {
            setPolls((prev) => [poll, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete this poll?"
          body={`"${deleteTarget.question}" and all its votes will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete Poll"
          accent={accent}
          danger
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deletePoll(deleteTarget.id);
            setPolls((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            if (selectedId === deleteTarget.id) setSelectedId(null);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

export default function PollsPage({ accent = 'blue' }) {
  if (accent !== 'blue' && accent !== 'red') {
    return <LegacyPollsPage accent={accent} />;
  }
  return <RevampedPollsPage accentKey={accent} />;
}
