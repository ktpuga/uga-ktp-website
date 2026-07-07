'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Search, Mail, Users as UsersIcon } from 'lucide-react';
import { getMembers } from '@/lib/portal-api';
import { memberDisplayName, memberInitials, formatMemberGroup, formatGraduationDate } from '@/lib/portal-format';

const GROUP_BADGE = {
  eboard: 'bg-red-100 text-red-800',
  chair: 'bg-purple-100 text-purple-800',
  active: 'bg-blue-100 text-blue-800',
  pledge: 'bg-green-100 text-green-800',
  alumni: 'bg-amber-100 text-amber-800',
};

function MemberRow({ member }) {
  const name = memberDisplayName(member);
  const graduation = formatGraduationDate(member.graduation_date);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar className="h-12 w-12 shrink-0">
            {member.authentik_id && (
              <AvatarImage src={`/api/users/${member.authentik_id}/profile-picture/media`} alt={name} />
            )}
            <AvatarFallback className="bg-red-900 text-white">{memberInitials(member)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-gray-900">{name}</h3>
              <Badge className={GROUP_BADGE[member.member_group] ?? 'bg-gray-100 text-gray-800'}>
                {formatMemberGroup(member.member_group)}
              </Badge>
              {!member.profile_complete && (
                <Badge className="bg-yellow-100 text-yellow-800">Profile incomplete</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-600">
              {member.email && <span className="truncate">{member.email}</span>}
              {member.major && (
                <>
                  <span>•</span>
                  <span>{member.major}</span>
                </>
              )}
              {member.pledge_class && (
                <>
                  <span>•</span>
                  <span>{member.pledge_class} Class</span>
                </>
              )}
              {graduation && (
                <>
                  <span>•</span>
                  <span>Grad {graduation}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {member.email && (
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <a href={`mailto:${member.email}`}>
              <Mail className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function MemberList({ members, emptyMessage }) {
  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center">
          <UsersIcon className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-gray-600">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {members.map((member) => (
        <MemberRow key={member.authentik_id ?? member.username} member={member} />
      ))}
    </div>
  );
}

export default function AdminUsers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');

  useEffect(() => {
    getMembers()
      .then(setMembers)
      .catch((err) => setError(err.message ?? 'Could not load members'))
      .finally(() => setLoading(false));
  }, []);

  function matchesSearchAndGroup(member) {
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      memberDisplayName(member).toLowerCase().includes(q) ||
      (member.email ?? '').toLowerCase().includes(q) ||
      (member.username ?? '').toLowerCase().includes(q);
    const matchesGroup = filterGroup === 'all' || member.member_group === filterGroup;
    return matchesQuery && matchesGroup;
  }

  const activeMembers = useMemo(
    () => members.filter((m) => m.member_group !== 'alumni').filter(matchesSearchAndGroup),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members, searchQuery, filterGroup],
  );
  const alumniMembers = useMemo(
    () => members.filter((m) => m.member_group === 'alumni').filter(matchesSearchAndGroup),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [members, searchQuery, filterGroup],
  );

  const leadershipCount = members.filter((m) => m.member_group === 'eboard' || m.member_group === 'chair').length;

  return (
    <div className="relative space-y-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden dark:hidden">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-red-500 via-rose-400 to-orange-300 opacity-10 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-orange-300 via-red-400 to-rose-500 opacity-10 blur-[110px]" />
      </div>

      <div>
        <h1 className="mb-2 text-3xl font-bold text-red-900">User Management</h1>
        <p className="text-gray-600">Real member and alumni accounts, pulled live from the chapter database</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Members', value: members.length },
          { label: 'Active Members', value: members.filter((m) => m.member_group === 'active').length },
          { label: 'Alumni', value: members.filter((m) => m.member_group === 'alumni').length },
          { label: 'Leadership', value: leadershipCount },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-3">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{loading ? '—' : value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Members ({loading ? '—' : activeMembers.length})</TabsTrigger>
          <TabsTrigger value="alumni">Alumni ({loading ? '—' : alumniMembers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name, username, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Groups</option>
                  <option value="eboard">Eboard</option>
                  <option value="chair">Chair</option>
                  <option value="active">Active</option>
                  <option value="pledge">Pledge</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">Loading members...</p>
          ) : (
            <MemberList members={activeMembers} emptyMessage="No members match your search." />
          )}
        </TabsContent>

        <TabsContent value="alumni" className="mt-6 space-y-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">Loading alumni...</p>
          ) : (
            <MemberList members={alumniMembers} emptyMessage="No alumni match your search." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
