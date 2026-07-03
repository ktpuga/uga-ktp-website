'use server';

// if you are ever creating a new funciton 
// the return must requireAccessToken() to be called.
// no matter what you must always use requireAccessToken() validate the api call.
import { auth } from '@/auth';
import { getAccessToken } from '@/lib/access-token';
import { normalizeApiList, formatMemberDirectory } from '@/lib/portal-format';

const API_URL = process.env.API_URL;

async function requireAccessToken() {
  const session = await auth();
  if (!session) {
    throw new Error('You must be signed in to view this content');
  }
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Session expired — please sign in again');
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
    throw new Error('Session expired — please sign in again');
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

export async function getEvents() {
  const accessToken = await requireAccessToken();
  return apiGet('/events', accessToken);
}

export async function getPhotos() {
  const accessToken = await requireAccessToken();
  return apiGet('/photos', accessToken);
}

export async function getMembers() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/members', accessToken);
  return normalizeApiList(data);
}

export async function getMemberDirectory() {
  const accessToken = await requireAccessToken();
  const data = await apiGet('/members', accessToken);
  return formatMemberDirectory(data);
}

export async function getProfile() {
  const accessToken = await requireAccessToken() ;
  return apiGet('/users/me', accessToken);
}

// :p this updates the profile
export async function updateProfile(payload) {
  const accessToken = await requireAccessToken();
  return apiPut('/users/me/profile', accessToken, payload);
}
