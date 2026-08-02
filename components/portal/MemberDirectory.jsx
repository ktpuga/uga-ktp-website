'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Users, X, MessageSquare, Mail, CalendarDays, ChevronUp, ChevronDown,
  AlertCircle, Loader2, GraduationCap, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMemberDirectory } from '@/lib/portal-api';
import {
  memberDisplayName,
  memberInitials,
  formatMemberGroup,
  formatGraduationDate,
} from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import ReportButton from './ReportButton';
import BlockButton from './BlockButton';

const ACCENT_THEMES = {
  blue: {
    base: '#1e3a8a',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
    light: '#1d4ed8',
    muted: 'rgba(30,58,138,0.10)',
  },
  amber: {
    base: '#b45309',
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    light: '#d97706',
    muted: 'rgba(180,83,9,0.10)',
  },
  teal: {
    base: '#134e4a',
    gradient: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)',
    light: '#0f766e',
    muted: 'rgba(19,78,74,0.10)',
  },
};

const GROUP_ORDER = ['eboard', 'chair', 'active', 'pledge', 'alumni'];

const GROUP_COLOR = {
  eboard: '#7f1d1d',
  chair: '#7e22ce',
  active: '#1d4ed8',
  pledge: '#15803d',
  alumni: '#b45309',
};

const GROUP_BG = {
  eboard: 'rgba(127,29,29,0.10)',
  chair: 'rgba(126,34,206,0.10)',
  active: 'rgba(29,78,216,0.10)',
  pledge: 'rgba(21,128,61,0.10)',
  alumni: 'rgba(180,83,9,0.10)',
};

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Specific role/title if there is one (an eboard member's exec_title, or
// which committee a chair runs) — shown alongside, not instead of, the
// group badge, since the internal Directory still wants the raw group too.
function specificRole(member) {
  if (member.execTitle) return member.execTitle;
  if (member.chairedCommittees?.length > 0) return `Chair, ${member.chairedCommittees.join(' & ')}`;
  return null;
}

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

// ─── Legacy directory (Alumni portal — deliberately untouched) ───

const GROUP_BADGE = {
  eboard: 'bg-red-100 text-red-800',
  chair: 'bg-purple-100 text-purple-800',
  active: 'bg-blue-100 text-blue-800',
  pledge: 'bg-green-100 text-green-800',
  alumni: 'bg-amber-100 text-amber-800',
};

function LegacyProfileModal({ member, avatarClass, onClose }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSelf = session?.user?.authentik_id === member.id;
  const portalRoot = '/' + (pathname.split('/')[1] || 'member');
  const name = directoryDisplayName(member);
  const graduation = formatGraduationDate(member.graduationDate);
  const role = specificRole(member);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-lg bg-white dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-2">
          {!isSelf ? (
            <ReportButton contentType="user" reportedUserId={member.id} />
          ) : (
            <span />
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col items-center gap-3 px-6 pb-6 text-center">
          {/* Larger than the list rows on purpose — this modal is where someone
              has deliberately opened a person, so the photo is the point.
              Fallback text scales with it, or initials float in a large circle. */}
          <Avatar className="h-32 w-32 sm:h-36 sm:w-36">
            {member.id && (
              <AvatarImage src={`/api/users/${member.id}/profile-picture/media`} alt={name} />
            )}
            <AvatarFallback className={`text-3xl ${avatarClass}`}>{memberInitials(member)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">{name}</p>
            {member.username && (
              <p className="text-sm text-gray-500 dark:text-slate-400">@{member.username}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge className={GROUP_BADGE[member.memberGroup] ?? 'bg-slate-100 text-slate-800'}>
              {formatMemberGroup(member.memberGroup)}
            </Badge>
            {role && <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{role}</span>}
          </div>

          <div className="w-full space-y-1 rounded-lg bg-gray-50 p-4 text-left text-sm dark:bg-slate-800/50">
            {member.major && (
              <p className="text-gray-700 dark:text-slate-300"><span className="text-gray-500 dark:text-slate-400">Major:</span> {member.major}</p>
            )}
            {member.pledgeClass && (
              <p className="text-gray-700 dark:text-slate-300"><span className="text-gray-500 dark:text-slate-400">Pledge Class:</span> {member.pledgeClass}</p>
            )}
            {graduation && (
              <p className="text-gray-700 dark:text-slate-300"><span className="text-gray-500 dark:text-slate-400">Graduation:</span> {graduation}</p>
            )}
            {member.email && (
              <p className="text-gray-700 dark:text-slate-300"><span className="text-gray-500 dark:text-slate-400">Email:</span> {member.email}</p>
            )}
          </div>

          <div className="flex w-full flex-wrap gap-2">
            {member.email && (
              <Button type="button" variant="outline" className="flex-1 gap-2" asChild>
                <a href={`mailto:${member.email}`}>
                  <Mail className="h-4 w-4" /> Email
                </a>
              </Button>
            )}
            <Button className="flex-1 gap-2 bg-blue-800 hover:bg-blue-700" asChild>
              <Link href={`${portalRoot}/messages?with=${member.id}`}>
                <MessageSquare className="h-4 w-4" /> Message
              </Link>
            </Button>
            {member.calendlyUrl && (
              <Button type="button" variant="outline" className="flex-1 gap-2" asChild>
                <a href={member.calendlyUrl} target="_blank" rel="noreferrer">
                  <CalendarDays className="h-4 w-4" /> Schedule
                </a>
              </Button>
            )}
          </div>
          {!isSelf && (
            <div className="w-full border-t border-gray-100 pt-3 dark:border-slate-800">
              <BlockButton userId={member.id} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const THEMES = {
  blue: {
    heading: 'text-blue-900 dark:text-blue-100',
    avatarClass: 'bg-blue-900 text-white dark:bg-blue-700',
    blobA: 'from-indigo-500 via-fuchsia-500 to-cyan-400',
    blobB: 'from-cyan-400 via-indigo-500 to-fuchsia-500',
  },
  amber: {
    heading: 'text-amber-900 dark:text-amber-100',
    avatarClass: 'bg-amber-900 text-white dark:bg-amber-700',
    blobA: 'from-amber-400 via-orange-300 to-yellow-200',
    blobB: 'from-yellow-200 via-amber-400 to-orange-300',
  },
  teal: {
    heading: 'text-teal-900 dark:text-teal-100',
    avatarClass: 'bg-teal-900 text-white dark:bg-teal-700',
    blobA: 'from-teal-400 via-cyan-300 to-emerald-200',
    blobB: 'from-emerald-200 via-teal-400 to-cyan-300',
  },
};

function LegacyMemberDirectory({ title, description, theme }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const { heading, avatarClass, blobA, blobB } = THEMES[theme] ?? THEMES.blue;

  useEffect(() => {
    getMemberDirectory()
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load directory');
      })
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
                  onClick={() => setSelectedMember(member)}
                  className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.85fr)_auto] md:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0 sm:h-10 sm:w-10">
                      {member.id && (
                        <AvatarImage
                          src={`/api/users/${member.id}/profile-picture/media`}
                          alt={directoryDisplayName(member)}
                        />
                      )}
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

      {selectedMember && (
        <LegacyProfileModal
          member={selectedMember}
          avatarClass={avatarClass}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}

// ─── Revamped directory (Member portal) ───

function DirectoryAvatar({ member, size, accent }) {
  const px = `${size}px`;
  return (
    <Avatar style={{ width: px, height: px }} className="shrink-0">
      {member.id && (
        <AvatarImage src={`/api/users/${member.id}/profile-picture/media`} alt="" />
      )}
      <AvatarFallback
        className="font-semibold text-white"
        style={{ background: accent.gradient, fontSize: size * 0.36 }}
      >
        {memberInitials(member)}
      </AvatarFallback>
    </Avatar>
  );
}

function GroupBadge({ group }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: GROUP_BG[group] ?? 'var(--color-muted)', color: GROUP_COLOR[group] ?? 'var(--color-muted-foreground)' }}
    >
      {formatMemberGroup(group)}
    </span>
  );
}

function InfoRow({ icon, label, value, isLast }) {
  return (
    <div className={cn('flex items-center gap-2.5 py-1.5', !isLast && 'border-b border-border')}>
      <span className="text-muted-foreground">{icon}</span>
      <span className="w-24 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-foreground">{value}</span>
    </div>
  );
}

function ProfileModal({ member, accent, onClose }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSelf = session?.user?.authentik_id === member.id;
  const portalRoot = '/' + (pathname.split('/')[1] || 'member');
  const name = directoryDisplayName(member);
  const graduation = formatGraduationDate(member.graduationDate);
  const role = specificRole(member);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${name}'s profile`}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="h-20 w-full" style={{ background: accent.gradient }} aria-hidden="true" />

        {!isSelf && (
          <div className="absolute left-4 top-[5.5rem]">
            <ReportButton contentType="user" reportedUserId={member.id} />
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          aria-label="Close profile"
        >
          <X size={13} strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center px-6 pb-6">
          <div className="-mt-9 mb-3 rounded-full p-1" style={{ background: 'var(--color-card)' }}>
            <DirectoryAvatar member={member} size={72} accent={accent} />
          </div>

          <h2 className="text-center text-xl font-bold tracking-tight text-foreground">{name}</h2>
          {member.username && <p className="text-xs text-muted-foreground">@{member.username}</p>}

          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            <GroupBadge group={member.memberGroup} />
            {role && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {role}
              </span>
            )}
          </div>

          {(member.major || member.pledgeClass || graduation || member.email) && (
            <div className="mt-5 w-full rounded-xl border border-border p-4 text-xs" style={{ background: tint(accent.base, 0.03) }}>
              {member.major && <InfoRow icon={<BookOpen size={12} />} label="Major" value={member.major} />}
              {member.pledgeClass && <InfoRow icon={<Users size={12} />} label="Pledge Class" value={member.pledgeClass} />}
              {graduation && <InfoRow icon={<GraduationCap size={12} />} label="Graduation" value={graduation} />}
              {member.email && <InfoRow icon={<Mail size={12} />} label="Email" value={member.email} isLast />}
            </div>
          )}

          <div className="mt-4 flex w-full flex-col gap-2">
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Mail size={14} /> Email
              </a>
            )}
            <Link
              href={`${portalRoot}/messages?with=${member.id}`}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: accent.gradient }}
            >
              <MessageSquare size={14} /> Message
            </Link>
            {member.calendlyUrl && (
              <a
                href={member.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <CalendarDays size={14} /> Schedule
              </a>
            )}
          </div>

          {!isSelf && (
            <div className="mt-4 w-full">
              <BlockButton userId={member.id} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortButton({ active, dir, onClick, accent, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
      style={active ? { color: accent.light } : undefined}
    >
      {children}
      <span className="flex flex-col" aria-hidden="true">
        <ChevronUp size={9} strokeWidth={3} className={cn('transition-opacity', active && dir === 'asc' ? 'opacity-100' : 'opacity-30')} />
        <ChevronDown size={9} strokeWidth={3} className={cn('-mt-0.5 transition-opacity', active && dir === 'desc' ? 'opacity-100' : 'opacity-30')} />
      </span>
    </button>
  );
}

function DirectoryRow({ member, accent, onClick }) {
  const name = directoryDisplayName(member);
  const role = specificRole(member);

  return (
    <tr
      className="group cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-muted/40"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      aria-label={`View ${name}'s profile`}
    >
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <DirectoryAvatar member={member} size={36} accent={accent} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            {member.username && <p className="text-[11px] text-muted-foreground">@{member.username}</p>}
          </div>
        </div>
      </td>

      <td className="hidden px-4 py-3.5 md:table-cell">
        <span className="text-sm text-muted-foreground">{member.major || '—'}</span>
      </td>

      <td className="hidden px-4 py-3.5 sm:table-cell">
        <span className="text-sm text-muted-foreground">{member.pledgeClass || '—'}</span>
      </td>

      {/* Badge last, so it sits flush against the right edge on every row.
          Role first would push the badge left by the length of each person's
          title, leaving the group column ragged down the list — only the
          leadership rows have a title at all. */}
      <td className="px-4 py-3.5 text-right">
        <div className="flex items-center justify-end gap-2">
          {role && (
            <span className="hidden max-w-[160px] truncate text-[11px] text-muted-foreground lg:inline">{role}</span>
          )}
          <GroupBadge group={member.memberGroup} />
        </div>
      </td>
    </tr>
  );
}

function GroupSection({ group, members, accent, onSelect }) {
  if (members.length === 0) return null;

  return (
    <>
      <tr aria-hidden="true">
        <td colSpan={4} className="px-6 pb-1 pt-5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: GROUP_COLOR[group] }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: GROUP_COLOR[group] }}>
              {formatMemberGroup(group)}
            </span>
            <span className="text-[10px] text-muted-foreground">{members.length}</span>
          </div>
        </td>
      </tr>
      {members.map((m) => (
        <DirectoryRow key={m.id ?? m.username} member={m} accent={accent} onClick={() => onSelect(m)} />
      ))}
    </>
  );
}

function DirectoryHeader({ title, description, accent }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>
        Chapter Directory
      </p>
      <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

function RevampedMemberDirectory({ title, description, theme }) {
  const accent = ACCENT_THEMES[theme] ?? ACCENT_THEMES.blue;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    getMemberDirectory()
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load directory');
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleSort() {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  const grouped = useMemo(() => {
    const sorted = [...members].sort((a, b) => {
      const la = directorySortLabel(a).toLowerCase();
      const lb = directorySortLabel(b).toLowerCase();
      return sortDir === 'asc' ? la.localeCompare(lb) : lb.localeCompare(la);
    });
    const map = {};
    for (const g of GROUP_ORDER) map[g] = [];
    for (const m of sorted) {
      const g = GROUP_ORDER.includes(m.memberGroup) ? m.memberGroup : 'active';
      map[g].push(m);
    }
    return map;
  }, [members, sortDir]);

  const totalCount = members.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <DirectoryHeader title={title} description={description} accent={accent} />
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={26} className="animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading members…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DirectoryHeader title={title} description={description} accent={accent} />
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle size={26} className="text-destructive" />
            <p className="text-sm font-medium text-foreground">Failed to load directory</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="space-y-6">
        <DirectoryHeader title={title} description={description} accent={accent} />
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3">
            <Users size={26} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No members found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <DirectoryHeader title={title} description={description} accent={accent} />

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border" style={{ background: tint(accent.base, 0.03) }}>
                <th className="px-6 py-3 text-left">
                  <SortButton active dir={sortDir} onClick={toggleSort} accent={accent}>Name</SortButton>
                </th>
                <th className="hidden px-4 py-3 text-left md:table-cell">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Major</span>
                </th>
                <th className="hidden px-4 py-3 text-left sm:table-cell">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pledge Class</span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {GROUP_ORDER.map((group) => (
                <GroupSection key={group} group={group} members={grouped[group]} accent={accent} onSelect={setSelectedMember} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 px-1">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: accent.light }} aria-hidden="true" />
          <p className="text-xs text-muted-foreground">{totalCount} member{totalCount !== 1 ? 's' : ''} in chapter</p>
        </div>
      </div>

      {selectedMember && (
        <ProfileModal member={selectedMember} accent={accent} onClose={() => setSelectedMember(null)} />
      )}
    </>
  );
}

const REVAMPED_KEYS = new Set(['blue', 'amber', 'teal']);

export default function MemberDirectory({ title = 'Directory', description = 'Browse chapter members', theme = 'blue' }) {
  if (REVAMPED_KEYS.has(theme)) {
    return <RevampedMemberDirectory title={title} description={description} theme={theme} />;
  }
  return <LegacyMemberDirectory title={title} description={description} theme={theme} />;
}
