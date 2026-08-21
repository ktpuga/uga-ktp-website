'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Users, X, MessageSquare, Mail, AlertTriangle, RefreshCw, Search, ArrowUpDown,
  ChevronLeft, ChevronRight, GraduationCap, BookOpen, CalendarClock, Linkedin,
  // Aliased because `Link` in this file is next/link, imported above. Without
  // the alias the two silently collide and the chip renders a router link.
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMemberDirectoryWithRushees } from '@/lib/portal-api';
import {
  memberDisplayName,
  memberInitials,
  formatMemberGroup,
  formatGraduationDate,
  formatPledgeClass,
  linkedinHref,
  safeExternalHref,
  traitText,
  MEMBER_GROUP_ORDER,
  LEADERSHIP_GROUPS,
} from '@/lib/portal-format';
import { profilePictureSrc, avatarAssetId } from '@/lib/avatar';
import { isRedirectError } from '@/lib/is-redirect-error';
import { seedValues } from '@/lib/seed';
import ReportButton from './ReportButton';
import BlockButton from './BlockButton';
import { NewMeetingModal } from './MeetingsPage';
import { PALETTES } from '@/components/portal/PortalAccentContext';
import { usePortalTheme } from './PortalThemeProvider';

// Palette comes from PortalAccentContext, the single source of truth. Each of
// these files used to carry its own ACCENT_THEMES copy; they had already
// drifted (MemberDirectory was missing 'red' entirely, and every copy still
// had a real teal that nothing rendered — pledge passes 'blue').

// Tab order, left to right. Rush sits last: rushees aren't members, and the tab
// only appears for someone the API actually returns rush rows to, so this order
// is what a permitted viewer sees, not a permission check.
// Canonical list lives in lib/portal-format.js so the directory and the group
// chat member list can't drift apart. See MEMBER_GROUP_ORDER there.
const GROUP_ORDER = MEMBER_GROUP_ORDER;

// Plural, because a tab names a set of people rather than one person's badge —
// "Pledges", not the "Pledge" that formatMemberGroup gives a single row. Alumni
// and E-Board are already their own plural, and Members reads better than
// "Actives" for the base tier (it matches what formatMemberGroup calls them).
const TAB_LABEL = {
  eboard: 'E-Board',
  chair: 'Chairs',
  active: 'Members',
  pledge: 'Pledges',
  alumni: 'Alumni',
  rush: 'Rushees',
};

const GROUP_COLOR = {
  eboard: '#7f1d1d',
  chair: '#7e22ce',
  active: '#1d4ed8',
  pledge: '#15803d',
  alumni: '#b45309',
  rush: '#0e7490',
};

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// #rrggbb to [h, s, l], h in 0-360 and s/l in 0-100.
function hexToHsl(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}

// The six GROUP_COLOR swatches were picked to sit on a white card: they are
// dark and saturated, which is exactly wrong on a dark one. The old tab bar
// dodged that by keeping every label on `text-foreground` and letting the
// colour appear only in a 2px underline, so group identity barely read at all.
//
// This keeps the hue (which is the identity) and re-derives only the lightness
// for the theme actually being rendered, so the same six groups stay legible
// and stay distinguishable in both. Deriving beats hardcoding a second palette:
// a new group added to GROUP_COLOR gets its dark variant for free, and the two
// can't drift.
function readableGroupText(hex, dark) {
  const [h, s] = hexToHsl(hex);
  // Light mode: the swatch is already dark enough. Only guarantee a saturation
  // floor, so the less vivid hues don't read as grey.
  if (!dark) return `hsl(${h.toFixed(0)} ${Math.max(s, 55).toFixed(0)}% 34%)`;
  // Dark mode: lift well clear of the card behind it, and pull saturation back
  // so a bright hue on near-black doesn't vibrate.
  const outS = Math.max(42, Math.min(62, s * 0.82));
  return `hsl(${h.toFixed(0)} ${outS.toFixed(0)}% 70%)`;
}

// Initials tiles are seeded per member rather than painted in the portal
// accent. A tab of 61 rushees is mostly initials (few of them have uploaded a
// photo yet), and in one accent colour that is 61 identical blue circles with
// nothing to catch the eye on. Seeded from the member's id, so their tile is
// the same colour on the card and in the modal it opens, on every device.
function avatarGradient(member) {
  const [s0, s1] = seedValues(String(member.id ?? member.username ?? 'member'), 2);
  const hue1 = s0 % 360;
  const hue2 = (hue1 + 35 + (s1 % 55)) % 360;
  return `linear-gradient(135deg, hsl(${hue1} 68% 52%) 0%, hsl(${hue2} 62% 40%) 100%)`;
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

// ─── Directory (all portals) ───

// `size` is either a number of pixels or any CSS length. The profile modal
// passes a custom property so the avatar can shrink at mobile widths; the
// fallback initials are sized off the same value so they track it either way.
function DirectoryAvatar({ member, size }) {
  const px = typeof size === 'number' ? `${size}px` : size;
  return (
    <Avatar style={{ width: px, height: px }} className="shrink-0">
      {member.id && (
        <AvatarImage src={profilePictureSrc(member.id, avatarAssetId(member))} alt="" />
      )}
      <AvatarFallback
        className="font-semibold text-white"
        style={{ background: avatarGradient(member), fontSize: `calc(${px} * 0.36)` }}
      >
        {memberInitials(member)}
      </AvatarFallback>
    </Avatar>
  );
}

// The small caption beside a group badge: a chair's committee, or one of
// eboard's traits. One component so the two can't drift apart — they are meant
// to be indistinguishable, since a trait reading "Pledge Chair" is doing
// exactly the job the chair caption does.
function CaptionPill({ children }) {
  return (
    <span className="max-w-full truncate rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

// Same colour treatment as the tabs, for the same reason: this badge is a dark
// swatch on a card, so in dark mode it used to be near-invisible.
function GroupBadge({ group }) {
  const { theme } = usePortalTheme();
  const dark = theme === 'dark';
  const color = GROUP_COLOR[group];

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{
        background: color ? tint(color, dark ? 0.22 : 0.10) : 'var(--color-muted)',
        color: color ? readableGroupText(color, dark) : 'var(--color-muted-foreground)',
      }}
    >
      {formatMemberGroup(group)}
    </span>
  );
}

// Chapter navy and gold, in one place so the two trait surfaces below cannot
// drift apart.
//
// ⚠ THE NAVY GOES THROUGH readableGroupText, IT IS NEVER USED RAW. As a
// literal `text-[#14326E]` it measured 1.39:1 against the dark card
// (--color-dark-card: #1a1c21) — WCAG AA wants 4.5:1, so the traits were
// effectively invisible in portal dark mode while the gold diamond beside them
// still rendered. That is the identical defect GroupBadge above already
// documents ("a dark swatch on a card... in dark mode it used to be
// near-invisible"), which is why that helper exists. It keeps the hue and
// re-derives only lightness, so this stays navy in light mode.
//
// The gold is left literal on purpose: it is a decorative, aria-hidden 6px
// diamond, and it already clears 8:1 on the dark card.
const TRAIT_NAVY = '#14326E';
const TRAIT_GOLD = '#d4af37';

function TraitLine({ children, compact = false }) {
  const { theme } = usePortalTheme();
  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center justify-center font-semibold leading-snug',
        compact ? 'gap-1.5 text-[11px]' : 'gap-2 text-xs',
      )}
      style={{ color: readableGroupText(TRAIT_NAVY, theme === 'dark') }}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rotate-45" style={{ background: TRAIT_GOLD }} />
      {/* ⚠ BOTH min-w-0s ARE LOAD-BEARING. Removing either makes `truncate`
          silently do nothing and the text overflow the card instead.

          A flex item's min-width defaults to `auto`, which resolves to its
          min-content width — and for nowrap text that is the WHOLE string. So
          the item refuses to shrink and there is never any overflow for
          text-overflow to ellipsize. min-w-0 on the container lets it shrink
          within the card; min-w-0 here lets the text shrink within it.

          One line is a deliberate constraint, not a side effect: traits are
          capped at 80 characters (TEXT_LIMITS.TRAIT), so a long one WILL be
          clipped on a narrow card. `title` is what makes the full text
          recoverable — keep it in step with whatever is rendered.

          This replaces an earlier hanging-indent fix for a wrap bug. Worth
          knowing in case wrapping ever comes back: the text span is a flex
          item inside a text-center parent, so once it wrapped, the inherited
          centring pushed the first line away from the diamond and stranded
          it. Single-line makes that unreachable rather than solved.

          Same markup and same treatment in components/ui/card.jsx for the
          public roster. Change both. */}
      <span className="min-w-0 truncate" title={typeof children === 'string' ? children : undefined}>{children}</span>
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
// stopPropagation because the surface behind this is itself a click target that
// opens the profile modal — without it, following the link would also open
// the modal behind the new tab.
function LinkedinLink({ url, className }) {
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
      // Spelled out rather than left to the visible label, which is short
      // enough to be ambiguous read on its own.
      aria-label="LinkedIn profile (opens in a new tab)"
    >
      <Linkedin size={12} />
      LinkedIn
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
  const traitLabels = (member.traits ?? []).map(traitText).filter(Boolean);
  const alumniTrait = member.memberGroup === 'alumni' ? traitLabels[0] : null;
  const remainingTraits = alumniTrait ? traitLabels.slice(1) : traitLabels;

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

      {/* The card is capped at the viewport and scrolls internally. It used to
          have no height limit at all, so a profile with traits, an About block
          and both email rows ran off the top and bottom of a phone screen —
          and because `document.body` is locked to `overflow: hidden` while
          this is open, there was no way to scroll to the part that was cut off.
          `dvh` rather than `vh` so the mobile browser's collapsing toolbar is
          accounted for. `--avatar` drives both the avatar and the negative
          margin that lifts it onto the header, so the two cannot drift apart. */}
      <div className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl border border-border bg-card shadow-xl [--avatar:5.5rem] sm:[--avatar:7rem]">
        {/* Zero-height sticky strip: the card itself is the scroll container,
            so an absolutely positioned close button would scroll out of reach
            on a long profile — and at full height there is barely any backdrop
            left to tap instead. */}
        <div className="sticky top-0 z-20 h-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            aria-label="Close profile"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>

        <div className="h-16 w-full shrink-0 sm:h-20" style={{ background: accent.gradient }} aria-hidden="true" />

        {/* Report and block, side by side. Block used to be a full-width
            button at the bottom of the card; it's here so the two safety
            actions read as one pair rather than living at opposite ends. */}
        {!isSelf && (
          <div className="absolute left-4 top-[4.5rem] flex items-center gap-1 sm:top-[5.5rem]">
            <ReportButton contentType="user" reportedUserId={member.id} />
            <BlockButton userId={member.id} iconOnly />
          </div>
        )}

        <div className="flex flex-col items-center px-5 pb-5 sm:px-6 sm:pb-6">
          {/* The ring's negative margin has to track the avatar size: it lifts
              the circle so it straddles the gradient header's bottom edge, and
              a fixed value would leave a larger avatar sitting too low. Both
              now derive from --avatar so the mobile and desktop sizes cannot
              drift apart. Half the avatar reproduces the previous -mt-14
              exactly at the 7rem desktop size. */}
          <div
            className="mb-3 rounded-full p-1"
            style={{ marginTop: 'calc(var(--avatar) / -2)', background: 'var(--color-card)' }}
          >
            <DirectoryAvatar member={member} size="var(--avatar)" />
          </div>

          <h2 className="text-center text-xl font-bold tracking-tight text-foreground">{name}</h2>
          {member.username && <p className="text-xs text-muted-foreground">@{member.username}</p>}
          <LinkedinLink url={linkedinHref(member.linkedinUrl)} className="mt-1.5" />

          {/* Group badge, then the chair's committee caption, then eboard's
              traits — all one row of pills, because they answer the same
              question at a glance. Traits deliberately share the caption's
              exact treatment rather than getting one of their own: "Pledge
              Chair" typed as a trait should be indistinguishable from the
              caption a real chair gets, which is the whole point of them. */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            {alumniTrait ? (
              <span className="w-full text-center">
                <TraitLine>{alumniTrait}</TraitLine>
              </span>
            ) : (
              <GroupBadge group={member.memberGroup} />
            )}
            {role && <CaptionPill>{role}</CaptionPill>}
          </div>
          {remainingTraits.length > 0 && (
            <section className="mt-3 w-full max-w-sm space-y-1.5 text-center">
                {remainingTraits.map((trait) => (
                  <div
                    key={trait}
                    className="border-y px-3 py-1.5 text-xs font-semibold leading-snug text-foreground"
                    style={{ borderColor: tint(accent.base, 0.24), background: tint(accent.base, 0.08) }}
                  >
                    {trait}
                  </div>
                ))}
            </section>
          )}

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

// One card per person, replacing the table row this used to be.
//
// It shows the name, @username, major, pledge class and (for eboard and chairs)
// the role, and deliberately nothing else. There is no group badge: the tab you
// are on already says the group, and repeating it on all 61 cards is noise.
//
// Every field except the name can be null, and on the Rushees tab the pledge
// class is null for everyone, so absence has to look deliberate rather than
// broken. Each block is conditional and the card is centred, which is what lets
// a photo-and-name-only card still read as composed.
function MemberCard({ member, accent, onClick }) {
  const name = directoryDisplayName(member);
  const pledgeClass = formatPledgeClass(member.pledgeClass);
  // The member's CURRENT position leads, then the eboard-typed traits, which
  // in practice record past service. Both get the same treatment on purpose:
  // "President" and "Former Treasurer" are the same kind of fact about a
  // person, and giving the current one a different visual weight made eboard
  // and cabinet cards look like they were missing something alumni had.
  //
  // Derived, not typed: specificRole reads execTitle, else the committees they
  // chair. There is deliberately NO generic fallback ("Member", "Alumni") —
  // labelling every card with its own section heading is the noise this
  // roster dropped.
  const traitLabels = [specificRole(member), ...(member.traits ?? []).map(traitText)].filter(Boolean);

  return (
    <div
      className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-shadow hover:shadow-md"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Space scrolls the grid otherwise, so the card under the cursor
          // opens and the page jumps at the same time.
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View ${name}'s profile`}
    >
      <DirectoryAvatar member={member} size={64} />

      <div className="w-full min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        {member.username && <p className="truncate text-xs text-muted-foreground">@{member.username}</p>}
      </div>

      {traitLabels.length > 0 && (
        <section className="w-full space-y-1 text-center">
          {traitLabels.map((trait) => (
            <div key={trait} className="flex justify-center">
              <TraitLine compact>{trait}</TraitLine>
            </div>
          ))}
        </section>
      )}

      {(member.major || pledgeClass) && (
        <div className="flex w-full min-w-0 flex-col items-center gap-0.5 text-[11px] text-muted-foreground">
          {/* BookOpen for the major and Users for the pledge class, matching
              the info rows in the modal this card opens. The two are one click
              apart, so a different icon for the same field reads as a
              different field. */}
          {member.major && (
            <span className="flex w-full min-w-0 items-center justify-center gap-1">
              <BookOpen size={11} className="shrink-0" />
              <span className="truncate">{member.major}</span>
            </span>
          )}
          {pledgeClass && (
            <span className="flex items-center gap-1">
              <Users size={11} className="shrink-0" />
              {pledgeClass}
            </span>
          )}
        </div>
      )}

    </div>
  );
}

function MemberCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4">
      <div className="h-16 w-16 rounded-full bg-muted" />
      <div className="h-3.5 w-20 rounded bg-muted" />
      <div className="h-2.5 w-14 rounded bg-muted" />
    </div>
  );
}

// One tab per member group, replacing the stacked sections this used to scroll
// through.
//
// Every tab carries a solid dot in its group's hue whether it is selected or
// not, which is what makes the group identity survive: colouring only the
// active tab means five of the six are unlabelled at any moment. The colours
// themselves go through readableGroupText, so they hold up on a dark card.
//
// Six tabs with counts do not fit a phone, and a bare scrolling row gives no
// sign there is anything past the right edge. So: scroll-snap, a fade on
// whichever side has more to show, and a chevron that appears with it.
function GroupTabs({ tabs, active, onSelect, dark }) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  // Re-measured on resize and whenever the tab count changes: a chapter whose
  // last rushee is removed mid-session loses a tab, and the fade has to go with
  // it rather than pointing at nothing.
  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges, tabs.length]);

  function scrollByAmount(direction) {
    scrollRef.current?.scrollBy({ left: direction * 180, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={updateEdges}
        role="tablist"
        aria-label="Member groups"
        className="flex gap-1.5 overflow-x-auto scroll-smooth px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {tabs.map(({ group, count }) => {
          const isActive = group === active;
          // Reachable only if a new group lands in MEMBER_GROUP_ORDER without a
          // GROUP_COLOR entry, which is a slate-grey tab rather than a crash.
          const color = GROUP_COLOR[group] ?? '#64748b';
          const text = readableGroupText(color, dark);

          return (
            <button
              key={group}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(group)}
              style={{
                scrollSnapAlign: 'start',
                background: isActive ? tint(color, dark ? 0.22 : 0.12) : undefined,
                color: isActive ? text : undefined,
              }}
              className={cn(
                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
                isActive ? 'font-semibold' : 'text-muted-foreground hover:bg-muted/60',
              )}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: text }} aria-hidden="true" />
              {TAB_LABEL[group] ?? formatMemberGroup(group)}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums',
                  isActive ? 'bg-background/70' : 'bg-muted text-muted-foreground',
                )}
                style={isActive ? { color: text } : undefined}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fades to card, not to background: this row sits inside the directory
          panel, and fading to the page colour would draw a pale block over it. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent transition-opacity',
          canLeft ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent transition-opacity',
          canRight ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden="true"
      />

      {canLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Scroll tabs left"
          className="absolute left-0 top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm"
        >
          <ChevronLeft size={13} className="text-muted-foreground" />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Scroll tabs right"
          className="absolute right-0 top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm"
        >
          <ChevronRight size={13} className="text-muted-foreground" />
        </button>
      )}
    </div>
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
  const accent = PALETTES[theme] ?? PALETTES.blue;
  // The group colours are derived per theme rather than written twice, so the
  // tab bar needs to know which one is on screen. usePortalTheme defaults to
  // light with no provider above it, which is the safe way to be wrong.
  const { theme: portalTheme } = usePortalTheme();
  const isDark = portalTheme === 'dark';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selectedMember, setSelectedMember] = useState(null);
  const [chosenGroup, setChosenGroup] = useState(null);
  const [query, setQuery] = useState('');

  // Extracted from the effect so the error state's Try again button can run the
  // real fetch again. A button that only clears the error would put the empty
  // directory back on screen and call it recovered.
  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getMemberDirectoryWithRushees()
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load directory');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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

  // An empty group gets no tab at all. That is what keeps the Rushees tab a
  // rush-season thing without a permission branch here: the API returns no rush
  // rows out of season, or to a viewer who may not see them, and either way the
  // tab simply isn't drawn. Same rule as the sidebar entry it replaced.
  const tabs = GROUP_ORDER
    .filter((g) => grouped[g].length > 0)
    .map((g) => ({ group: g, count: grouped[g].length }));

  // Derived rather than stored, so the first render lands on a real tab without
  // a state write, and a chapter that loses its last rushee mid-session falls
  // back instead of staring at a tab that no longer exists.
  const activeGroup = tabs.some((t) => t.group === chosenGroup) ? chosenGroup : tabs[0]?.group;
  const inGroup = activeGroup ? grouped[activeGroup] : [];

  // Search filters within the open tab only, and the tabs themselves are built
  // from the unfiltered groups above, so searching can never make a tab vanish
  // underneath the person typing.
  //
  // It exists because of the Rushees tab: 60+ cards is past the point where
  // scanning works. Name and username only, which is what someone opening the
  // directory is holding in their head.
  const trimmedQuery = query.trim();
  const visible = useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    if (!q) return inGroup;
    return inGroup.filter((m) => {
      const haystack = [directoryDisplayName(m), m.username];
      return haystack.some((v) => v && v.toLowerCase().includes(q));
    });
  }, [inGroup, trimmedQuery]);

  // Everyone actually in the chapter. Rushees are excluded rather than counted:
  // they now arrive in the same fetch as members, so members.length would quietly
  // start reporting a bigger chapter than there is.
  const chapterCount = members.length - grouped.rush.length;

  // The number under a list should be the length of the list above it. With a
  // query on screen that means the match count, not the group's size, and
  // without one the chapter total stays beside it so splitting into tabs
  // doesn't cost the one figure this line used to give. Rushees are excluded
  // from that total and counted on their own: they aren't members, which is the
  // whole distinction the tabs exist to draw.
  let countLine;
  if (trimmedQuery) {
    countLine = `${visible.length} of ${inGroup.length} matching "${trimmedQuery}"`;
  } else if (activeGroup === 'rush') {
    countLine = `${inGroup.length} rushee${inGroup.length !== 1 ? 's' : ''} signed up`;
  } else {
    countLine = `${inGroup.length} of ${chapterCount} member${chapterCount !== 1 ? 's' : ''} in chapter`;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <DirectoryHeader title={title} description={description} accent={accent} />
        {/* Skeleton cards rather than a spinner, because the grid they stand in
            for is the whole screen: the layout settles once, not twice. */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <MemberCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <DirectoryHeader title={title} description={description} accent={accent} />
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <AlertTriangle size={22} className="text-destructive" />
            <p className="text-sm font-medium text-foreground">Failed to load directory</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: accent.gradient }}
            >
              <RefreshCw size={11} /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="space-y-4">
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

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <GroupTabs tabs={tabs} active={activeGroup} onSelect={setChosenGroup} dark={isDark} />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${TAB_LABEL[activeGroup] ?? 'members'}…`}
                aria-label={`Search ${TAB_LABEL[activeGroup] ?? 'members'}`}
                className="w-full rounded-lg border border-border bg-muted/40 py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1"
                style={{ '--tw-ring-color': tint(accent.base, 0.4) }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={toggleSort}
              className="flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:self-auto"
            >
              <ArrowUpDown size={12} />
              Last name {sortDir === 'asc' ? 'A–Z' : 'Z–A'}
            </button>
          </div>

          <div className="mt-5">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
                <Search size={20} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No matches for &ldquo;{trimmedQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {visible.map((m) => (
                  <MemberCard
                    key={m.id ?? m.username}
                    member={m}
                    accent={accent}
                    onClick={() => setSelectedMember(m)}
                  />
                ))}
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">{countLine}</p>
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
export default function MemberDirectory({ title = 'Directory', description = 'Browse chapter members', theme = 'blue' }) {
  return <RevampedMemberDirectory title={title} description={description} theme={theme} />;
}
