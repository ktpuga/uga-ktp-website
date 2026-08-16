// Profile picture URLs, in one place.
//
// The media proxy (`app/api/users/[id]/profile-picture/media/route.js`) forwards
// no Cache-Control, so the browser caches heuristically and the URL is the only
// thing that tells it the picture changed. It never used to change: the route is
// keyed on the member's id, which is the same before and after an upload. That
// is the media-cache trap in components/README.md, and it is why "I changed my
// photo and nothing happened"
// was a recurring report — the upload had worked, the browser was showing cache.
//
// The cache-buster is the Immich asset id, not a timestamp and not a render
// counter. Immich issues a brand new asset per upload, so the id changes exactly
// when the picture does and is stable the rest of the time. A timestamp or a
// counter would change on every paint or every mount, which defeats the cache
// entirely and re-downloads every avatar in the directory on every page load —
// the opposite failure, and a much more expensive one. `GroupChatAvatar` in
// MessagesPage.jsx solved the same problem the same way first.

// Builds the src for a member's profile picture.
//
// `assetId` is deliberately optional and its absence is NOT treated as "no
// picture": several callers render an avatar from a projection that carries the
// member's id but not their asset id, and for them the un-busted URL is exactly
// what shipped before. Returning the plain URL keeps those working rather than
// blanking them, and the day their projection gains the column they start
// cache-busting with no change here.
//
// Returns null when there is no user id at all, so callers can fall back to
// initials with `src && ...` instead of requesting `/api/users/undefined/...`.
export function profilePictureSrc(userId, assetId) {
  if (!userId) return null;
  const url = `/api/users/${userId}/profile-picture/media`;
  return assetId ? `${url}?v=${encodeURIComponent(assetId)}` : url;
}

// Reads the asset id off whatever member-shaped object a component was handed.
//
// There is no single shape. Most endpoints return the database row as-is
// (`profile_picture_asset_id`), but the directory goes through
// `toDirectoryMember` and the public roster through rosterController, both of
// which re-key everything to camelCase. Components receive members from several
// of these at once — MessagesPage alone draws avatars from conversations, group
// chat rosters and the directory picker — so reading one spelling means some
// avatars quietly keep the un-busted URL and nothing anywhere errors. Accepting
// both is what makes that failure impossible rather than merely unlikely.
export function avatarAssetId(member) {
  return member?.profile_picture_asset_id ?? member?.profilePictureAssetId ?? null;
}

// Same thing for the public roster, which streams through its own proxy
// (`/api/roster/[id]/media`) because that endpoint needs no auth. Different
// route, identical caching problem.
export function rosterPictureSrc(userId, assetId) {
  if (!userId) return null;
  const url = `/api/roster/${userId}/media`;
  return assetId ? `${url}?v=${encodeURIComponent(assetId)}` : url;
}

// Broadcast when a member changes their own photo.
//
// The sidebar avatar lives in PortalShell, which is a layout: it mounts once and
// survives every client-side navigation, so its copy of the member's profile is
// fetched exactly once per full page load. Without a nudge, uploading a new
// photo on /member/profile leaves the sidebar showing the old one until the
// member hard-refreshes — which is the very complaint this work is fixing, just
// relocated. An event is enough here; there is no shared store to update and
// router.refresh() cannot reach state held in a client component's useState.
export const PROFILE_PICTURE_CHANGED_EVENT = 'ktp:profile-picture-changed';

export function announceProfilePictureChange(assetId) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(PROFILE_PICTURE_CHANGED_EVENT, { detail: { assetId: assetId ?? null } }),
  );
}
