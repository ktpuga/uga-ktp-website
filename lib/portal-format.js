// Mirrors ktp-api's RUSH_DM_GROUPS — the only groups allowed to hold a DM
// thread with a rushee. Lives here rather than in portal-api.js because that
// file is 'use server', which may only export async functions, and this needs
// to be readable from client components too.
export const LEADERSHIP_GROUPS = ['eboard', 'chair'];

export function normalizeApiList(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of ['members', 'users', 'data', 'items', 'results']) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return [];
}

export function toDirectoryMember(raw) {
  return {
    id: raw.id ?? raw.authentik_id ?? null,
    username: raw.username ?? null,
    firstName: raw.first_name ?? raw.firstName ?? null,
    lastName: raw.last_name ?? raw.lastName ?? null,
    preferredName: raw.preferred_name ?? raw.preferredName ?? null,
    memberGroup: raw.member_group ?? raw.memberGroup ?? null,
    major: raw.major ?? null,
    graduationDate: raw.graduation_date ?? raw.graduationDate ?? null,
    pledgeClass: raw.pledge_class ?? raw.pledgeClass ?? null,
    email: raw.email ?? null,
    personalEmail: raw.personal_email ?? raw.personalEmail ?? null,
    execTitle: raw.exec_title ?? raw.execTitle ?? null,
    aboutMe: raw.about_me ?? raw.aboutMe ?? null,
    linkedinUrl: raw.linkedin_url ?? raw.linkedinUrl ?? null,
    chairedCommittees: raw.chairedCommittees ?? [],
  };
}

// `linkedin_url` is free text: ProfileForm has no validation on it and the API
// stores the string verbatim, so what comes back may be a bare handle, a
// scheme-less domain, someone's personal site, or `javascript:…`. It goes
// straight into an href, so never render it raw — parse it here and emit only
// an http(s) URL on linkedin.com. Anything else returns null and the caller
// simply doesn't draw the button.
export function linkedinHref(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  // A bare handle is a realistic thing to type into a field labelled
  // "LinkedIn URL", so treat it as one rather than throwing it away.
  if (!/[/:.\s]/.test(raw)) return `https://www.linkedin.com/in/${encodeURIComponent(raw)}`;

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  // endsWith('.linkedin.com') and not a bare suffix match — "evil-linkedin.com"
  // and "notlinkedin.com" must both fail.
  if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) return null;
  return url.href;
}

export function formatMemberDirectory(members) {
  return normalizeApiList(members)
    .map(toDirectoryMember)
    .sort((a, b) => {
      const last = (a.lastName ?? '').localeCompare(b.lastName ?? '');
      if (last !== 0) return last;
      return (a.firstName ?? '').localeCompare(b.firstName ?? '');
    });
}

export function memberDisplayName(member) {
  if (member.preferredName ?? member.preferred_name) {
    return member.preferredName ?? member.preferred_name;
  }
  const first = member.firstName ?? member.first_name;
  const last = member.lastName ?? member.last_name;
  const full = [first, last].filter(Boolean).join(' ');
  return full || member.username || 'Member';
}

export function memberInitials(member) {
  const name = memberDisplayName(member);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (name.slice(0, 2) || 'M').toUpperCase();
}

export function formatMemberGroup(group) {
  if (!group) return 'Member';
  const labels = {
    eboard: 'E-Board',
    chair: 'Chair',
    active: 'Member',
    pledge: 'Pledge',
    alumni: 'Alumni',
    // Prospective member, not a member — the generic fallback below would
    // wrongly label them "Member" in the sidebar and directory.
    rush: 'Rushee',
  };
  return labels[group] ?? group.charAt(0).toUpperCase() + group.slice(1);
}

// "active" is the base membership tier; chair and eboard are elevated roles
// layered on top of it (Authentik keeps the three mutually exclusive — see
// ktp-api's adminController.updateUserGroup — but organizationally a chair
// or eboard member is still an active member). Anywhere that matches a
// member's single resolved group against a target group (audience quick-add
// pickers, "add all <group>" buttons, etc.) should use this instead of a
// plain === so targeting "active" still reaches them.
const GROUPS_IMPLYING_ACTIVE = new Set(['chair', 'eboard']);

export function groupMatches(memberGroup, targetGroup) {
  if (memberGroup === targetGroup) return true;
  return targetGroup === 'active' && GROUPS_IMPLYING_ACTIVE.has(memberGroup);
}

// Every group an event/announcement can be targeted at — matches ktp-api's
// RUSH_ACCESSIBLE_GROUPS (the same list gates read access on the backend).
//
// "rush" is last because it's the odd one out: prospective members with
// self-created accounts. Targeting something at rush publishes it to people
// who are not yet in the chapter, so it needs to be a deliberate tick rather
// than something swept in by a preset — note it is absent from ACTIVES_ONLY
// and is not part of the "All Members" default.
// Canonical ordering of member groups, most senior first. Mirrors ktp-api's
// constants/roleGroups.js and MUST contain every value it can return — anything
// missing gets bucketed as 'active' by callers and is silently mislabelled,
// which is exactly how rushees ended up listed as Active members once the rush
// portal shipped.
//
// Used both for display ordering (the directory's sections, group chat member
// lists) and as the audience list. One literal, so a new group can't be added
// to one and forgotten in the other.
export const MEMBER_GROUP_ORDER = ['eboard', 'chair', 'active', 'pledge', 'alumni', 'rush'];

export const AUDIENCE_GROUPS = MEMBER_GROUP_ORDER;

// audience null/empty means everyone (enforced by the backend query, not just
// this label) — same convention for both events and announcements.
export function formatAudience(audience) {
  if (!audience || audience.length === 0) return 'All Members';
  return audience.map(formatMemberGroup).join(', ');
}

// "Alpha Class", not "Class of Alpha" — a pledge class is a name, not a year,
// so "Class of" read wrong for every value the chapter actually uses.
//
// Shared rather than inlined at each call site: User Management and the
// Directory both render this, and they had already drifted once (one said
// "Class of X", the other showed the bare value).
export function formatPledgeClass(value) {
  if (!value) return null;
  return `${value} Class`;
}

export function formatGraduationDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getEventStartDate(event) {
  return event.startDate ?? event.start_date;
}

export function getEventEndDate(event) {
  return event.endDate ?? event.end_date;
}

export function getEventStartTime(event) {
  const value = getEventStartDate(event);
  return value ? new Date(value).getTime() : NaN;
}

export function sortEventsChronologically(events) {
  return [...events].sort((a, b) => getEventStartTime(a) - getEventStartTime(b));
}

export function upcomingEvents(events, limit) {
  const now = Date.now();
  const sorted = sortEventsChronologically(events).filter(
    (event) => getEventStartTime(event) >= now,
  );

  return limit == null ? sorted : sorted.slice(0, limit);
}

export function countUpcomingEvents(events) {
  return upcomingEvents(events).length;
}

export function formatEventDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatEventDateShort(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatEventTimeRange(startIso, endIso) {
  if (!startIso || !endIso) return '—';
  const start = new Date(startIso);
  const end = new Date(endIso);
  const time = (d) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${time(start)} – ${time(end)}`;
}

export function formatMessageTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === new Date().toDateString()) return time;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

export function formatPhotoDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
