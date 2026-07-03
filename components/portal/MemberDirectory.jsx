'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { getMemberDirectory } from '@/lib/portal-api';
import {
  memberDisplayName,
  memberInitials,
  formatMemberGroup,
  formatGraduationDate,
} from '@/lib/portal-format';

const GROUP_BADGE = {
  eboard: 'bg-red-100 text-red-800',
  chair: 'bg-purple-100 text-purple-800',
  active: 'bg-blue-100 text-blue-800',
  pledge: 'bg-green-100 text-green-800',
  alumni: 'bg-amber-100 text-amber-800',
};

function directoryDisplayName(member) {
  const first = member.preferredName ?? member.firstName;
  const last = member.lastName;
  const fullName = [first, last].filter(Boolean).join(' ');
  return fullName || memberDisplayName(member);
}

function directorySortLabel(member) {
  const first = member.preferredName ?? member.firstName ?? '';
  const last = member.lastName ?? '';
  const fallback = member.username ?? memberDisplayName(member);
  return [last, first, fallback].filter(Boolean).join(' ') || 'Member';
}

export default function MemberDirectory({
  title = 'Directory',
  description = 'Browse chapter members',
  theme = 'blue',
}) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAmber = theme === 'amber';
  const heading = isAmber ? 'text-amber-900 dark:text-amber-100' : 'text-blue-900 dark:text-blue-100';
  const avatarClass = isAmber ? 'bg-amber-900 text-white dark:bg-amber-700' : 'bg-blue-900 text-white dark:bg-blue-700';
  const blobA = isAmber
    ? 'from-amber-400 via-orange-300 to-yellow-200'
    : 'from-indigo-500 via-fuchsia-500 to-cyan-400';
  const blobB = isAmber
    ? 'from-yellow-200 via-amber-400 to-orange-300'
    : 'from-cyan-400 via-indigo-500 to-fuchsia-500';

  useEffect(() => {
    getMemberDirectory()
      .then(setMembers)
      .catch((err) => setError(err.message ?? 'Could not load directory'))
      .finally(() => setLoading(false));
  }, []);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) =>
      directorySortLabel(a).localeCompare(directorySortLabel(b), undefined, { sensitivity: 'base' }),
    ),
    [members],
  );

  return (
    <div className="relative space-y-6 overflow-x-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden sm:block dark:hidden">
        <div className={`absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br ${blobA} opacity-10 blur-[120px]`} />
        <div className={`absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr ${blobB} opacity-10 blur-[110px]`} />
      </div>

      <div>
        <h1 className={`mb-2 text-2xl font-bold sm:text-3xl ${heading}`}>{title}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 sm:text-base">{description}</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400 sm:py-12">Loading directory...</p>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
            <Users className="mb-4 h-12 w-12 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400">No members in the directory yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.85fr)_auto] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 md:grid">
            <span>Name</span>
            <span>Major</span>
            <span>Class</span>
            <span className="justify-self-end">Status</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedMembers.map((member) => {
              const graduation = formatGraduationDate(member.graduationDate);
              const groupClass = GROUP_BADGE[member.memberGroup] ?? 'bg-slate-100 text-slate-800';
              const classSummary = [member.pledgeClass, graduation].filter(Boolean).join(' / ') || 'Not listed';

              return (
                <div
                  key={member.id ?? member.username ?? directorySortLabel(member)}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.85fr)_auto] md:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">
                      <AvatarFallback className={avatarClass}>
                        {memberInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100 sm:text-base">
                        {directoryDisplayName(member)}
                      </p>
                      {member.username && (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">@{member.username}</p>
                      )}
                    </div>
                  </div>
                  <div className="hidden min-w-0 text-sm text-slate-600 dark:text-slate-400 md:block">
                    <span className="block truncate">{member.major || 'Not listed'}</span>
                  </div>
                  <div className="hidden min-w-0 text-sm text-slate-600 dark:text-slate-400 md:block">
                    <span className="block truncate">{classSummary}</span>
                  </div>
                  <Badge className={`justify-self-end whitespace-nowrap ${groupClass}`}>
                    {formatMemberGroup(member.memberGroup)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
