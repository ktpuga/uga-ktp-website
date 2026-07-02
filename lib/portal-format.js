export function memberDisplayName(member) {
  if (member.preferred_name) return member.preferred_name;
  const full = [member.first_name, member.last_name].filter(Boolean).join(' ');
  return full || member.username || 'Member';
}

export function formatEventDate(iso) {
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
  const start = new Date(startIso);
  const end = new Date(endIso);
  const time = (d) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${time(start)} – ${time(end)}`;
}

export function formatPhotoDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function upcomingEvents(events, limit = 3) {
  const now = Date.now();
  return events
    .filter((e) => new Date(e.startDate).getTime() >= now)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, limit);
}
