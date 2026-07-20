function getSlideshowAccessState({ session, groups = [] } = {}) {
  if (!session || session.error) {
    return { allowed: false, redirectTo: '/login', reason: 'SESSION_EXPIRED' };
  }

  if (!groups.includes('eboard')) {
    return { allowed: false, redirectTo: '/admin', reason: 'FORBIDDEN' };
  }

  return { allowed: true, redirectTo: null, reason: null };
}

function getDeleteConfirmationMessage() {
  return 'Delete this slideshow derivative? The registered shared Immich source, if any, stays untouched.';
}

function buildProxyHeaders({ accessToken, range, body }) {
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (range) headers.Range = range;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  return headers;
}

module.exports = {
  buildProxyHeaders,
  getDeleteConfirmationMessage,
  getSlideshowAccessState,
};
