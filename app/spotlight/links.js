export const SPOTLIGHT_LINKS = [
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7467375826641276928',
  'https://www.linkedin.com/embed/feed/update/urn:li:share:7472230842971590657',
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7473802751056216064',
  'https://www.linkedin.com/embed/feed/update/urn:li:share:7445488019756826624',
  'https://www.linkedin.com/embed/feed/update/urn:li:share:7463996269426860035',
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7457960478128889856',
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7492743829372989440',
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7492677214686048256',
  'https://www.linkedin.com/embed/feed/update/urn:li:share:7491550871957221376',
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7487663623293616128',
  'https://www.linkedin.com/embed/feed/update/urn:li:share:7470924400842715136',
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7461510174701162496',
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
