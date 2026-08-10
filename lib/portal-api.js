'use server';

// if you are ever creating a new funciton
// the return must requireAccessToken() to be called.
// no matter what you must always use requireAccessToken() validate the api call.
// (one deliberate exception: getHomepagePhotos() below is public by design —
// anonymous homepage visitors need it, so it skips requireAccessToken().)
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getAccessToken } from '@/lib/access-token';
import { normalizeApiList, formatMemberDirectory, LEADERSHIP_GROUPS } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';

const API_URL = process.env.API_URL;

// Any auth failure here sends the browser to /login via Next's redirect(),
// never a thrown Error — thrown Server Action errors get their message
// redacted to a generic digest in production, which is why a plain
// `throw new Error('Session expired...')` used to show a confusing
// "An error occurred in the Server Components render" message instead of
// actually taking the member back to the login page.
async function requireAccessToken() {
  const session = await auth();
  // session.error means a token refresh attempt already failed (see auth.ts)
  // — the stored access token is dead, so don't bother trying to use it.
  if (!session || session.error) {
    redirect('/login');
  }
  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect('/login');
  }
  return accessToken;
}


// should've read the actual function but obviously since everything is protected
// this handles the request for BOTH GET and POST requests.
// probally will handle it for PUT and DELETE requests as well.
// whenever we get to that
async function apiRequest(path, accessToken, options = {}) {
  if (!API_URL) {
    throw new Error('No API URL found. Contact the infrastructure committee.');
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // this is the content type of the request
        // this was newly added so that people could send data to the api in json format, we orignally
       // only had the api accept json data.
       // updated to people could update their profiles, create announcments, etc.
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      ...options,
    });
  } catch {
    throw new Error('Fetch failed. Contact the infrastructure committee.');
  }

  if (res.status === 401) {
    redirect('/login');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Fetch failed. Contact the infrastructure committee.');
  }

  if (res.status === 204) return null;
  return res.json();
}

// ok whoever reads this, please turn off the auto complete feature of the ai.
// when it comes to comments this is really annoying
// however we had function to get explicit information like members events etc
// this function is universal and can be used to get any information from the api.
// also now that we are using the api to update profiles, create announcments, etc.
// we utilize ApiRequest to get and post data to the api.
async function apiGet(path, accessToken) {
  return apiRequest(path, accessToken);
}

// this is the function that puts data to the api
// this is used to update profiles, create announcments, etc.
// was kinda obvious
async function apiPut(path, accessToken, body) {
  return apiRequest(path, accessToken, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function apiPatch(path, accessToken, body) {
  return apiRequest(path, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

async function apiPost(path, accessToken, body) {
  return apiRequest(path, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function apiDelete(path, accessToken) {
  return apiRequest(path, accessToken, { method: 'DELETE' });
}

export async function getEvents() {
  const accessToken = await requireAccessToken();
  return apiGet('/events', accessToken);
}

// ktp-api's events model is camelCase-only (startDate/endDate/committeeIds)
// — every other model in this API uses snake_case, but this one doesn't, so
// don't "fix" these field names to match the rest of this file.
async function sendEventPayload(method, path, payload, failureMessage) {
  const accessToken = await requireAccessToken();
  const eventPayload = {
    title: payload.title,
    description: payload.description,
    location: payload.location ?? null,
    startDate: payload.startDate ?? payload.start_date,
    endDate: payload.endDate ?? payload.end_date,
    audience: payload.audience && payload.audience.length > 0 ? payload.audience : null,
    committeeIds: Array.isArray(payload.committeeIds) && payload.committeeIds.length > 0 ? payload.committeeIds : null,
    requiresAttendance: Boolean(payload.requiresAttendance),
    // A request to also send this as an email, not a stored field. The API
    // records the outcome as events.emailed_at and only ever sends once, so
    // this is ignored on an update of an event that already went out.
    send_email: Boolean(payload.sendEmail),
  };

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });
  } catch {
    return { ok: false, error: 'Fetch failed. Contact the infrastructure committee.' };
  }

  if (response.status === 401) {
    redirect('/login');
  }

  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, error: body?.message ?? failureMessage };
  }

  return { ok: true, event: body };
}

export async function createEvent(payload) {
  return sendEventPayload('POST', '/events', payload, 'Failed to create event');
}

export async function updateEvent(id, payload) {
  return sendEventPayload('PUT', `/events/${id}`, payload, 'Failed to update event');
}

export async function deleteEvent(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/events/${id}`, accessToken);
}

// Attendance — eboard or the event's own creator only (enforced server-side).
export async function getAttendanceCode(eventId) {
  const accessToken = await requireAccessToken();
  return apiGet(`/events/${eventId}/attendance/code`, accessToken);
}

export async function getAttendanceList(eventId) {
  const accessToken = await requireAccessToken();
  return apiGet(`/events/${eventId}/attendance`, accessToken);
}

export async function setAttendanceStatus(eventId, userId, status) {
  const accessToken = await requireAccessToken();
  return apiPut(`/events/${eventId}/attendance/${userId}`, accessToken, { status });
}

// Freezes the roster: the server stops adding people to it, so a pledge
// initiated mid-semester can't rewrite who a past event was for. Reversible —
// passing false only re-opens syncing, it never drops a recorded mark.
// Returns { finalizedAt }, null when un-finalized.
export async function setAttendanceFinalized(eventId, finalized) {
  const accessToken = await requireAccessToken();
  return apiPut(`/events/${eventId}/attendance-finalized`, accessToken, { finalized });
}

// Self check-in — any authenticated member, hit from the /checkin landing
// page after scanning the QR code.
export async function checkInToEvent(eventId, token) {
  const accessToken = await requireAccessToken();
  return apiPost(`/checkin/${eventId}/${token}`, accessToken, {});
}

// albumId: omit for the general shared album, or pass a specific album's id.
export async function getPhotos(albumId) {
  const accessToken = await requireAccessToken();
  const path = albumId ? `/photos?album_id=${encodeURIComponent(albumId)}` : '/photos';
  return apiGet(path, accessToken);
}

export async function getAlbums() {
  const accessToken = await requireAccessToken();
  return apiGet('/albums', accessToken);
}

// Cover + count for the general shared album, which has no row in `albums` —
// the website synthesises that album client-side, so its thumbnail data has to
// be fetched separately or it always renders as empty.
export async function getGeneralAlbumStats() {
  const accessToken = await requireAccessToken();
  return apiGet('/albums/general', accessToken);
}

// ─── Rush ────────────────────────────────────────────────────────────────────

// Announcements written for rushees. A separate table from /announcements
// entirely, so internal chapter posts can never surface here.
export async function getRushAnnouncements() {
  const accessToken = await requireAccessToken();
  return apiGet('/rush-announcements', accessToken);
}

export async function createRushAnnouncement({ title, body }) {
  const accessToken = await requireAccessToken();
  return apiPost('/rush-announcements', accessToken, { title, body });
}

export async function updateRushAnnouncement(id, { title, body }) {
  const accessToken = await requireAccessToken();
  return apiPut(`/rush-announcements/${id}`, accessToken, { title, body });
}

export async function deleteRushAnnouncement(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/rush-announcements/${id}`, accessToken);
}

// Rush signup window. "Open" is expressed entirely as an Authentik invitation
// with a future expiry — nothing is mirrored in our DB, so there's no second
// copy to drift out of sync with the thing actually enforcing the gate.
export async function getRushSignup() {
  const accessToken = await requireAccessToken();
  return apiGet('/admin/rush-signup', accessToken);
}

// Public — powers the signup button on the /rush marketing page, which
// unauthenticated visitors see. Deliberately skips requireAccessToken(), same
// as getHomepagePhotos() and getRoster().
//
// Never throws: a failure here should hide the button, not break the page.
// Someone reading about rush shouldn't get an error screen because Authentik
// is briefly unreachable.
export async function getPublicRushSignup() {
  if (!API_URL) return { is_open: false, signup_url: null };

  try {
    const res = await fetch(`${API_URL}/rush-signup/current`, { cache: 'no-store' });
    if (!res.ok) return { is_open: false, signup_url: null };
    return await res.json();
  } catch {
    return { is_open: false, signup_url: null };
  }
}

export async function openRushSignup({ name, expires }) {
  const accessToken = await requireAccessToken();
  return apiPost('/admin/rush-signup', accessToken, { name, expires });
}

export async function closeRushSignup(pk) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/admin/rush-signup/${pk}`, accessToken);
}

export async function createAlbum(name, description, audience, committeeIds) {
  const accessToken = await requireAccessToken();
  return apiPost('/albums', accessToken, {
    name,
    description,
    audience: audience ?? [],
    committee_ids: committeeIds ?? [],
  });
}

// Albums and folders: an empty audience means "everyone". Documents are the
// exception — see setDocumentVisibility.
export async function setAlbumVisibility(id, { audience, committeeIds }) {
  const accessToken = await requireAccessToken();
  return apiPatch(`/albums/${id}/visibility`, accessToken, {
    audience: audience ?? [],
    committee_ids: committeeIds ?? [],
  });
}

export async function setFolderVisibility(id, { audience, committeeIds }) {
  const accessToken = await requireAccessToken();
  return apiPatch(`/documents/folders/${id}/visibility`, accessToken, {
    audience: audience ?? [],
    committee_ids: committeeIds ?? [],
  });
}

// `inherit: true` sends NOTHING, which the backend reads as "follow the
// folder". Sending an empty array instead would mean "visible to everyone" and
// would expose a document sitting inside a restricted folder.
export async function setDocumentVisibility(id, { inherit, audience, committeeIds }) {
  const accessToken = await requireAccessToken();
  const body = inherit
    ? {}
    : { audience: audience ?? [], committee_ids: committeeIds ?? [] };
  return apiPatch(`/documents/${id}/visibility`, accessToken, body);
}

export async function deleteAlbum(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/albums/${id}`, accessToken);
}

// Calendar subscription. POST both creates and regenerates: issuing a new
// token is what revokes the old link, so a separate revoke endpoint would
// imply the old one survives until you call it.
export async function createCalendarFeed() {
  const accessToken = await requireAccessToken();
  return apiPost('/calendar/feed', accessToken, {});
}

export async function deleteCalendarFeed() {
  const accessToken = await requireAccessToken();
  return apiDelete('/calendar/feed', accessToken);
}

// Meeting requests. Accepted meetings also show up in the calendar
// subscription feed.
export async function getMeetings() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/meetings', accessToken);
  return Array.isArray(data) ? data : [];
}

// Only what belongs on this person's calendar (scheduled, and they're either
// the organizer or RSVP'd going). Deliberately NOT getMeetings() filtered
// client-side: that returns declined and unanswered ones too, and restating
// the rule here would let it drift from findForCalendar, which is also what
// the ICS feed uses.
export async function getCalendarMeetings() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/meetings/calendar', accessToken);
  return Array.isArray(data) ? data : [];
}

export async function createMeeting({ title, message, location, startsAt, endsAt, inviteeIds, audience, committeeIds }) {
  const accessToken = await requireAccessToken();
  return apiPost('/meetings', accessToken, {
    title,
    message: message || null,
    location: location || null,
    starts_at: startsAt,
    ends_at: endsAt,
    invitee_ids: inviteeIds ?? [],
    // Groups and committees expand to individual invitees server-side, at
    // creation time. Only non-pledge members may send these; the API rejects
    // them otherwise.
    audience: audience ?? [],
    committee_ids: committeeIds ?? [],
  });
}

export async function respondToMeeting(id, response) {
  const accessToken = await requireAccessToken();
  return apiPost(`/meetings/${id}/respond`, accessToken, { response });
}

export async function cancelMeeting(id) {
  const accessToken = await requireAccessToken();
  return apiPost(`/meetings/${id}/cancel`, accessToken, {});
}

// Permanent, and only allowed for meetings that are over or already cancelled
// (enforced in meetingsController). Cancelling tells everyone it's off;
// deleting removes the record afterwards. Organizer only.
export async function deleteMeeting(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/meetings/${id}`, accessToken);
}

// ---------------------------------------------------------------------------
// Interview scheduling
//
// Eboard publishes timed slots, rushees claim one, and a claimed slot is gone.
// This replaced meetings for rushees — see routes/meetings.js in ktp-api.
// ---------------------------------------------------------------------------

// Published schedules only, with seats left and which slot is yours. Other
// candidates' names are never selected by the API, so there's nothing to strip.
export async function getAvailableInterviews() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/interviews/available', accessToken);
  return Array.isArray(data) ? data : [];
}

// Booked interviews only, event-shaped. Same split as getCalendarMeetings: the
// rule lives in findForCalendar so the portal and ICS feed can't drift.
export async function getCalendarInterviews() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/interviews/calendar', accessToken);
  return Array.isArray(data) ? data : [];
}

// 409s are expected and must be shown: someone took the last seat, or you
// already hold a time. Both are normal on signup night.
export async function bookInterviewSlot(slotId) {
  const accessToken = await requireAccessToken();
  return apiPost(`/interviews/slots/${slotId}/book`, accessToken, {});
}

// Your own, or anyone's if you run interviews.
export async function cancelInterviewBooking(bookingId) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/interviews/bookings/${bookingId}`, accessToken);
}

// Management — eboard and chair only; the API 403s for everyone else.
export async function getInterviewSchedules() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/interviews/schedules', accessToken);
  return Array.isArray(data) ? data : [];
}

// The full sign-up sheet: every slot with the names of who booked it.
export async function getInterviewSchedule(id) {
  const accessToken = await requireAccessToken();
  return apiGet(`/interviews/schedules/${id}`, accessToken);
}

export async function createInterviewSchedule({ title, description, location, interviewerCommitteeIds }) {
  const accessToken = await requireAccessToken();
  return apiPost('/interviews/schedules', accessToken, {
    title,
    description: description || null,
    location: location || null,
    // Which committees may sign up to RUN interviews in this round. An empty
    // list is a real setting — nobody outside eboard — not a missing one.
    interviewer_committee_ids: interviewerCommitteeIds ?? [],
  });
}

// Also the publish switch. Only the keys present are changed.
export async function updateInterviewSchedule(id, changes) {
  const accessToken = await requireAccessToken();
  return apiPatch(`/interviews/schedules/${id}`, accessToken, changes);
}

// DELETE for the two interview routes that can refuse: 204 on success, or 409
// with a `code` when the thing still has bookings.
//
// Returns { ok } / { error, code } rather than throwing, for the same reason as
// updateUsername: a thrown Server Action error has its message replaced in
// production by React's generic "An error occurred in the Server Components
// render" (#441). It matters more here than anywhere else in this file — the
// message being redacted is the "N people have already booked" warning, which
// is the only thing standing between a misclick and real cancelled interviews.
//
// `code` is passed through so a caller can tell that recoverable refusal apart
// from a genuine failure, and only offer to force past the former.
async function interviewDelete(path, fallback) {
  const accessToken = await requireAccessToken();

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    return { error: 'Fetch failed. Contact the infrastructure committee.' };
  }

  if (res.status === 401) {
    redirect('/login');
  }
  if (res.ok) return { ok: true };

  const body = await res.json().catch(() => ({}));
  return { error: body.message ?? fallback, code: body.code ?? null };
}

// 409s with code 'has_bookings' unless forced — there's no undo.
export async function deleteInterviewSchedule(id, { force = false } = {}) {
  return interviewDelete(
    `/interviews/schedules/${id}${force ? '?force=true' : ''}`,
    'Could not delete that schedule',
  );
}

export async function createInterviewSlot(scheduleId, { startsAt, endsAt, location, capacity, interviewerCapacity }) {
  const accessToken = await requireAccessToken();
  return apiPost(`/interviews/schedules/${scheduleId}/slots`, accessToken, {
    starts_at: startsAt,
    ends_at: endsAt,
    location: location || null,
    // Rushee seats and interviewer spots are separate counts.
    capacity: capacity ?? 1,
    interviewer_capacity: interviewerCapacity ?? 1,
  });
}

// Only the keys present are changed, and an explicit `null` CLEARS a column —
// that is how "no room" and "Not decided" are expressed, so falsy values are
// passed through rather than stripped.
//
// Returns { error } rather than throwing, for the same reason as
// updateUsername above: every failure here is one the eboard member has to read
// and act on — above all the 409 for lowering seats below the number already
// booked, which has no ?force override — and a thrown Server Action error has
// its message replaced in production by React's generic "An error occurred in
// the Server Components render" (#441).
export async function updateInterviewSlot(id, { startsAt, endsAt, location, capacity, interviewerCapacity }) {
  const accessToken = await requireAccessToken();

  let res;
  try {
    res = await fetch(`${API_URL}/interviews/slots/${id}`, {
      method: 'PATCH',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...(startsAt !== undefined ? { starts_at: startsAt } : {}),
        ...(endsAt !== undefined ? { ends_at: endsAt } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
        ...(interviewerCapacity !== undefined ? { interviewer_capacity: interviewerCapacity } : {}),
      }),
    });
  } catch {
    return { error: 'Fetch failed. Contact the infrastructure committee.' };
  }

  if (res.status === 401) {
    redirect('/login');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: body.message ?? 'Could not save that slot' };
  }

  return body;
}

// The rounds this member may staff, with every slot, who else signed up, and
// which are theirs. Members only — the API 403s rushees.
//
// Swallows its own errors and returns [] for the same reason getRushCount does:
// this decides whether a NAV ENTRY exists, so a backend hiccup must hide the tab
// rather than break the sidebar on every page of the portal. An empty list is
// also the honest answer for a member in no designated committee — the API
// returns [] rather than 403 for exactly that case.
export async function getInterviewerSchedules() {
  try {
    const accessToken = await requireAccessToken();
    const data = await apiGet('/interviews/interviewer-schedules', accessToken);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return [];
  }
}

// Interviewer signup. Eboard/chair may add or remove anyone; a member may only
// act on themselves, which the API enforces — this just passes the id.
//
// Returns { error } rather than throwing: the 409s here ("someone took the last
// interviewer spot", "you're already signed up") are messages a person has to
// read, and a thrown Server Action error is redacted to React #441 in
// production. Same rule as updateInterviewSlot above.
export async function signUpAsInterviewer(slotId, { userId } = {}) {
  const accessToken = await requireAccessToken();

  let res;
  try {
    res = await fetch(`${API_URL}/interviews/slots/${slotId}/interviewers`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userId ? { user_id: userId } : {}),
    });
  } catch {
    return { error: 'Fetch failed. Contact the infrastructure committee.' };
  }

  if (res.status === 401) {
    redirect('/login');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: body.message ?? 'Could not sign up for that slot', code: body.code ?? null };
  }
  return { ok: true, ...body };
}

export async function withdrawInterviewer(slotId, userId) {
  return interviewDelete(
    `/interviews/slots/${slotId}/interviewers/${userId}`,
    'Could not withdraw from that slot',
  );
}

// Same force rule and same { ok } / { error, code } shape as
// deleteInterviewSchedule.
export async function deleteInterviewSlot(id, { force = false } = {}) {
  return interviewDelete(
    `/interviews/slots/${id}${force ? '?force=true' : ''}`,
    'Could not delete that slot',
  );
}

// ---------------------------------------------------------------------------
// Activity log — eboard only; the API 403s for everyone else.
//
// Deliberately excludes direct messages and group chat traffic. See the SKIP
// list in ktp-api's middleware/auditLog.js: logging DM metadata would hand
// eboard, through the log, the one thing they're not allowed to see.
// ---------------------------------------------------------------------------
export async function getAuditLog({ limit = 50, offset = 0, targetType, failedOnly } = {}) {
  const accessToken = await requireAccessToken();
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (targetType) params.set('target_type', targetType);
  if (failedOnly) params.set('failed', 'true');
  const data = await apiGet(`/audit-log?${params.toString()}`, accessToken);
  return Array.isArray(data) ? data : [];
}

export async function getAuditLogTypes() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/audit-log/types', accessToken);
  return Array.isArray(data) ? data : [];
}

export async function getMembers() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/members', accessToken);
  return normalizeApiList(data);
}

export async function getMember(id) {
  const accessToken = await requireAccessToken();
  return apiGet(`/members/${id}`, accessToken);
}

export async function getAdminUsers() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/admin/users', accessToken);
  return normalizeApiList(data);
}

export async function updateUserGroup(authentikId, group) {
  const accessToken = await requireAccessToken();
  return apiPut(`/admin/users/${authentikId}/group`, accessToken, { group });
}

export async function updateExecTitle(authentikId, execTitle) {
  const accessToken = await requireAccessToken();
  return apiPut(`/admin/users/${authentikId}/exec-title`, accessToken, { execTitle });
}

// ─── Eboard editing another member's profile ───
//
// These three return { error } rather than throwing, for the same reason
// updateUsername below does: a thrown Server Action error has its message
// replaced in production by React's generic error #441, and every failure
// here is one the eboard member needs to read to know what to do next — a
// rejected LinkedIn URL, a taken username, a user who no longer exists.
async function adminMutate(path, method, accessToken, body) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    return { error: 'Fetch failed. Contact the infrastructure committee.' };
  }

  if (res.status === 401) {
    redirect('/login');
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: payload.message ?? 'Request failed' };
  }
  return payload;
}

export async function adminUpdateUserProfile(authentikId, payload) {
  const accessToken = await requireAccessToken();
  return adminMutate(`/admin/users/${authentikId}/profile`, 'PUT', accessToken, payload);
}

export async function adminUpdateUsername(authentikId, username) {
  const accessToken = await requireAccessToken();
  return adminMutate(`/admin/users/${authentikId}/username`, 'PUT', accessToken, { username });
}

export async function adminRemoveProfilePicture(authentikId) {
  const accessToken = await requireAccessToken();
  return adminMutate(`/admin/users/${authentikId}/profile-picture`, 'DELETE', accessToken);
}

// FormData, so it can't go through adminMutate — setting Content-Type by hand
// would omit the multipart boundary and the API would reject the body. Same
// caveat as uploadProfilePicture below; the browser sets the header itself.
export async function adminUploadProfilePicture(authentikId, formData) {
  const accessToken = await requireAccessToken();

  let res;
  try {
    res = await fetch(`${API_URL}/admin/users/${authentikId}/profile-picture`, {
      method: 'PUT',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    return { error: 'Fetch failed. Contact the infrastructure committee.' };
  }

  if (res.status === 401) {
    redirect('/login');
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: payload.message ?? 'Failed to upload profile picture' };
  }
  return payload;
}

// `group` narrows to one member group — used by the Rushees directory, which
// is the same component filtered to rush rather than a second directory.
export async function getMemberDirectory({ group } = {}) {
  const accessToken = await requireAccessToken();
  const path = group ? `/members?group=${encodeURIComponent(group)}` : '/members';
  const data = await apiGet(path, accessToken);
  return formatMemberDirectory(data);
}

// Whether to offer the Rushees tab at all. Returns 0 both when there are no
// rushees and when the caller may not see them, so callers need no branch.
// Never throws — a failure here must not take down the sidebar.
export async function getRushCount() {
  try {
    const accessToken = await requireAccessToken();
    const data = await apiGet('/members/rush-count', accessToken);
    return Number(data?.count) || 0;
  } catch {
    return 0;
  }
}

// Groups that mean "actually in the chapter". Mirrors ktp-api's
// SHARED_ALBUM_GROUPS, which is what gates /members.
const MEMBER_GROUPS = ['eboard', 'chair', 'active', 'alumni', 'pledge'];

// People the current user can start a conversation with.
//
// Rushees can't reach /members at all — it 403s — so asking for the directory
// would leave their Messages tab showing "No members found" with no way to
// contact anyone. They get the leadership list instead, which is the same set
// the API will actually let them message.
//
// Decided here rather than in the component because the caller shouldn't have
// to know the rule, and a component that forgets it fails silently: an empty
// list looks like "nobody to message" rather than an error.
export async function getMessageableMembers() {
  const accessToken = await requireAccessToken();
  const session = await auth();
  const groups = session?.user?.groups ?? [];

  // Only rush-*only* accounts are restricted. Someone accepted into a pledge
  // class keeps the rush group until it's removed, and must still get the full
  // directory.
  const rushOnly = groups.includes('rush') && !groups.some((g) => MEMBER_GROUPS.includes(g));

  const data = await apiGet(rushOnly ? '/members/leadership' : '/members', accessToken);
  const members = formatMemberDirectory(data);

  if (rushOnly) return members;

  // Mirrors ktp-api's RUSH_DM_GROUPS: only leadership may message a rushee.
  // Everyone else gets the plain member list, which no longer contains
  // rushees anyway.
  if (!groups.some((g) => LEADERSHIP_GROUPS.includes(g))) return members;

  // Leadership has to ask for rushees explicitly now. /members stopped
  // returning them when rushees were pulled out of the main directory — they
  // live only in the Rushees directory — and without this second call the New
  // Message picker silently loses the interview and bid conversations that are
  // the entire reason leadership↔rushee DMs exist.
  const rushees = await apiGet('/members?group=rush', accessToken).catch((err) => {
    // A redirect must propagate — swallowing it renders the literal string
    // "NEXT_REDIRECT" instead of navigating. Anything else just means no
    // rushees to add, which must not take the member list down with it.
    if (isRedirectError(err)) throw err;
    return [];
  });

  return [...members, ...formatMemberDirectory(rushees)];
}

export async function getProfile() {
  const accessToken = await requireAccessToken();
  return apiGet('/users/me', accessToken);
}

// :p this updates the profile
export async function updateProfile(payload) {
  const accessToken = await requireAccessToken();
  return apiPut('/users/me/profile', accessToken, payload);
}

// Separate from updateProfile because the API keeps it separate — a rename can
// fail with "that name is taken" (409), shown next to the field.
//
// Returns { error } rather than throwing, for the same reason as
// uploadProfilePicture below: a thrown Server Action error has its message
// replaced in production by React's generic "An error occurred in the Server
// Components render" (error #441). Every failure here is one the member needs
// to read, so throwing would replace all of them with that.
export async function updateUsername(username) {
  const accessToken = await requireAccessToken();

  let res;
  try {
    res = await fetch(`${API_URL}/users/me/username`, {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });
  } catch {
    return { error: 'Fetch failed. Contact the infrastructure committee.' };
  }

  if (res.status === 401) {
    redirect('/login');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: body.message ?? 'Failed to change username' };
  }

  return body;
}

// Same FormData caveat as uploadPhoto() below — kept as a direct fetch
// rather than routed through apiRequest().
//
// Returns { error } instead of throwing on failure — a thrown Server Action
// error gets its message redacted to a generic digest in production (same
// reasoning as requireAccessToken() above), which is fine for the
// redirect('/login') case but not here, since this failure is meant to show
// the caller a real, specific message.
export async function uploadProfilePicture(formData) {
  const accessToken = await requireAccessToken();

  let res;
  try {
    res = await fetch(`${API_URL}/users/me/profile-picture`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    return { error: 'Fetch failed. Contact the infrastructure committee.' };
  }

  if (res.status === 401) {
    redirect('/login');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message ?? 'Failed to upload profile picture' };
  }

  return res.json();
}

// formData must contain a "file" field (the upload) plus any of
// title/caption/album_id — built by the caller (e.g. the shared album form).
// Kept as a direct fetch rather than routed through apiRequest(): that
// helper always sets Content-Type: application/json whenever a body is
// present, which would corrupt a multipart FormData upload.
export async function uploadPhoto(formData) {
  const accessToken = await requireAccessToken();

  let res;
  try {
    res = await fetch(`${API_URL}/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    throw new Error('Fetch failed. Contact the infrastructure committee.');
  }

  if (res.status === 401) {
    redirect('/login');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to upload photo');
  }

  return res.json();
}

export async function deletePhoto(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/photos/${id}`, accessToken);
}

// Eboard-managed document library — nested folders, view for any shared-album
// group, writes are eboard-only (enforced server-side by ktp-api).

// parentId: omit/null for the top level.
export async function getDocumentFolders(parentId) {
  const accessToken = await requireAccessToken();
  const path = parentId ? `/documents/folders?parent_id=${encodeURIComponent(parentId)}` : '/documents/folders';
  return apiGet(path, accessToken);
}

// folderId: omit/null for the top level.
export async function getDocuments(folderId) {
  const accessToken = await requireAccessToken();
  const path = folderId ? `/documents?folder_id=${encodeURIComponent(folderId)}` : '/documents';
  return apiGet(path, accessToken);
}

export async function createDocumentFolder(name, parentId, audience, committeeIds) {
  const accessToken = await requireAccessToken();
  return apiPost('/documents/folders', accessToken, {
    name,
    parent_id: parentId ?? null,
    audience: audience ?? [],
    committee_ids: committeeIds ?? [],
  });
}

export async function deleteDocumentFolder(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/documents/folders/${id}`, accessToken);
}

// Same FormData caveat as uploadPhoto() above — kept as a direct fetch
// rather than routed through apiRequest(). Returns { error } instead of
// throwing on failure (see uploadProfilePicture() above for why).
export async function uploadDocument(formData) {
  const accessToken = await requireAccessToken();

  let res;
  try {
    res = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    return { error: 'Fetch failed. Contact the infrastructure committee.' };
  }

  if (res.status === 401) {
    redirect('/login');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message ?? 'Failed to upload document' };
  }

  return res.json();
}

export async function deleteDocument(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/documents/${id}`, accessToken);
}

// An external hyperlink (Google Docs/Slides/Sheets, or any URL) shown in the
// same folder tree as uploaded documents — no file involved, just a link.
export async function createDocumentLink({ folderId, filename, url }) {
  const accessToken = await requireAccessToken();
  return apiPost('/documents/link', accessToken, { folder_id: folderId ?? null, filename, url });
}

// Public — the homepage gallery. Deliberately does not call
// requireAccessToken(): anonymous visitors need this data too.
export async function getHomepagePhotos() {
  if (!API_URL) {
    throw new Error('No API URL found. Contact the infrastructure committee.');
  }

  let res;
  try {
    res = await fetch(`${API_URL}/homepage-photos`, { cache: 'no-store' });
  } catch {
    throw new Error('Fetch failed. Contact the infrastructure committee.');
  }

  if (!res.ok) {
    throw new Error('Fetch failed. Contact the infrastructure committee.');
  }

  return res.json();
}

// Public — the "meet the chapter" roster page. Same deal as
// getHomepagePhotos(): anonymous visitors need this, no access token.
export async function getRoster() {
  if (!API_URL) {
    throw new Error('No API URL found. Contact the infrastructure committee.');
  }

  let res;
  try {
    res = await fetch(`${API_URL}/roster`, { cache: 'no-store' });
  } catch {
    throw new Error('Fetch failed. Contact the infrastructure committee.');
  }

  if (!res.ok) {
    throw new Error('Fetch failed. Contact the infrastructure committee.');
  }

  return res.json();
}

// Same FormData caveat as uploadPhoto() above.
export async function uploadHomepagePhoto(formData) {
  const accessToken = await requireAccessToken();

  let res;
  try {
    res = await fetch(`${API_URL}/homepage-photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    throw new Error('Fetch failed. Contact the infrastructure committee.');
  }

  if (res.status === 401) {
    redirect('/login');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to upload photo');
  }

  return res.json();
}

// For an asset a SWE/frontend person already uploaded directly in Immich —
// registers it in the homepage gallery without re-uploading the file.
export async function registerHomepagePhoto({ immich_asset_id, media_type, title, caption }) {
  const accessToken = await requireAccessToken();
  return apiPost('/homepage-photos/register', accessToken, { immich_asset_id, media_type, title, caption });
}

// Edits an existing gallery item's caption text in place. Before this, fixing a
// typo meant removing the item and re-uploading the file. Sending null or an
// empty string for either field clears it.
export async function updateHomepagePhoto(id, { title, caption }) {
  const accessToken = await requireAccessToken();
  return apiPut(`/homepage-photos/${id}`, accessToken, { title, caption });
}

export async function removeHomepagePhoto(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/homepage-photos/${id}`, accessToken);
}

export async function reorderHomepagePhotos(ids) {
  const accessToken = await requireAccessToken();
  return apiPut('/homepage-photos/reorder', accessToken, { ids });
}

// Eboard-posted announcements — audience omitted/null means everyone.
export async function getAnnouncements() {
  const accessToken = await requireAccessToken();
  return apiGet('/announcements', accessToken);
}

export async function createAnnouncement({ title, body, audience, committeeId, sendEmail }) {
  const accessToken = await requireAccessToken();
  return apiPost('/announcements', accessToken, {
    title,
    body,
    // See sendEventPayload — a request to email, not a stored field.
    send_email: Boolean(sendEmail),
    // Both are sent. This used to null the audience whenever a committee was
    // set, which made role and committee targeting mutually exclusive on the
    // wire. announcementModel.findAllForGroups ORs the two, so an announcement
    // carrying both reaches the union of the groups and the committee.
    audience: audience && audience.length > 0 ? audience : null,
    committee_id: committeeId || null,
  });
}

export async function updateAnnouncement(id, { title, body, audience, committeeId }) {
  const accessToken = await requireAccessToken();
  return apiPut(`/announcements/${id}`, accessToken, {
    title,
    body,
    // Both are sent. This used to null the audience whenever a committee was
    // set, which made role and committee targeting mutually exclusive on the
    // wire. announcementModel.findAllForGroups ORs the two, so an announcement
    // carrying both reaches the union of the groups and the committee.
    audience: audience && audience.length > 0 ? audience : null,
    committee_id: committeeId || null,
  });
}

export async function deleteAnnouncement(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/announcements/${id}`, accessToken);
}

// Committees — DB-only membership (no Authentik groups). Anyone can join/leave
// as a plain member; only eboard can create/delete a committee or promote
// someone to chair.
export async function getCommittees() {
  const accessToken = await requireAccessToken();
  return apiGet('/committees', accessToken);
}

export async function createCommittee(name) {
  const accessToken = await requireAccessToken();
  return apiPost('/committees', accessToken, { name });
}

export async function deleteCommittee(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/committees/${id}`, accessToken);
}

export async function joinCommittee(id) {
  const accessToken = await requireAccessToken();
  return apiPost(`/committees/${id}/join`, accessToken, {});
}

export async function leaveCommittee(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/committees/${id}/leave`, accessToken);
}

export async function getCommitteeMembers(id) {
  const accessToken = await requireAccessToken();
  return apiGet(`/committees/${id}/members`, accessToken);
}

export async function setCommitteeMemberRole(id, userId, role) {
  const accessToken = await requireAccessToken();
  return apiPut(`/committees/${id}/members/${userId}/role`, accessToken, { role });
}

// Polls — targeted the same way as events/announcements (audience array or
// committeeId, mutually exclusive). Voting is self-service; only eboard can
// see the per-voter breakdown (getPollStats).
export async function getPolls() {
  const accessToken = await requireAccessToken();
  return apiGet('/polls', accessToken);
}

export async function createPoll({ question, description, options, multiSelect, audience, committeeId, expiresAt }) {
  const accessToken = await requireAccessToken();
  return apiPost('/polls', accessToken, {
    question,
    description: description || null,
    options,
    multi_select: Boolean(multiSelect),
    // Both are sent. This used to null the audience whenever a committee was
    // set, which made role and committee targeting mutually exclusive on the
    // wire. announcementModel.findAllForGroups ORs the two, so an announcement
    // carrying both reaches the union of the groups and the committee.
    audience: audience && audience.length > 0 ? audience : null,
    committee_id: committeeId || null,
    expires_at: expiresAt || null,
  });
}

export async function deletePoll(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/polls/${id}`, accessToken);
}

export async function closePoll(id) {
  const accessToken = await requireAccessToken();
  return apiPut(`/polls/${id}/close`, accessToken, {});
}

export async function votePoll(id, optionIds) {
  const accessToken = await requireAccessToken();
  return apiPost(`/polls/${id}/vote`, accessToken, { option_ids: optionIds });
}

export async function getPollStats(id) {
  const accessToken = await requireAccessToken();
  return apiGet(`/polls/${id}/stats`, accessToken);
}

// Direct messages — any member can message any other member.
export async function getConversations() {
  const accessToken = await requireAccessToken();
  return apiGet('/messages/conversations', accessToken);
}

export async function getUnreadMessageCount() {
  const accessToken = await requireAccessToken();
  return apiGet('/messages/unread-count', accessToken);
}

// Per-tab "there's something new here" counts for the sidebar badges. Keyed by
// the last segment of the nav href, so one response covers /member, /pledge
// and /rushee without the caller knowing which portal it's in.
//
// Separate from the message counts above: messages track per-message read
// receipts, these track a per-tab cursor. See the API's notificationCursorModel.
export async function getTabNotifications() {
  const accessToken = await requireAccessToken();
  return apiGet('/notifications/unread', accessToken);
}

// Which delivery channels the API can actually use right now. Currently just
// { email: boolean } — false until Resend is configured on the server.
//
// Asked before offering to email something: the alternative is a checkbox that
// posts happily and mails nobody, with nothing on screen saying so.
export async function getNotificationChannels() {
  const accessToken = await requireAccessToken();
  return apiGet('/notifications/channels', accessToken);
}

// Notification preferences. Shared with the iOS app, which owns the push
// categories; the website only surfaces email_enabled, since a browser has no
// push registration to speak of.
export async function getNotificationPreferences() {
  const accessToken = await requireAccessToken();
  return apiGet('/notifications/preferences', accessToken);
}

// Returns { error } rather than throwing — this is a control a person watches
// for confirmation, and a thrown Server Action error is redacted to React
// error #441 in production, which would show up as gibberish beside the toggle.
export async function updateNotificationPreferences(preferences) {
  try {
    const accessToken = await requireAccessToken();
    return { preferences: await apiPut('/notifications/preferences', accessToken, preferences) };
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { error: err.message };
  }
}

// Returns { error } rather than throwing: this fires on ordinary navigation,
// and a thrown Server Action error is redacted to React error #441 in
// production. A failed cursor write must never surface as an error message on
// a page the member was only trying to read.
export async function markTabSeen(tab) {
  try {
    const accessToken = await requireAccessToken();
    await apiPost(`/notifications/seen/${tab}`, accessToken);
    return { ok: true };
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { error: err.message };
  }
}

export async function getConversation(userId) {
  const accessToken = await requireAccessToken();
  return apiGet(`/messages/conversations/${userId}`, accessToken);
}

// Same FormData caveat as uploadPhoto() above — kept as a direct fetch
// rather than routed through apiPost(), since this now optionally carries a
// file attachment alongside (or instead of) body text.
export async function sendMessage(recipientId, { body, file } = {}) {
  const accessToken = await requireAccessToken();

  const formData = new FormData();
  formData.append('recipient_id', recipientId);
  if (body) formData.append('body', body);
  if (file) formData.append('file', file);

  let res;
  try {
    res = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    throw new Error('Fetch failed. Contact the infrastructure committee.');
  }

  if (res.status === 401) {
    redirect('/login');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to send message');
  }
  return res.json();
}

export async function toggleMessageReaction(messageId, emoji) {
  const accessToken = await requireAccessToken();
  return apiPost(`/messages/${messageId}/reactions`, accessToken, { emoji });
}

export async function deleteMessage(messageId) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/messages/${messageId}`, accessToken);
}

export async function markConversationRead(userId) {
  const accessToken = await requireAccessToken();
  return apiPut(`/messages/conversations/${userId}/read`, accessToken);
}

// Eboard-created group chats with an assigned member list — any assigned
// member can post; only eboard can create/delete a chat or manage membership.
export async function getGroupChats() {
  const accessToken = await requireAccessToken();
  return apiGet('/group-chats', accessToken);
}

// Eboard oversight — every OFFICIAL chapter chat, including ones they aren't
// in. Member-created chats are excluded server-side; the way into one of those
// is a report, not a permission. 403s for anyone who isn't eboard.
export async function getAllGroupChats() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/group-chats/all', accessToken);
  return Array.isArray(data) ? data : [];
}

export async function getUnreadGroupChatCount() {
  const accessToken = await requireAccessToken();
  return apiGet('/group-chats/unread-count', accessToken);
}

// `audience` and `committeeIds` make membership live: anyone in one of those
// groups or committees is a member of the chat for as long as they're in it,
// and stops being one when they leave. `memberIds` is still the explicit
// individual list, and the two combine.
export async function createGroupChat({ name, memberIds, audience, committeeIds }) {
  const accessToken = await requireAccessToken();
  return apiPost('/group-chats', accessToken, {
    name,
    member_ids: memberIds,
    audience: audience ?? [],
    committee_ids: committeeIds ?? [],
  });
}

// Changes which groups/committees a chat follows. Takes effect immediately
// because membership is derived at read time; individually-added members are
// left alone.
export async function setGroupChatAudience(id, { audience, committeeIds }) {
  const accessToken = await requireAccessToken();
  return apiPatch(`/group-chats/${id}/audience`, accessToken, {
    audience: audience ?? [],
    committee_ids: committeeIds ?? [],
  });
}

export async function deleteGroupChat(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/group-chats/${id}`, accessToken);
}

export async function getGroupChatMessages(id) {
  const accessToken = await requireAccessToken();
  return apiGet(`/group-chats/${id}/messages`, accessToken);
}

// Same FormData caveat as uploadPhoto() above — kept as a direct fetch
// rather than routed through apiPost(), since this now optionally carries a
// file attachment alongside (or instead of) body text.
export async function sendGroupChatMessage(id, { body, file } = {}) {
  const accessToken = await requireAccessToken();

  const formData = new FormData();
  if (body) formData.append('body', body);
  if (file) formData.append('file', file);

  let res;
  try {
    res = await fetch(`${API_URL}/group-chats/${id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    throw new Error('Fetch failed. Contact the infrastructure committee.');
  }

  if (res.status === 401) {
    redirect('/login');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Failed to send message');
  }
  return res.json();
}

export async function toggleGroupChatReaction(id, messageId, emoji) {
  const accessToken = await requireAccessToken();
  return apiPost(`/group-chats/${id}/messages/${messageId}/reactions`, accessToken, { emoji });
}

export async function deleteGroupChatMessage(id, messageId) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/group-chats/${id}/messages/${messageId}`, accessToken);
}

// Same FormData caveat as uploadPhoto() above. Returns { error } instead of
// throwing (see uploadProfilePicture() above for why).
export async function updateGroupChatPhoto(id, formData) {
  const accessToken = await requireAccessToken();

  let res;
  try {
    res = await fetch(`${API_URL}/group-chats/${id}/photo`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  } catch {
    return { error: 'Fetch failed. Contact the infrastructure committee.' };
  }

  if (res.status === 401) {
    redirect('/login');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message ?? 'Failed to update photo' };
  }
  return res.json();
}

export async function markGroupChatRead(id) {
  const accessToken = await requireAccessToken();
  return apiPut(`/group-chats/${id}/read`, accessToken);
}

export async function getGroupChatMembers(id) {
  const accessToken = await requireAccessToken();
  return apiGet(`/group-chats/${id}/members`, accessToken);
}

export async function addGroupChatMember(id, userId) {
  const accessToken = await requireAccessToken();
  return apiPost(`/group-chats/${id}/members`, accessToken, { user_id: userId });
}

export async function removeGroupChatMember(id, userId) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/group-chats/${id}/members/${userId}`, accessToken);
}

// Blocking — one-directional. Blocking someone stops new DMs starting in
// either direction and hides their messages from the caller's own view.
export async function getBlockedUsers() {
  const accessToken = await requireAccessToken();
  return apiGet('/users/blocked', accessToken);
}

export async function blockUser(userId) {
  const accessToken = await requireAccessToken();
  return apiPost(`/users/${userId}/block`, accessToken, {});
}

export async function unblockUser(userId) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/users/${userId}/block`, accessToken);
}

// Reports — self-service to submit, eboard-only to review/resolve.
export async function createReport({ contentType, contentId, reportedUserId, reason, explanation }) {
  const accessToken = await requireAccessToken();
  return apiPost('/reports', accessToken, {
    content_type: contentType,
    content_id: contentId ?? null,
    reported_user_id: reportedUserId ?? null,
    reason,
    explanation: explanation || null,
  });
}

export async function getReports(status) {
  const accessToken = await requireAccessToken();
  const path = status ? `/reports?status=${encodeURIComponent(status)}` : '/reports';
  return apiGet(path, accessToken);
}

export async function updateReportStatus(id, { status, moderatorResponse }) {
  const accessToken = await requireAccessToken();
  return apiPut(`/reports/${id}/status`, accessToken, {
    status,
    moderator_response: moderatorResponse || null,
  });
}

// Self-service account deletion — anonymizes server-side (see ktp-api docs),
// doesn't touch the Authentik session itself. Caller is responsible for
// signing out immediately after this succeeds.
export async function deleteAccount() {
  const accessToken = await requireAccessToken();
  return apiDelete('/users/me', accessToken);
}
