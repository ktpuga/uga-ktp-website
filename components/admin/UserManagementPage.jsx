'use client';

import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { useState, useMemo, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  Search,
  ChevronDown,
  Mail,
  Check,
  X,
  Pencil,
  Plus,
  Users,
  UserCheck,
  GraduationCap,
  Crown,
  AlertCircle,
} from 'lucide-react';
import { getAdminUsers, updateUserGroup, updateExecTitle } from '@/lib/portal-api';
import { formatMemberGroup, memberDisplayName, memberInitials } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';

// Palette now comes from the portal accent context so the Admin red/blue
// toggle reaches this page, not just the sidebar. Each component asks for it
// directly — no prop threading through the sub-components in this file.

// Established 5-color group scheme — used across Directory, Analytics, User Management
const GROUP_COLORS = {
  eboard: '#7f1d1d',
  chair: '#7e22ce',
  active: '#1d4ed8',
  pledge: '#15803d',
  alumni: '#b45309',
  rush: '#0e7490',
};

// Must contain every value in ktp-api's constants/roleGroups.js. Anything
// missing falls through normalizeGroup() to 'unassigned' — which is exactly
// how rushees were showing up here as unassigned rather than as Rushees. The
// same omission previously mislabelled them in MemberDirectory, so treat this
// list and roleGroups.js as one thing in two places.
//
// 'rush' sits last, after alumni: the section order reads roughly as distance
// from the chapter, and a rushee hasn't joined it.
const GROUP_ORDER = ['eboard', 'chair', 'active', 'pledge', 'alumni', 'rush', 'unassigned'];

const STAT_CARDS = [
  { label: 'Total Users', key: 'total', icon: Users },
  { label: 'Members', key: 'active', icon: UserCheck },
  { label: 'Alumni', key: 'alumni', icon: GraduationCap },
  { label: 'Leadership', key: 'leadership', icon: Crown },
];

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function normalizeGroup(raw) {
  if (!raw) return 'unassigned';
  return GROUP_ORDER.includes(raw) ? raw : 'unassigned';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ─── Avatar ───

function Avatar({ user, size = 40 }) {
  const [err, setErr] = useState(false);
  const color = GROUP_COLORS[normalizeGroup(user.member_group)] ?? '#64748b';

  return (
    <div className="shrink-0 overflow-hidden rounded-full ring-2 ring-border" style={{ width: size, height: size }} aria-hidden="true">
      {!err && user.authentik_id ? (
        <img
          src={`/api/users/${user.authentik_id}/profile-picture/media`}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <div className="flex h-full w-full select-none items-center justify-center font-semibold text-white" style={{ background: color, fontSize: size * 0.37 }}>
          {memberInitials(user)}
        </div>
      )}
    </div>
  );
}

// ─── Group badge ───

function GroupBadge({ group }) {
  const color = GROUP_COLORS[group] ?? '#64748b';
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: color }}>
      {formatMemberGroup(group)}
    </span>
  );
}

// ─── Inline select ───

function InlineSelect({ value, options, onChange, placeholder, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-lg border border-border bg-card py-1.5 pl-3 pr-7 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)] disabled:opacity-60"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

// ─── Exec title inline edit ───

function ExecTitleEdit({ authentikId, value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(authentikId, draft.trim() || null);
      setEditing(false);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to update exec title');
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value ?? '');
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="group flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition-colors hover:bg-muted">
        {value ? (
          <span className="font-medium text-foreground">{value}</span>
        ) : (
          <span className="italic text-muted-foreground/70">
            <Plus size={9} className="mr-0.5 inline" />
            Set exec title
          </span>
        )}
        <Pencil size={10} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={saving}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) save();
          if (e.key === 'Escape') cancel();
        }}
        placeholder="e.g. Vice President of Finance"
        className="w-48 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]"
      />
      <button type="button" onClick={save} disabled={saving} className="rounded-md p-1 text-green-700 hover:bg-green-50" aria-label="Save">
        <Check size={12} />
      </button>
      <button type="button" onClick={cancel} disabled={saving} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Cancel">
        <X size={12} />
      </button>
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}

// ─── User card ───

function UserCard({ user, onChangeGroup, onSaveExecTitle }) {
  const group = normalizeGroup(user.member_group);
  const isEboard = group === 'eboard';
  const [saving, setSaving] = useState(false);
  const [groupError, setGroupError] = useState(null);

  const moveOptions = ['eboard', 'chair', 'active', 'pledge', 'alumni']
    .filter((g) => g !== group)
    .map((g) => ({ value: g, label: formatMemberGroup(g) }));

  async function handleMoveTo(newGroup) {
    if (!newGroup) return;
    setSaving(true);
    setGroupError(null);
    try {
      await onChangeGroup(user.authentik_id, newGroup);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setGroupError(err.message ?? 'Failed to update group');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="h-0.5 w-full" style={{ background: GROUP_COLORS[group] ?? '#64748b' }} aria-hidden="true" />

      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <Avatar user={user} size={42} />

          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold leading-snug text-foreground">{memberDisplayName(user)}</span>
              <GroupBadge group={group} />
              {user.profile_complete ? (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  <Check size={8} strokeWidth={3} />Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  <AlertCircle size={8} />Incomplete
                </span>
              )}
              {user.is_test_account && (
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Test
                </span>
              )}
            </div>

            {isEboard && (
              <div className="mb-1">
                <ExecTitleEdit authentikId={user.authentik_id} value={user.exec_title} onSave={onSaveExecTitle} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              {user.email && <span className="max-w-[180px] truncate">{user.email}</span>}
              <span>@{user.username}</span>
              {user.major && <span>{user.major}</span>}
              {user.pledge_class && <span>Class of {user.pledge_class}</span>}
              {user.graduation_date && <span>Grad {formatDate(user.graduation_date)}</span>}
            </div>
            {groupError && <p className="mt-1 text-[11px] text-red-600">{groupError}</p>}
          </div>

          <div className="ml-2 flex shrink-0 flex-col items-end gap-2">
            <a
              href={user.email ? `mailto:${user.email}` : undefined}
              aria-disabled={!user.email}
              className={cn(
                'flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                user.email
                  ? 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  : 'pointer-events-none border-border/40 text-muted-foreground/30'
              )}
            >
              <Mail size={11} />
              Email
            </a>

            <div className="w-36">
              <InlineSelect
                value=""
                options={moveOptions}
                onChange={handleMoveTo}
                placeholder={saving ? 'Moving…' : 'Move to…'}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Group tab panel ───

function GroupPanel({ group, users, allUsers, onChangeGroup, onSaveExecTitle }) {
  const MAROON = useAccentPalette();
  const [addUserId, setAddUserId] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const otherUsers = useMemo(
    () =>
      allUsers
        .filter((u) => normalizeGroup(u.member_group) !== group)
        .map((u) => ({ value: u.authentik_id, label: `${memberDisplayName(u)} — ${formatMemberGroup(normalizeGroup(u.member_group))}` })),
    [allUsers, group]
  );

  async function handleAdd() {
    if (!addUserId || group === 'unassigned') return;
    setAdding(true);
    setAddError(null);
    try {
      await onChangeGroup(addUserId, group);
      setAddUserId('');
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setAddError(err.message ?? 'Failed to add member');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      {group !== 'unassigned' && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3" style={{ background: tint(MAROON.base, 0.02) }}>
          <div className="flex-1">
            <InlineSelect
              value={addUserId}
              options={otherUsers}
              onChange={setAddUserId}
              placeholder={otherUsers.length === 0 ? 'No other members to add' : 'Add an existing member to this group…'}
              disabled={adding || otherUsers.length === 0}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!addUserId || adding}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-35"
            style={{ background: GROUP_COLORS[group] ?? MAROON.gradient }}
          >
            <Plus size={11} />
            {adding ? 'Adding...' : `Add to ${formatMemberGroup(group)}`}
          </button>
          {addError && <span className="shrink-0 text-xs text-red-600">{addError}</span>}
        </div>
      )}

      {users.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card">
          <Users size={20} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No users in this group</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {users.map((u) => (
            <UserCard key={u.authentik_id} user={u} onChangeGroup={onChangeGroup} onSaveExecTitle={onSaveExecTitle} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stat card ───

function StatCard({ label, value, icon: Icon }) {
  const MAROON = useAccentPalette();
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="h-0.5 w-full" style={{ background: MAROON.gradient }} aria-hidden="true" />
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: MAROON.gradient }}>
            <Icon size={16} strokeWidth={1.75} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ───

export default function UserManagementPage() {
  const MAROON = useAccentPalette();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('eboard');

  function loadUsers({ refresh = false } = {}) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    getAdminUsers()
      .then(setUsers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load users from the API');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleChangeGroup(authentikId, group) {
    const updated = await updateUserGroup(authentikId, group);
    setUsers((prev) => prev.map((u) => (u.authentik_id === authentikId ? { ...u, member_group: updated.member_group } : u)));
  }

  async function handleSaveExecTitle(authentikId, execTitle) {
    const updated = await updateExecTitle(authentikId, execTitle);
    setUsers((prev) => prev.map((u) => (u.authentik_id === authentikId ? { ...u, exec_title: updated.exec_title } : u)));
  }

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.member_group === 'active').length,
    alumni: users.filter((u) => u.member_group === 'alumni').length,
    leadership: users.filter((u) => u.member_group === 'eboard' || u.member_group === 'chair').length,
  }), [users]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      if (profileFilter === 'complete' && !u.profile_complete) return false;
      if (profileFilter === 'incomplete' && u.profile_complete) return false;
      if (!q) return true;
      return (
        memberDisplayName(u).toLowerCase().includes(q)
        || u.username.toLowerCase().includes(q)
        || (u.email?.toLowerCase().includes(q) ?? false)
        || (u.major?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [users, search, profileFilter]);

  const grouped = useMemo(() => {
    const map = {};
    for (const g of GROUP_ORDER) map[g] = [];
    for (const u of filtered) {
      map[normalizeGroup(u.member_group)].push(u);
    }
    return map;
  }, [filtered]);

  const visibleTabs = useMemo(
    () => GROUP_ORDER.filter((g) => g !== 'unassigned' || (grouped.unassigned?.length ?? 0) > 0),
    [grouped]
  );

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) setActiveTab(visibleTabs[0] ?? 'eboard');
  }, [visibleTabs, activeTab]);

  const profileOptions = [
    { value: 'all', label: 'All Profiles' },
    { value: 'complete', label: 'Complete Only' },
    { value: 'incomplete', label: 'Incomplete Only' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: MAROON.light }}>
            Admin Panel
          </p>
          <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">User Management</h1>
        </div>
        <button
          type="button"
          onClick={() => loadUsers({ refresh: true })}
          disabled={loading || refreshing}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
          aria-label="Refresh user list"
        >
          <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.key} label={card.label} value={loading ? '-' : stats[card.key]} icon={card.icon} />
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, username, or major…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color']: tint(MAROON.base, 0.25) }}
            onFocus={(e) => { e.currentTarget.style.borderColor = tint(MAROON.base, 0.35); }}
            onBlur={(e) => { e.currentTarget.style.borderColor = ''; }}
          />
        </div>
        <div className="relative w-full sm:w-44">
          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border border-border bg-card py-2.5 pl-3.5 pr-8 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color']: tint(MAROON.base, 0.25) }}
          >
            {profileOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="relative mb-6 border-b border-border">
        <div className="flex items-center gap-0.5 overflow-x-auto" role="tablist">
          {visibleTabs.map((tab) => {
            const count = grouped[tab]?.length ?? 0;
            const isActive = activeTab === tab;
            const color = GROUP_COLORS[tab] ?? '#64748b';

            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative flex items-center gap-1.5 whitespace-nowrap px-4 pb-3 pt-1 text-sm font-medium transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {formatMemberGroup(tab)}
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                  style={{ background: isActive ? tint(color, 0.12) : 'transparent', color: isActive ? color : 'inherit' }}
                >
                  {count}
                </span>
                {isActive && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ background: color }} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading users from the API...</p>
      ) : (
        visibleTabs.includes(activeTab) && (
          <GroupPanel
            key={activeTab}
            group={activeTab}
            users={grouped[activeTab] ?? []}
            allUsers={users}
            onChangeGroup={handleChangeGroup}
            onSaveExecTitle={handleSaveExecTitle}
          />
        )
      )}
    </div>
  );
}
