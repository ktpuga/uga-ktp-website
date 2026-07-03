'use server';

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

async function apiGet(path, accessToken) {
  if (!API_URL) {
    throw new Error('No API URL found — contact infrastructure committee');
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    throw new Error('Fetch failed — contact infrastructure committee');
  }

  if (res.status === 401) {
    throw new Error('Session expired — please sign in again');
  }
  if (!res.ok) {
    throw new Error('Fetch failed — contact infrastructure committee');
  }

  return res.json();
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
