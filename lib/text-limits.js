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

// Mirror of the caps in ktp-api's services/profileFields.js, which is a
// separate file there for a real reason: these are profile columns with domain
// rules attached (a phone counted in digits, a graduation parsed as a
// semester), not the plain length table above.
//
// Only the fields added in 2026-08 are here. The older ones are still bare
// literals in ProfileForm's JSX, which is what this file exists to discourage —
// but retrofitting them is a change to working code for tidiness, and belongs
// in its own pass rather than riding along with a feature.
export const PROFILE_LIMITS = {
  // One line on a directory card, beside a name. Longer than this is an
  // About Me, which already exists.
  DOING_NOW: 150,
  // Five links, because the chips wrap under a card and a member with thirty
  // turns their own card into a wall. A ceiling on taste, not on storage.
  LINKS: 5,
  // A label longer than the URL it labels defeats the point of the label.
  LINK_LABEL: 40,
  // MAX_URL_LENGTH in ktp-api's services/urls.js.
  LINK_URL: 300,
};
