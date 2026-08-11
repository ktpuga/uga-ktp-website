// Mirror of ktp-api's services/textLimits.js.
//
// Two copies is the unavoidable minimum across two repos, so the rule is: this
// file matches that one exactly, and neither changes without the other. What is
// NOT acceptable is the third, fourth and fifth copy as bare literals inside
// component JSX, which is what was here before (one `const MAX_TITLE = 150` in
// RushAnnouncementsManager and nothing anywhere else).
//
// These drive `maxLength` on the compose forms. That is a convenience, not the
// enforcement — the API rejects over-length input regardless, and has to, since
// `maxLength` is a DOM attribute a client can simply not send. The point is
// that a member finds the limit while typing rather than after clicking save.
//
// `maxLength` stops further typing rather than showing an error, so a limit
// reached silently is confusing on a long field. Pair it with a counter (see
// RushAnnouncementsManager) wherever the limit is realistically reachable.

export const TEXT_LIMITS = {
  TITLE: 150,
  NAME: 100,
  LOCATION: 200,
  DESCRIPTION: 2000,
  BODY: 5000,
  QUESTION: 300,
  OPTION: 150,
  OPTION_COUNT: 20,
  FILENAME: 200,
  MESSAGE: 4000,
  REACTION: 32,
};
