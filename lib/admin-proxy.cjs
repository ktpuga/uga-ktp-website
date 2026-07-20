const { auth } = require('../auth');
const { getAccessToken } = require('./access-token');

const API_URL = process.env.API_URL;

function errorResponse(status, code, error) {
  return new Response(JSON.stringify({ code, error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function requireEboardAccess() {
  const session = await auth();

  if (!session || session.error) {
    return { ok: false, response: errorResponse(401, 'SESSION_EXPIRED', 'Session expired. Please sign in again.') };
  }

  const groups = session.user?.groups ?? [];
  if (!groups.includes('eboard')) {
    return { ok: false, response: errorResponse(403, 'FORBIDDEN', 'You must be in the eboard group to manage slideshow items.') };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { ok: false, response: errorResponse(401, 'SESSION_EXPIRED', 'Session expired. Please sign in again.') };
  }

  return { ok: true, accessToken };
}

function attachBodyHeaders(headers, body) {
  if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
}

async function proxyAdminApi(path, { accessToken, method = 'GET', headers: requestHeaders = {}, body } = {}) {
  if (!API_URL) {
    return errorResponse(500, 'CONFIG_MISSING', 'API URL is not configured.');
  }

  const headers = new Headers(requestHeaders);
  headers.set('Authorization', `Bearer ${accessToken}`);
  attachBodyHeaders(headers, body);

  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      cache: 'no-store',
      headers,
      body,
    });
  } catch {
    return errorResponse(502, 'UPSTREAM_UNREACHABLE', 'Could not reach the slideshow service.');
  }
}

async function proxyAdminMedia(path, { accessToken, range } = {}) {
  if (!API_URL) {
    return errorResponse(500, 'CONFIG_MISSING', 'API URL is not configured.');
  }

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${accessToken}`);
  if (range) headers.set('Range', range);

  try {
    return await fetch(`${API_URL}${path}`, { headers });
  } catch {
    return errorResponse(502, 'UPSTREAM_UNREACHABLE', 'Could not reach the slideshow service.');
  }
}

module.exports = {
  proxyAdminApi,
  proxyAdminMedia,
  requireEboardAccess,
};
