'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Users, X, MessageSquare, Mail, ChevronUp, ChevronDown, AlertCircle, Loader2, GraduationCap, BookOpen, CalendarClock, Linkedin,
  // Aliased because `Link` in this file is next/link, imported above. Without
  // the alias the two silently collide and the chip renders a router link.
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMemberDirectory } from '@/lib/portal-api';
import {
  memberDisplayName,
  memberInitials,
  formatMemberGroup,
  formatGraduationDate,
  formatPledgeClass,
  linkedinHref,
  safeExternalHref,
  MEMBER_GROUP_ORDER,
  LEADERSHIP_GROUPS,
} from '@/lib/portal-format';
import { profilePictureSrc, avatarAssetId } from '@/lib/avatar';
import { isRedirectError } from '@/lib/is-redirect-error';
import ReportButton from './ReportButton';
import BlockButton from './BlockButton';
import { NewMeetingModal } from './MeetingsPage';
import { PALETTES } from '@/components/portal/PortalAccentContext';

// Palette comes from PortalAccentContext, the single source of truth. Each of
// these files used to carry its own ACCENT_THEMES copy; they had already
// drifted (MemberDirectory was missing 'red' entirely, and every copy still
// had a real teal that nothing rendered — pledge passes 'blue').

// Rush sits last: rushees aren't members, and the section only appears for
// eboard/chair/active anyway — the API omits those rows entirely for everyone
// else, so this order is what a permitted viewer sees, not a permission check.
// Canonical list lives in lib/portal-format.js so the directory and the group
// chat member list can't drift apart. See MEMBER_GROUP_ORDER there.
const GROUP_ORDER = MEMBER_GROUP_ORDER;

const GROUP_COLOR = {
  eboard: '#7f1d1d',
  chair: '#7e22ce',
  active: '#1d4ed8',
  pledge: '#15803d',
  alumni: '#b45309',
  rush: '#0e7490',
};

const GROUP_BG = {
  eboard: 'rgba(127,29,29,0.10)',
  chair: 'rgba(126,34,206,0.10)',
  active: 'rgba(29,78,216,0.10)',
  pledge: 'rgba(21,128,61,0.10)',
  alumni: 'rgba(180,83,9,0.10)',
  rush: 'rgba(14,116,144,0.10)',
};

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Specific role/title if there is one (an eboard member's exec_title, or
// which committee a chair runs) — shown alongside, not instead of, the
// group badge, since the internal Directory still wants the raw group too.
//
// A chair shows only the committee name. The word "Chair" used to lead it,
// which read as "Chair, Marketing" directly beside a badge already saying
// Chair — the badge is the role, this is which one.
function specificRole(member) {
  if (member.execTitle) return member.execTitle;
  if (member.chairedCommittees?.length > 0) return member.chairedCommittees.join(' & ');
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

// ─── Directory (all portals) ───

function DirectoryAvatar({ member, size, accent }) {
  const px = `${size}px`;
  return (
    <Avatar style={{ width: px, height: px }} className="shrink-0">
      {member.id && (
        <AvatarImage src={profilePictureSrc(member.id, avatarAssetId(member))} alt="" />
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

// A member's own links, as chips.
//
// **Every URL goes through safeExternalHref even though the API already
// canonicalised it on write.** That is not belt-and-braces for its own sake:
// this is an `href`, which is a different trust context from a text node —
// React escapes a hostile string rendered as text and does nothing at all about
// `javascript:` in an attribute. The write-side check is the real defence and
// the render-side one covers rows written before it existed, or by a path that
// bypasses `services/urls.js`. Exactly this pair was already got wrong once, in
// documentsController.createLink.
//
// A link that fails renders as no chip rather than a dead or hostile one.
//
// The row wraps: chips are laid out with flex-wrap and each label is capped at
// 40 characters by the API, so a member adding their fifth link re-spaces the
// row rather than overflowing the card.
function MemberLinks({ links, accent }) {
  const safe = (links ?? [])
    .map((link) => ({ label: link?.label, href: safeExternalHref(link?.url) }))
    .filter((link) => link.href && link.label);

  if (safe.length === 0) return null;

  return (
    <div className="mt-3 flex w-full flex-wrap justify-center gap-1.5">
      {safe.map((link) => (
        <a
          key={`${link.label}-${link.href}`}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          // Same reason as LinkedinLink below: the row behind this is itself a
          // click target that opens the modal.
          onClick={(e) => e.stopPropagation()}
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
          style={{ background: tint(accent.base, 0.03) }}
          aria-label={`${link.label} (opens in a new tab)`}
        >
          <LinkIcon size={10} className="shrink-0 text-muted-foreground" />
          <span className="truncate">{link.label}</span>
        </a>
      ))}
    </div>
  );
}

// Rendered only when linkedinHref() accepts the stored value, so an unusable
// or unsafe entry is silently no button rather than a dead/hostile link.
//
// stopPropagation because the directory row is itself a click target that
// opens the profile modal — without it, following the link would also open
// the modal behind the new tab.
function LinkedinLink({ url, className, showLabel = true }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-[#0a66c2]',
        className
      )}
      // Always spelled out, even when the label is hidden — the row variant is
      // icon-only for width, which a screen reader must not inherit.
      aria-label="LinkedIn profile (opens in a new tab)"
    >
      <Linkedin size={12} />
      {showLabel && 'LinkedIn'}
    </a>
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
  const [requestMeetingFor, setRequestMeetingFor] = useState(null);
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSelf = session?.user?.authentik_id === member.id;
  const canMessage =
    member.memberGroup !== 'rush'
    || (session?.user?.groups ?? []).some((g) => LEADERSHIP_GROUPS.includes(g));
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

        {/* Report and block, side by side. Block used to be a full-width
            button at the bottom of the card; it's here so the two safety
            actions read as one pair rather than living at opposite ends. */}
        {!isSelf && (
          <div className="absolute left-4 top-[5.5rem] flex items-center gap-1">
            <ReportButton contentType="user" reportedUserId={member.id} />
            <BlockButton userId={member.id} iconOnly />
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
          {/* The ring's negative margin has to track the avatar size: it lifts
              the circle so it straddles the gradient header's bottom edge, and
              a fixed value would leave a larger avatar sitting too low. Kept at
              roughly half the ring's full height (avatar + p-1 on both sides). */}
          <div className="-mt-14 mb-3 rounded-full p-1" style={{ background: 'var(--color-card)' }}>
            <DirectoryAvatar member={member} size={112} accent={accent} />
          </div>

          <h2 className="text-center text-xl font-bold tracking-tight text-foreground">{name}</h2>
          {member.username && <p className="text-xs text-muted-foreground">@{member.username}</p>}
          <LinkedinLink url={linkedinHref(member.linkedinUrl)} className="mt-1.5" />

          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            <GroupBadge group={member.memberGroup} />
            {role && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {role}
              </span>
            )}
          </div>

          {/* Directly under the badges rather than down in the info rows,
              because for an alumnus this is the single most useful line on the
              card — it is what somebody opened the profile to find out. Wrapped
              in a centred, balanced block so a two-line value doesn't leave one
              orphaned word.

              Not gated on `memberGroup === 'alumni'`. The column is on every
              user and only the FORM asks alumni for it, so anything already
              stored on a non-alumnus is real data somebody entered, and hiding
              it here would make it unexplainably invisible. */}
          {member.doingNow && (
            <p className="mt-2 max-w-[85%] text-balance text-center text-xs font-medium text-muted-foreground">
              {member.doingNow}
            </p>
          )}

          {/* A rushee has no pledge class, graduation date or exec title, and
              the API withholds their email, so About Me is often the only thing
              this panel would otherwise have for them. */}
          {member.aboutMe && (
            <div className="mt-5 w-full rounded-xl border border-border p-4 text-left" style={{ background: tint(accent.base, 0.03) }}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">About</p>
              <p className="whitespace-pre-line text-xs leading-relaxed text-foreground">{member.aboutMe}</p>
            </div>
          )}

          {(member.major || member.pledgeClass || graduation || member.email || member.personalEmail) && (
            <div className={cn('w-full rounded-xl border border-border p-4 text-xs', member.aboutMe ? 'mt-3' : 'mt-5')} style={{ background: tint(accent.base, 0.03) }}>
              {member.major && <InfoRow icon={<BookOpen size={12} />} label="Major" value={member.major} />}
              {member.pledgeClass && <InfoRow icon={<Users size={12} />} label="Pledge Class" value={member.pledgeClass} />}
              {graduation && <InfoRow icon={<GraduationCap size={12} />} label="Graduation" value={graduation} />}
              {/* Both addresses are shown when both exist. isLast is computed
                  rather than hardcoded so the divider lands on whichever row
                  actually ends the list. */}
              {member.email && (
                <InfoRow icon={<Mail size={12} />} label="UGA Email" value={member.email} isLast={!member.personalEmail} />
              )}
              {member.personalEmail && (
                <InfoRow icon={<Mail size={12} />} label="Personal Email" value={member.personalEmail} isLast />
              )}
            </div>
          )}

          <MemberLinks links={member.links} accent={accent} />

          <div className="mt-4 flex w-full flex-col gap-2">
            {/* Prefers the UGA address, falls back to the personal one — an
                alumnus often has only the latter still working. */}
            {(member.email || member.personalEmail) && (
              <a
                href={`mailto:${member.email || member.personalEmail}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Mail size={14} /> Email
              </a>
            )}
            {/* Only leadership may DM a rushee (ktp-api RUSH_DM_GROUPS). The
                directory still shows rushees to every member group, so this
                button is the one place the two rules diverge — offering it to
                anyone else would just produce a 403 on send. */}
            {canMessage && (
              <Link
                href={`${portalRoot}/messages?with=${member.id}`}
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: accent.gradient }}
              >
                <MessageSquare size={14} /> Message
              </Link>
            )}
            {/* Requests time through the meetings flow rather than sending
                someone off to a third-party booking page. */}
            <button
              type="button"
              onClick={() => setRequestMeetingFor(member)}
              className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <CalendarClock size={14} /> Make a meeting
            </button>
          </div>

        </div>
      </div>

      {requestMeetingFor && (
        <NewMeetingModal
          accent={accent}
          presetInvitee={requestMeetingFor}
          onClose={() => setRequestMeetingFor(null)}
          // Closing the profile too, so the member ends up back in the
          // directory rather than staring at the card they just acted on.
          onCreated={() => { setRequestMeetingFor(null); onClose(); }}
        />
      )}
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

function DirectoryRow({ member, accent, onClick, showPledgeClass = true }) {
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
            <div className="flex items-center gap-2">
              {member.username && <p className="truncate text-[11px] text-muted-foreground">@{member.username}</p>}
              <LinkedinLink url={linkedinHref(member.linkedinUrl)} showLabel={false} className="shrink-0" />
            </div>
          </div>
        </div>
      </td>

      <td className="hidden px-4 py-3.5 md:table-cell">
        <span className="text-sm text-muted-foreground">{member.major || '—'}</span>
      </td>

      {showPledgeClass && (
        <td className="hidden px-4 py-3.5 sm:table-cell">
          <span className="text-sm text-muted-foreground">
            {formatPledgeClass(member.pledgeClass) || '—'}
          </span>
        </td>
      )}

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

function GroupSection({ group, members, accent, onSelect, showPledgeClass = true }) {
  if (members.length === 0) return null;

  return (
    <>
      <tr aria-hidden="true">
        {/* Must match the real column count, or the section heading's rule
            stops short of the table edge when a column is dropped. */}
        <td colSpan={showPledgeClass ? 4 : 3} className="px-6 pb-1 pt-5">
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
        <DirectoryRow
          key={m.id ?? m.username}
          member={m}
          accent={accent}
          onClick={() => onSelect(m)}
          showPledgeClass={showPledgeClass}
        />
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

function RevampedMemberDirectory({ title, description, theme, onlyGroup }) {
  const accent = PALETTES[theme] ?? PALETTES.blue;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    getMemberDirectory(onlyGroup ? { group: onlyGroup } : undefined)
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load directory');
      })
      .finally(() => setLoading(false));
  }, [onlyGroup]);

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
      // GROUP_ORDER must contain every value in ktp-api's constants/roleGroups.js.
      // Anything missing lands in 'active' and is silently mislabelled — that is
      // exactly how rushees ended up listed as Active members once the rush
      // portal shipped. Prefer adding the group here over relying on this
      // fallback; dropping unknowns instead would hide people entirely, which
      // is worse.
      const g = GROUP_ORDER.includes(m.memberGroup) ? m.memberGroup : 'active';
      map[g].push(m);
    }
    return map;
  }, [members, sortDir]);

  const totalCount = members.length;

  // The Rushees tab is this same component with onlyGroup='rush'.
  const showPledgeClass = onlyGroup !== 'rush';

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
                {/* Rushees have no pledge class — that's what they're rushing
                    for — so the column is a full width of dashes on that page. */}
                {showPledgeClass && (
                  <th className="hidden px-4 py-3 text-left sm:table-cell">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pledge Class</span>
                  </th>
                )}
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Filtered to one group when onlyGroup is set — that's what
                  makes the Rushees tab this same component rather than a
                  second directory to keep in sync. */}
              {(onlyGroup ? [onlyGroup] : GROUP_ORDER).map((group) => (
                <GroupSection
                  key={group}
                  group={group}
                  members={grouped[group]}
                  accent={accent}
                  onSelect={setSelectedMember}
                  showPledgeClass={showPledgeClass}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 px-1">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: accent.light }} aria-hidden="true" />
          {/* "members in chapter" is wrong on the Rushees tab — rushees aren't
              members, which is the whole distinction this page exists to draw. */}
          <p className="text-xs text-muted-foreground">
            {onlyGroup === 'rush'
              ? `${totalCount} rushee${totalCount !== 1 ? 's' : ''} signed up`
              : `${totalCount} member${totalCount !== 1 ? 's' : ''} in chapter`}
          </p>
        </div>
      </div>

      {selectedMember && (
        <ProfileModal member={selectedMember} accent={accent} onClose={() => setSelectedMember(null)} />
      )}
    </>
  );
}

// Every portal passes blue, amber or red, so the pre-revamp variant this used
// to fall back to was unreachable and has been deleted. An unrecognised accent
// now renders with the blue palette (see the PALETTES lookup), which beats
// maintaining a second copy of the whole UI — two copies is what let the
// CircleCheck/BlockButton fix keep disappearing from one of them.
export default function MemberDirectory({ title = 'Directory', description = 'Browse chapter members', theme = 'blue', onlyGroup }) {
  return <RevampedMemberDirectory title={title} description={description} theme={theme} onlyGroup={onlyGroup} />;
}
