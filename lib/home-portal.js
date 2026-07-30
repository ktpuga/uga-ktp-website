// Which portal a signed-in user belongs in, from their Authentik groups.
//
// Single source of truth on purpose. This rule used to be duplicated in
// middleware.ts and app/auth/redirect/page.jsx, and the two drifted apart at
// least twice:
//
//   - once disagreeing on the fallback for unmatched groups (/login vs
//     /member), which produced an infinite redirect bounce;
//   - once when the rush portal was added to middleware but not to the redirect
//     page, so rushees signed in successfully and were then dropped on the
//     public homepage with no way into their portal.
//
// Both failures look like "login is broken" rather than "these two lists
// disagree", which is what makes them expensive to diagnose. Import this
// everywhere instead of re-deriving it.
//
// ORDER MATTERS. Someone accepted out of rush into a pledge class, or a chair
// who is also active, holds several groups at once — Authentik doesn't remove
// the old one automatically. The higher-privilege portal has to win, so rush is
// checked last. This matches ktp-api's constants/roleGroups.js; keep them in
// step.
export function homePortal(groups = []) {
  if (groups.includes('eboard')) return '/admin';
  if (groups.includes('chair') || groups.includes('active')) return '/member';
  if (groups.includes('alumni')) return '/alumni';
  if (groups.includes('pledge')) return '/pledge';
  if (groups.includes('rush')) return '/rushee';
  // No recognised group. ktp-api's middleware defaults such tokens to rush, but
  // the website can only route on what's actually in the session, so send them
  // somewhere harmless rather than into a portal they'd be bounced out of.
  return '/';
}
