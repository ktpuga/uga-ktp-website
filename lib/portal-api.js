'use server';

import { normalizeApiList, formatMemberDirectory } from '@/lib/portal-format';

const API_URL = process.env.API_URL;

async function apiGet(path) {
  if (!API_URL) {
    throw new Error('No API URL found — contact infrastructure committee');
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  } catch {
    throw new Error('Fetch failed — contact infrastructure committee');
  }

  if (!res.ok) throw new Error('Fetch failed — contact infrastructure committee');
  return res.json();
}

export async function getEvents() {
  return apiGet('/events');
}

export async function getPhotos() {
  return apiGet('/photos');
}

export async function getMembers() {
  const data = await apiGet('/members');
  return normalizeApiList(data);
}

export async function getMemberDirectory() {
  const data = await apiGet('/members');
  return formatMemberDirectory(data);
}
