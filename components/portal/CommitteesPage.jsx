'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Trash2, ArrowLeft, Star, UserPlus, X, CalendarPlus, Search } from 'lucide-react';
import {
  getCommittees,
  createCommittee,
  deleteCommittee,
  joinCommittee,
  leaveCommittee,
  getCommitteeMembers,
  setCommitteeMemberRole,
  getMemberDirectory,
  createEvent,
} from '@/lib/portal-api';
import { memberDisplayName, memberInitials } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';

const ACCENTS = {
  blue: { heading: 'text-blue-900 dark:text-blue-100', button: 'bg-blue-800 hover:bg-blue-700' },
  amber: { heading: 'text-amber-900 dark:text-amber-100', button: 'bg-amber-800 hover:bg-amber-700' },
  red: { heading: 'text-red-900 dark:text-red-100', button: 'bg-red-800 hover:bg-red-700' },
};

function CreateCommitteeForm({ accentClass, onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const committee = await createCommittee(name.trim());
      onCreated(committee);
      setName('');
      setOpen(false);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to create committee');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> New Committee
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Committee name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <div className="flex gap-2">
            <Button type="submit" className={accentClass} disabled={!name.trim() || submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}

function PromoteMemberPicker({ excludeIds, onPick, onCancel }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getMemberDirectory()
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load members');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => !excludeIds.includes(m.id))
      .filter((m) => !q || memberDisplayName(m).toLowerCase().includes(q));
  }, [members, query, excludeIds]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search members..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {filtered.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onPick(member)}
              className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <span className="text-gray-900 dark:text-slate-100">{memberDisplayName(member)}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-500">No matches.</p>}
        </div>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
    </div>
  );
}

const EMPTY_MEETING_FORM = { title: '', description: '', location: '', start: '', end: '', calendlyUrl: '' };

function ScheduleMeetingForm({ committeeId, accentClass, onScheduled, onCancel }) {
  const [form, setForm] = useState(EMPTY_MEETING_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setError(null);
    const startDate = new Date(form.start);
    const endDate = new Date(form.end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError('Enter a valid start and end time.');
      return;
    }
    if (endDate <= startDate) {
      setError('End time must be after start time.');
      return;
    }

    setSaving(true);
    try {
      const result = await createEvent({
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        committeeId,
        calendlyUrl: form.calendlyUrl.trim() || null,
      });

      if (!result?.ok) {
        setError(result?.error ?? 'Failed to schedule meeting.');
        return;
      }

      setForm(EMPTY_MEETING_FORM);
      onScheduled();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to schedule meeting.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900 dark:text-slate-100">Schedule Meeting</p>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea
          placeholder="Optional details..."
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          <Input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
        </div>
        <Input
          placeholder="Calendly link (optional)"
          value={form.calendlyUrl}
          onChange={(e) => setForm({ ...form, calendlyUrl: e.target.value })}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            className={accentClass}
            onClick={handleSubmit}
            disabled={saving || !form.title.trim() || !form.start || !form.end}
          >
            <CalendarPlus className="mr-2 h-4 w-4" /> {saving ? 'Scheduling...' : 'Schedule'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CommitteeDetail({ committee, isEboard, accentClass, onBack, onChanged }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promoting, setPromoting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [busy, setBusy] = useState(false);

  function loadMembers() {
    setLoading(true);
    getCommitteeMembers(committee.id)
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load members');
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadMembers, [committee.id]);

  async function handleJoin() {
    setBusy(true);
    try {
      await joinCommittee(committee.id);
      loadMembers();
      onChanged();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to join committee');
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    try {
      await leaveCommittee(committee.id);
      loadMembers();
      onChanged();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to leave committee');
    } finally {
      setBusy(false);
    }
  }

  async function handleSetRole(userId, role) {
    try {
      await setCommitteeMemberRole(committee.id, userId, role);
      loadMembers();
      onChanged();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to update role');
    }
  }

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">{committee.name}</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {members.length} member{members.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {committee.is_chair && (
            <Button type="button" size="sm" className={accentClass} onClick={() => setScheduling((v) => !v)}>
              <CalendarPlus className="mr-2 h-4 w-4" /> Schedule Meeting
            </Button>
          )}
          {committee.is_member ? (
            <Button type="button" variant="outline" size="sm" onClick={handleLeave} disabled={busy}>
              Leave
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={handleJoin} disabled={busy}>
              Join
            </Button>
          )}
        </div>
      </div>

      {scheduling && (
        <ScheduleMeetingForm
          committeeId={committee.id}
          accentClass={accentClass}
          onCancel={() => setScheduling(false)}
          onScheduled={() => {
            setScheduling(false);
            onChanged();
          }}
        />
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="py-6 text-center text-sm text-gray-500">Loading members...</p>
      ) : (
        <div className="space-y-1 rounded-lg border border-gray-200 p-3 dark:border-slate-700">
          {members.map((member) => (
            <div key={member.authentik_id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-gray-900 dark:text-slate-100">{memberDisplayName(member)}</span>
                {member.role === 'chair' && (
                  <Badge className="shrink-0 gap-1 bg-amber-100 text-amber-800">
                    <Star className="h-3 w-3" /> Chair
                  </Badge>
                )}
              </div>
              {isEboard && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={() => handleSetRole(member.authentik_id, member.role === 'chair' ? 'member' : 'chair')}
                >
                  {member.role === 'chair' ? 'Demote' : 'Promote to chair'}
                </Button>
              )}
            </div>
          ))}
          {members.length === 0 && <p className="py-2 text-sm text-gray-500">No members yet.</p>}
        </div>
      )}

      {isEboard && (
        promoting ? (
          <PromoteMemberPicker
            excludeIds={members.map((m) => m.authentik_id)}
            onPick={(member) => {
              setPromoting(false);
              handleSetRole(member.id, 'chair');
            }}
            onCancel={() => setPromoting(false)}
          />
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setPromoting(true)} className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Promote a member to chair
          </Button>
        )
      )}
    </div>
  );
}

export default function CommitteesPage({ accent = 'blue' }) {
  const { data: session } = useSession();
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;
  const styles = ACCENTS[accent] ?? ACCENTS.blue;

  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  function loadCommittees() {
    setLoading(true);
    getCommittees()
      .then(setCommittees)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load committees');
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadCommittees, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this committee? This cannot be undone.')) return;
    try {
      await deleteCommittee(id);
      setCommittees((prev) => prev.filter((c) => c.id !== id));
      setSelectedId(null);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete committee');
    }
  }

  const selected = committees.find((c) => c.id === selectedId);

  if (selected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className={`mb-2 text-2xl font-bold sm:text-3xl ${styles.heading}`}>Committees</h1>
        </div>
        <CommitteeDetail
          committee={selected}
          isEboard={isEboard}
          accentClass={styles.button}
          onBack={() => setSelectedId(null)}
          onChanged={loadCommittees}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className={`mb-2 text-2xl font-bold sm:text-3xl ${styles.heading}`}>Committees</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Join a committee, or manage one if you chair it
          </p>
        </div>
        {isEboard && <CreateCommitteeForm accentClass={styles.button} onCreated={(c) => setCommittees((prev) => [...prev, c])} />}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500 sm:py-12">Loading committees...</p>
      ) : committees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
            <Users className="mb-4 h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-slate-400">No committees yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {committees.map((committee) => (
            <Card key={committee.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelectedId(committee.id)}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{committee.name}</p>
                  {isEboard && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 shrink-0 p-0 text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(committee.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {committee.member_count} member{committee.member_count === 1 ? '' : 's'}
                </p>
                <div className="flex gap-1.5">
                  {committee.is_chair && (
                    <Badge className="gap-1 bg-amber-100 text-amber-800">
                      <Star className="h-3 w-3" /> Chair
                    </Badge>
                  )}
                  {committee.is_member && !committee.is_chair && (
                    <Badge variant="outline">Member</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
