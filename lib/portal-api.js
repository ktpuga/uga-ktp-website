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
  if (!session) {
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

export async function createEvent(payload) {
  const accessToken = await requireAccessToken();
  const snakePayload = {
    title: payload.title,
    description: payload.description,
    location: payload.location,
    start_date: payload.start_date ?? payload.startDate,
    end_date: payload.end_date ?? payload.endDate,
  };
  const camelPayload = {
    title: payload.title,
    description: payload.description,
    location: payload.location,
    startDate: payload.startDate ?? payload.start_date,
    endDate: payload.endDate ?? payload.end_date,
  };

  const postEventPayload = async (eventPayload) => {
    let response;
    try {
      response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      });
    } catch {
      throw new Error('Fetch failed - contact infrastructure committee');
    }

    if (response.status === 401) {
      redirect('/login');
    }

    const body = response.status === 204 ? null : await response.json().catch(() => ({}));
    return { body, response };
  };

  const firstResult = await postEventPayload(snakePayload);
  if (firstResult.response.ok) return firstResult.body;

  if ([400, 422].includes(firstResult.response.status)) {
    const secondResult = await postEventPayload(camelPayload);
    if (secondResult.response.ok) return secondResult.body;

    const secondError = secondResult.body ?? {};
    throw new Error(secondError.message ?? secondError.error ?? secondError.detail ?? 'Failed to create event');
  }

  const firstError = firstResult.body ?? {};
  throw new Error(firstError.message ?? firstError.error ?? firstError.detail ?? 'Failed to create event');
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

export async function getMembers() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/members', accessToken);
  return normalizeApiList(data);
}

export async function getAdminUsers() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/admin/users', accessToken);
  return normalizeApiList(data);
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
