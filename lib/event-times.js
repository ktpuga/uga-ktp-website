// Start and end defaulting for event forms.
//
// Almost every chapter event runs an hour, so picking a start should fill the
// end in for you. Shared by the two forms that create events — /admin
// announcements and the committee page — because a default that applies in one
// and not the other is the portal-duplication trap in components/README.md.
//
// STATELESS ON PURPOSE. The obvious implementation tracks "did we auto-fill
// this?" in a ref, which then has to be reset on mount, on cancel and when the
// form is reused to EDIT an existing event, and which is wrong in whichever of
// those three the author forgets. Instead the previous form values answer the
// question directly: the end is ours to overwrite exactly when it still equals
// what we would have suggested for the previous start.

const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

const pad = (n) => String(n).padStart(2, '0');

// Adds hours to a `datetime-local` value, returning the same wall-clock format.
//
// Built from components and read back from components, never through
// `toISOString()`: datetime-local is local wall clock with no zone, and a UTC
// round trip shifts it by the offset. The Date is doing calendar arithmetic
// only, which is what makes 11:30 PM roll over to 12:30 AM the next day, and
// the next month, and the next year.
export function plusHoursLocal(value, hours = 1) {
  const match = LOCAL_INPUT.exec(value ?? '');
  if (!match) return '';

  const [, year, month, day, hour, minute] = match;
  const dt = new Date(Number(year), Number(month) - 1, Number(day), Number(hour) + hours, Number(minute));

  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
    + `T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

// The next `{ start, end }` after someone picks a start.
//
// The end is replaced when it is empty or still carries our suggestion, and
// left alone the moment a person has typed their own. That last case is the
// one that matters: an all-day retreat whose end gets quietly snapped back to
// an hour because the organiser adjusted the start afterwards is worse than no
// default at all.
export function nextEventTimes({ start: previousStart, end: previousEnd }, nextStart) {
  // Clearing the start must not also clear an end they meant to keep.
  if (!nextStart) return { start: nextStart, end: previousEnd };

  const theirs = previousEnd && previousEnd !== plusHoursLocal(previousStart);
  return { start: nextStart, end: theirs ? previousEnd : plusHoursLocal(nextStart) };
}
