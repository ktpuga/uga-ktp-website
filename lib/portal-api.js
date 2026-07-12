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

// ktp-api's events model is camelCase-only (startDate/endDate/committeeId/
// calendlyUrl) — every other model in this API uses snake_case, but this one
// doesn't, so don't "fix" these field names to match the rest of this file.
async function sendEventPayload(method, path, payload, failureMessage) {
  const accessToken = await requireAccessToken();
  const eventPayload = {
    title: payload.title,
    description: payload.description,
    location: payload.location ?? null,
    startDate: payload.startDate ?? payload.start_date,
    endDate: payload.endDate ?? payload.end_date,
    audience: payload.audience && payload.audience.length > 0 ? payload.audience : null,
    committeeId: payload.committeeId ?? null,
    calendlyUrl: payload.calendlyUrl ?? null,
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

export async function createAlbum(name, description) {
  const accessToken = await requireAccessToken();
  return apiPost('/albums', accessToken, { name, description });
}

export async function deleteAlbum(id) {
  const accessToken = await requireAccessToken();
  return apiDelete(`/albums/${id}`, accessToken);
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

export async function getMemberDirectory() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/members', accessToken);
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

export async function createDocumentFolder(name, parentId) {
  const accessToken = await requireAccessToken();
  return apiPost('/documents/folders', accessToken, { name, parent_id: parentId ?? null });
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

export async function createGroupChat({ name, memberIds }) {
  const accessToken = await requireAccessToken();
  return apiPost('/group-chats', accessToken, { name, member_ids: memberIds });
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
