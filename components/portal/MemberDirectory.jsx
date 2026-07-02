'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function MemberDirectory({
  title = 'Directory',
  description = 'Browse chapter members',
  theme = 'blue',
}) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAmber = theme === 'amber';
  const heading = isAmber ? 'text-amber-900' : 'text-blue-900';
  const avatarClass = isAmber ? 'bg-amber-900 text-white' : 'bg-blue-900 text-white';
  const cardHover = isAmber ? 'hover:shadow-amber-200/50' : 'hover:shadow-indigo-200/50';
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

  return (
    <div className="relative space-y-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br ${blobA} opacity-10 blur-[120px]`} />
        <div className={`absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr ${blobB} opacity-10 blur-[110px]`} />
      </div>

      <div>
        <h1 className={`text-3xl font-bold ${heading} mb-2`}>{title}</h1>
        <p className="text-slate-600">{description}</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-center text-sm text-slate-500 py-12">Loading directory…</p>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-slate-600">No members in the directory yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map((member) => {
            const graduation = formatGraduationDate(member.graduationDate);
            const groupClass = GROUP_BADGE[member.memberGroup] ?? 'bg-slate-100 text-slate-800';

            return (
              <Card
                key={member.id ?? member.username}
                className={`ring-1 ring-slate-100 shadow-sm ${cardHover} hover:-translate-y-0.5 transition-all duration-300`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 shrink-0">
                      <AvatarFallback className={avatarClass}>
                        {memberInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg leading-tight">
                        {memberDisplayName(member)}
                      </CardTitle>
                      {member.username && (
                        <CardDescription className="truncate">@{member.username}</CardDescription>
                      )}
                      <div className="mt-2">
                        <Badge className={groupClass}>{formatMemberGroup(member.memberGroup)}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-slate-600">
                  {member.major && <p><span className="font-medium text-slate-700">Major:</span> {member.major}</p>}
                  {member.pledgeClass && (
                    <p><span className="font-medium text-slate-700">Pledge Class:</span> {member.pledgeClass}</p>
                  )}
                  {graduation && (
                    <p><span className="font-medium text-slate-700">Graduation:</span> {graduation}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
