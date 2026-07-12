'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Vote, Plus, Trash2, X, ArrowLeft, Lock, CheckCircle2, Users as UsersIcon } from 'lucide-react';
import {
  getPolls,
  createPoll,
  deletePoll,
  closePoll,
  votePoll,
  getPollStats,
  getCommittees,
} from '@/lib/portal-api';
import { formatAudience, formatMessageTime, memberDisplayName } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useConfirm } from '@/components/ui/confirm-dialog';
import AudienceSelect from '@/components/portal/AudienceSelect';

const ACCENTS = {
  blue: { heading: 'text-blue-900 dark:text-blue-100', button: 'bg-blue-800 hover:bg-blue-700' },
  amber: { heading: 'text-amber-900 dark:text-amber-100', button: 'bg-amber-800 hover:bg-amber-700' },
  red: { heading: 'text-red-900 dark:text-red-100', button: 'bg-red-800 hover:bg-red-700' },
};

const EMPTY_FORM = { question: '', description: '', options: ['', ''], multiSelect: false, audience: [], committeeId: '', expiresAt: '' };

function pollBadgeLabel(poll, committees) {
  if (poll.committee_id) {
    const committee = committees.find((c) => c.id === poll.committee_id);
    return committee ? `Committee: ${committee.name}` : 'Committee';
  }
  return formatAudience(poll.audience);
}

function ResultBar({ label, count, total, highlight }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={highlight ? 'font-medium text-gray-900 dark:text-slate-100' : 'text-gray-700 dark:text-slate-300'}>
          {label} {highlight && <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-green-600" />}
        </span>
        <span className="text-gray-500 dark:text-slate-400">{count} ({pct}%)</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CreatePollForm({ accentClass, committees, onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function updateOption(index, value) {
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === index ? value : o)) }));
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, ''] }));
  }

  function removeOption(index) {
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== index) }));
  }

  async function handleSubmit() {
    setError(null);
    const options = form.options.map((o) => o.trim()).filter(Boolean);
    if (!form.question.trim()) {
      setError('Question is required.');
      return;
    }
    if (options.length < 2) {
      setError('At least 2 non-empty options are required.');
      return;
    }

    let expiresAtIso = null;
    if (form.expiresAt) {
      const parsed = new Date(form.expiresAt);
      if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
        setError('Expiration must be a valid time in the future.');
        return;
      }
      expiresAtIso = parsed.toISOString();
    }

    setSaving(true);
    try {
      const poll = await createPoll({
        question: form.question.trim(),
        description: form.description.trim(),
        options,
        multiSelect: form.multiSelect,
        audience: form.committeeId ? [] : form.audience,
        committeeId: form.committeeId || null,
        expiresAt: expiresAtIso,
      });
      setForm(EMPTY_FORM);
      onCreated(poll);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to create poll');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create New Poll</CardTitle>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <CardDescription>Ask the chapter (or a committee) to vote on something</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Question</label>
          <Input
            placeholder="What should we vote on?"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description (optional)</label>
          <Textarea
            rows={2}
            placeholder="Extra context for voters..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Options</label>
          {form.options.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder={`Option ${i + 1}`}
                value={option}
                onChange={(e) => updateOption(i, e.target.value)}
              />
              {form.options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} className="shrink-0 text-gray-400 hover:text-red-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addOption} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add option
          </Button>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.multiSelect}
            onChange={(e) => setForm({ ...form, multiSelect: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          Allow selecting multiple options
        </label>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Expires (optional)</label>
          <Input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Voting closes automatically at this time. Leave blank to close it manually instead.
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Committee poll (optional)</label>
          <select
            value={form.committeeId}
            onChange={(e) => setForm({ ...form, committeeId: e.target.value })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">Not a committee poll</option>
            {committees.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {form.committeeId ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visible only to that committee&apos;s members — audience targeting below is disabled.
            </p>
          ) : null}
        </div>
        {!form.committeeId && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Audience</label>
            <AudienceSelect value={form.audience} onChange={(audience) => setForm({ ...form, audience })} />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button className={`flex-1 ${accentClass}`} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating...' : 'Create Poll'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Ballot({ poll, accentClass, onVoted }) {
  const [selected, setSelected] = useState(poll.my_option_ids ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSelected(poll.my_option_ids ?? []);
  }, [poll.id]);

  function toggle(optionId) {
    if (poll.multi_select) {
      setSelected((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]));
    } else {
      setSelected([optionId]);
    }
  }

  async function handleSubmit() {
    if (selected.length === 0) return;
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

  const hasVoted = (poll.my_option_ids ?? []).length > 0;

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-slate-700">
        {poll.options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-md p-1.5 text-sm text-gray-800 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <input
              type={poll.multi_select ? 'checkbox' : 'radio'}
              name={`poll-${poll.id}`}
              checked={selected.includes(option.id)}
              onChange={() => toggle(option.id)}
              className="h-4 w-4 border-gray-300"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button className={accentClass} onClick={handleSubmit} disabled={selected.length === 0 || submitting}>
        {submitting ? 'Submitting...' : hasVoted ? 'Update Vote' : 'Submit Vote'}
      </Button>
    </div>
  );
}

function StatsView({ pollId }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPollStats(pollId)
      .then(setStats)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load stats');
      });
  }, [pollId]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!stats) return <p className="text-sm text-gray-500">Loading stats...</p>;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-slate-700">
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
        <UsersIcon className="h-4 w-4" /> {stats.total_votes} total vote{stats.total_votes === 1 ? '' : 's'} — eboard view
      </div>
      {stats.options.map((option) => (
        <div key={option.id} className="space-y-1.5">
          <ResultBar label={option.label} count={option.vote_count} total={stats.total_votes} />
          {option.voters.length > 0 && (
            <p className="pl-1 text-xs text-gray-500 dark:text-slate-400">
              {option.voters.map(memberDisplayName).join(', ')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function PollCard({ poll, committees, isEboard, onSelect, onDelete }) {
  const hasVoted = (poll.my_option_ids ?? []).length > 0;

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onSelect}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-900 dark:text-slate-100">{poll.question}</p>
          {isEboard && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 shrink-0 p-0 text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(poll.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          {poll.total_votes} vote{poll.total_votes === 1 ? '' : 's'} · Posted {formatMessageTime(poll.created_at)}
          {poll.expires_at && !poll.is_closed ? ` · Closes ${formatMessageTime(poll.expires_at)}` : ''}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{pollBadgeLabel(poll, committees)}</Badge>
          {poll.is_closed ? (
            <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" /> Closed</Badge>
          ) : hasVoted ? (
            <Badge className="gap-1 bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3" /> Voted</Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-800">Vote now</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PollGrid({ polls, committees, isEboard, onSelect, onDelete, emptyMessage }) {
  if (polls.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
          <Vote className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-slate-400">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          committees={committees}
          isEboard={isEboard}
          onSelect={() => onSelect(poll.id)}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function PollDetail({ poll, isEboard, accentClass, onBack, onChanged }) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  const hasVoted = (poll.my_option_ids ?? []).length > 0;
  const showAggregateResults = !isEboard && (hasVoted || poll.is_closed);

  async function handleClose() {
    if (!(await confirm('Close this poll? Members will no longer be able to vote.'))) return;
    setBusy(true);
    try {
      await closePoll(poll.id);
      onChanged();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to close poll');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">{poll.question}</h2>
          {poll.description && <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{poll.description}</p>}
          {poll.expires_at && !poll.is_closed && (
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Closes automatically {formatMessageTime(poll.expires_at)}
            </p>
          )}
        </div>
        {isEboard && !poll.is_closed && (
          <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={busy} className="gap-1.5">
            <Lock className="h-3.5 w-3.5" /> Close Voting
          </Button>
        )}
      </div>

      {poll.is_closed ? (
        <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" /> Closed</Badge>
      ) : (
        <Ballot poll={poll} accentClass={accentClass} onVoted={onChanged} />
      )}

      {showAggregateResults && (
        <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-slate-700">
          {poll.options.map((option) => (
            <ResultBar
              key={option.id}
              label={option.label}
              count={option.vote_count}
              total={poll.total_votes}
              highlight={(poll.my_option_ids ?? []).includes(option.id)}
            />
          ))}
        </div>
      )}

      {isEboard && <StatsView pollId={poll.id} />}
    </div>
  );
}

export default function PollsPage({ accent = 'blue' }) {
  const confirm = useConfirm();
  const { data: session } = useSession();
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;
  const styles = ACCENTS[accent] ?? ACCENTS.blue;

  const [polls, setPolls] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);

  function loadPolls() {
    setLoading(true);
    Promise.all([getPolls(), getCommittees()])
      .then(([pollsData, committeesData]) => {
        setPolls(Array.isArray(pollsData) ? pollsData : []);
        setCommittees(Array.isArray(committeesData) ? committeesData : []);
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load polls');
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadPolls, []);

  async function handleDelete(id) {
    if (!(await confirm('Delete this poll? This cannot be undone.'))) return;
    try {
      await deletePoll(id);
      setPolls((prev) => prev.filter((p) => p.id !== id));
      setSelectedId(null);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete poll');
    }
  }

  const selected = useMemo(() => polls.find((p) => p.id === selectedId), [polls, selectedId]);
  const activePolls = useMemo(() => polls.filter((p) => !p.is_closed), [polls]);
  const pastPolls = useMemo(() => polls.filter((p) => p.is_closed), [polls]);

  function handlePollUpdated(updatedPoll) {
    setPolls((prev) => prev.map((p) => (p.id === updatedPoll.id ? updatedPoll : p)));
  }

  if (selected) {
    return (
      <div className="space-y-6">
        <h1 className={`mb-2 text-2xl font-bold sm:text-3xl ${styles.heading}`}>Polls</h1>
        <PollDetail
          poll={selected}
          isEboard={isEboard}
          accentClass={styles.button}
          onBack={() => setSelectedId(null)}
          onChanged={(updated) => {
            if (updated) handlePollUpdated(updated);
            else loadPolls();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className={`mb-2 text-2xl font-bold sm:text-3xl ${styles.heading}`}>Polls</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Vote on chapter and committee polls
          </p>
        </div>
        {isEboard && (
          <Button type="button" className={styles.button} onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Poll
          </Button>
        )}
      </div>

      {creating && (
        <CreatePollForm
          accentClass={styles.button}
          committees={committees}
          onCancel={() => setCreating(false)}
          onCreated={(poll) => {
            setPolls((prev) => [poll, ...prev]);
            setCreating(false);
          }}
        />
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500 sm:py-12">Loading polls...</p>
      ) : (
        <Tabs defaultValue="active" className="w-full min-w-0">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:w-auto sm:inline-grid">
            <TabsTrigger value="active" className="min-w-0 px-3 py-2 text-xs sm:text-sm">
              Active ({activePolls.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="min-w-0 px-3 py-2 text-xs sm:text-sm">
              History ({pastPolls.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <PollGrid
              polls={activePolls}
              committees={committees}
              isEboard={isEboard}
              onSelect={setSelectedId}
              onDelete={handleDelete}
              emptyMessage="No active polls right now."
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <PollGrid
              polls={pastPolls}
              committees={committees}
              isEboard={isEboard}
              onSelect={setSelectedId}
              onDelete={handleDelete}
              emptyMessage="No past polls yet — closed polls will show up here."
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
