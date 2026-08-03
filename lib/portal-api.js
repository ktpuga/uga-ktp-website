'use server';

// if you are ever creating a new funciton
// the return must requireAccessToken() to be called.
// no matter what you must always use requireAccessToken() validate the api call.
// (one deliberate exception: getHomepagePhotos() below is public by design —
// anonymous homepage visitors need it, so it skips requireAccessToken().)
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getAccessToken } from '@/lib/access-token';
import { normalizeApiList, formatMemberDirectory } from '@/lib/portal-format';

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
    throw new Error('No API URL found — contact infrastructure committee');
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
    throw new Error('Fetch failed — contact infrastructure committee');
  }

  if (res.status === 401) {
    redirect('/login');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Fetch failed — contact infrastructure committee');
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
    return { ok: false, error: 'Fetch failed — contact infrastructure committee' };
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
  return formatMemberDirectory(data);
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
    return { error: 'Fetch failed — contact infrastructure committee' };
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
    throw new Error('Fetch failed — contact infrastructure committee');
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
    return { error: 'Fetch failed — contact infrastructure committee' };
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
    throw new Error('No API URL found — contact infrastructure committee');
  }

  let res;
  try {
    res = await fetch(`${API_URL}/homepage-photos`, { cache: 'no-store' });
  } catch {
    throw new Error('Fetch failed — contact infrastructure committee');
  }

  if (!res.ok) {
    throw new Error('Fetch failed — contact infrastructure committee');
  }

  return res.json();
}

// Public — the "meet the chapter" roster page. Same deal as
// getHomepagePhotos(): anonymous visitors need this, no access token.
export async function getRoster() {
  if (!API_URL) {
    throw new Error('No API URL found — contact infrastructure committee');
  }

  let res;
  try {
    res = await fetch(`${API_URL}/roster`, { cache: 'no-store' });
  } catch {
    throw new Error('Fetch failed — contact infrastructure committee');
  }

  if (!res.ok) {
    throw new Error('Fetch failed — contact infrastructure committee');
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
    throw new Error('Fetch failed — contact infrastructure committee');
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

export async function createAnnouncement({ title, body, audience, committeeId }) {
  const accessToken = await requireAccessToken();
  return apiPost('/announcements', accessToken, {
    title,
    body,
    audience: committeeId ? null : audience && audience.length > 0 ? audience : null,
    committee_id: committeeId || null,
  });
}

export async function updateAnnouncement(id, { title, body, audience, committeeId }) {
  const accessToken = await requireAccessToken();
  return apiPut(`/announcements/${id}`, accessToken, {
    title,
    body,
    audience: committeeId ? null : audience && audience.length > 0 ? audience : null,
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
    audience: committeeId ? null : audience && audience.length > 0 ? audience : null,
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
    throw new Error('Fetch failed — contact infrastructure committee');
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
    throw new Error('Fetch failed — contact infrastructure committee');
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
    return { error: 'Fetch failed — contact infrastructure committee' };
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
