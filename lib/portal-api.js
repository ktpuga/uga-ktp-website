'use server';

import { auth } from '@/auth';
import { normalizeApiList, formatMemberDirectory } from '@/lib/portal-format';

const API_URL = process.env.API_URL;

async function requireSession() {
  const session = await auth();
  if (!session) {
    throw new Error('You must be signed in to view this content');
  }
  if (!session.access_token) {
    throw new Error('Session expired — please sign in again');
  }
  return session;
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
  const session = await requireSession();
  return apiGet('/events', session.access_token);
}

export async function getPhotos() {
  const session = await requireSession();
  return apiGet('/photos', session.access_token);
}

export async function getMembers() {
  const session = await requireSession();
  const data = await apiGet('/members', session.access_token);
  return normalizeApiList(data);
}

export async function getMemberDirectory() {
  const session = await requireSession();
  const data = await apiGet('/members', session.access_token);
  return formatMemberDirectory(data);
}
