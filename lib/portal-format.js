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
  };
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
    active: 'Active',
    pledge: 'Pledge',
    alumni: 'Alumni',
  };
  return labels[group] ?? group.charAt(0).toUpperCase() + group.slice(1);
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

export function formatPhotoDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
