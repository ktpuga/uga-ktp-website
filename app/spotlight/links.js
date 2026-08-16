export const SPOTLIGHT_LINKS = [
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7467375826641276928',
  'https://www.linkedin.com/embed/feed/update/urn:li:share:7472230842971590657',
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7473802751056216064',
  'https://www.linkedin.com/embed/feed/update/urn:li:share:7445488019756826624',
  'https://www.linkedin.com/embed/feed/update/urn:li:share:7463996269426860035',
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7457960478128889856',
];

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export function getHourlySpotlightLinks(count, now = new Date()) {
  const postCount = Math.min(count, SPOTLIGHT_LINKS.length);
  if (SPOTLIGHT_LINKS.length <= postCount) return SPOTLIGHT_LINKS;

  const hourNumber = Math.floor(now.getTime() / MILLISECONDS_PER_HOUR);
  const startIndex = hourNumber % SPOTLIGHT_LINKS.length;

  return Array.from(
    { length: postCount },
    (_, index) => SPOTLIGHT_LINKS[(startIndex + index) % SPOTLIGHT_LINKS.length],
  );
}
