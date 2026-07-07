'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, Mail, RefreshCw, Search, Shield, UserCheck, Users } from 'lucide-react';
import { getAdminUsers } from '@/lib/portal-api';
import {
  formatGraduationDate,
  formatMemberGroup,
  memberDisplayName,
  memberInitials,
  normalizeApiList,
} from '@/lib/portal-format';

const LEADERSHIP_GROUPS = new Set(['eboard', 'chair']);

const GROUP_BADGE = {
  eboard: 'bg-red-100 text-red-800',
  chair: 'bg-purple-100 text-purple-800',
  active: 'bg-blue-100 text-blue-800',
  pledge: 'bg-green-100 text-green-800',
  alumni: 'bg-amber-100 text-amber-800',
  unknown: 'bg-slate-100 text-slate-800',
};

const PROFILE_BADGE = {
  complete: 'bg-green-100 text-green-800',
  incomplete: 'bg-slate-100 text-slate-800',
};

function cleanValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readField(member, fields) {
  const profile = member?.profile ?? {};

  for (const field of fields) {
    const value = cleanValue(member?.[field]) ?? cleanValue(profile?.[field]);
    if (value) return value;
  }

  return null;
}

function getMemberGroup(member) {
  return readField(member, ['member_group', 'memberGroup', 'group']) ?? 'unknown';
}

function isProfileComplete(member) {
  if (typeof member?.profile_complete === 'boolean') return member.profile_complete;
  if (typeof member?.profileComplete === 'boolean') return member.profileComplete;
  if (typeof member?.profile?.profile_complete === 'boolean') return member.profile.profile_complete;

  return Boolean(
    readField(member, ['first_name', 'firstName'])
      && readField(member, ['last_name', 'lastName']),
  );
}

function userEmail(member) {
  return readField(member, ['email'])
    ?? cleanValue(member?.user?.email)
    ?? cleanValue(member?.authentik?.email);
}

function adminDisplayName(member) {
  const fullName = [
    readField(member, ['first_name', 'firstName']),
    readField(member, ['last_name', 'lastName']),
  ].filter(Boolean).join(' ');

  return readField(member, ['preferred_name', 'preferredName'])
    ?? cleanValue(fullName)
    ?? cleanValue(member?.name)
    ?? cleanValue(member?.user?.name)
    ?? cleanValue(member?.authentik?.name)
    ?? memberDisplayName(member);
}

function adminInitials(member) {
  const name = adminDisplayName(member);
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return (name.slice(0, 2) || memberInitials(member)).toUpperCase();
}

function graduationLabel(member) {
  const value = readField(member, ['graduation_date', 'graduationDate']);
  return value ? formatGraduationDate(value) : null;
}

function searchText(member) {
  return [
    adminDisplayName(member),
    readField(member, ['username']),
    readField(member, ['authentik_id', 'authentikId']),
    userEmail(member),
    readField(member, ['major']),
    readField(member, ['pledge_class', 'pledgeClass']),
    formatMemberGroup(getMemberGroup(member)),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function sortMembers(a, b) {
  const aLast = readField(a, ['last_name', 'lastName']) ?? '';
  const bLast = readField(b, ['last_name', 'lastName']) ?? '';
  const last = aLast.localeCompare(bLast, undefined, { sensitivity: 'base' });
  if (last !== 0) return last;

  return adminDisplayName(a).localeCompare(adminDisplayName(b), undefined, { sensitivity: 'base' });
}

function stableMemberKey(member, index) {
  return member.id
    ?? member.authentik_id
    ?? member.authentikId
    ?? member.username
    ?? `${adminDisplayName(member)}-${index}`;
}

function UserRow({ member, accent = 'red' }) {
  const group = getMemberGroup(member);
  const email = userEmail(member);
  const graduation = graduationLabel(member);
  const complete = isProfileComplete(member);
  const major = readField(member, ['major']);
  const pledgeClass = readField(member, ['pledge_class', 'pledgeClass']);
  const username = readField(member, ['username']);
  const authentikId = readField(member, ['authentik_id', 'authentikId']);
  const avatarClass = accent === 'amber' ? 'bg-amber-800 text-white' : 'bg-red-900 text-white';

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar className="h-11 w-11 shrink-0 sm:h-12 sm:w-12">
            {authentikId && (
              <AvatarImage src={`/api/users/${authentikId}/profile-picture/media`} alt={adminDisplayName(member)} />
            )}
            <AvatarFallback className={avatarClass}>{adminInitials(member)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 truncate font-semibold text-gray-900 dark:text-slate-100">
                {adminDisplayName(member)}
              </h3>
              <Badge className={GROUP_BADGE[group] ?? GROUP_BADGE.unknown}>{formatMemberGroup(group)}</Badge>
              <Badge className={complete ? PROFILE_BADGE.complete : PROFILE_BADGE.incomplete}>
                {complete ? 'Profile complete' : 'Profile incomplete'}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-slate-400">
              {email && <span>{email}</span>}
              {username && <span>@{username}</span>}
              {!username && authentikId && <span>{authentikId}</span>}
              {major && <span>{major}</span>}
              {pledgeClass && <span>{pledgeClass}</span>}
              {graduation && <span>{graduation}</span>}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {email ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <Mail className="mr-2 h-4 w-4" />
              No Email
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <Users className="mb-4 h-12 w-12 text-slate-400" />
        <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">{message}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminUsers() {
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [profileFilter, setProfileFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function loadMembers({ refresh = false } = {}) {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getAdminUsers();
      setMembers(normalizeApiList(data));
    } catch (err) {
      setError(err.message ?? 'Could not load users from the API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const { activeUsers, alumniUsers, filteredActive, filteredAlumni, stats } = useMemo(() => {
    const sorted = [...members].sort(sortMembers);
    const active = sorted.filter((member) => getMemberGroup(member) !== 'alumni');
    const alumni = sorted.filter((member) => getMemberGroup(member) === 'alumni');
    const matchesFilters = (member) => {
      const q = searchQuery.trim().toLowerCase();
      const group = getMemberGroup(member);
      const complete = isProfileComplete(member);

      return (
        (!q || searchText(member).includes(q))
        && (groupFilter === 'all' || group === groupFilter)
        && (profileFilter === 'all'
          || (profileFilter === 'complete' && complete)
          || (profileFilter === 'incomplete' && !complete))
      );
    };

    return {
      activeUsers: active,
      alumniUsers: alumni,
      filteredActive: active.filter(matchesFilters),
      filteredAlumni: alumni.filter(matchesFilters),
      stats: {
        total: sorted.length,
        active: active.length,
        alumni: alumni.length,
        leadership: sorted.filter((member) => LEADERSHIP_GROUPS.has(getMemberGroup(member))).length,
      },
    };
  }, [members, searchQuery, groupFilter, profileFilter]);

  return (
    <div className="relative space-y-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden dark:hidden">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-red-500 via-rose-400 to-orange-300 opacity-10 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-orange-300 via-red-400 to-rose-500 opacity-10 blur-[110px]" />
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-red-900 dark:text-red-100">User Management</h1>
          <p className="text-gray-600 dark:text-slate-400">Manage member and alumni accounts from the admin API</p>
        </div>
        <Button
          className="bg-red-900 hover:bg-red-800"
          onClick={() => loadMembers({ refresh: true })}
          disabled={loading || refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users },
          { label: 'Members', value: stats.active, icon: UserCheck },
          { label: 'Alumni', value: stats.alumni, icon: GraduationCap },
          { label: 'Leadership', value: stats.leadership, icon: Shield },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardDescription>{label}</CardDescription>
                <Icon className="h-4 w-4 text-red-800 dark:text-red-300" />
              </div>
              <CardTitle className="text-2xl">{loading ? '-' : value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, email, username, group, or major..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">All Groups</option>
              <option value="eboard">E-Board</option>
              <option value="chair">Chair</option>
              <option value="active">Active</option>
              <option value="pledge">Pledge</option>
              <option value="alumni">Alumni</option>
              <option value="unknown">Unknown</option>
            </select>
            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">All Profiles</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1">
          <TabsTrigger value="members" className="min-w-0 px-2 py-2 text-xs sm:text-sm">
            Members ({activeUsers.length})
          </TabsTrigger>
          <TabsTrigger value="alumni" className="min-w-0 px-2 py-2 text-xs sm:text-sm">
            Alumni ({alumniUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6 space-y-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading users from the API...</p>
          ) : filteredActive.length === 0 ? (
            <EmptyState message="No member accounts match the current filters." />
          ) : (
            <div className="grid gap-4">
              {filteredActive.map((member, index) => (
                <UserRow key={stableMemberKey(member, index)} member={member} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alumni" className="mt-6 space-y-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading users from the API...</p>
          ) : filteredAlumni.length === 0 ? (
            <EmptyState message="No alumni accounts match the current filters." />
          ) : (
            <div className="grid gap-4">
              {filteredAlumni.map((member, index) => (
                <UserRow key={stableMemberKey(member, index)} member={member} accent="amber" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
