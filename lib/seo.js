// metadata helper for public pages

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://ugaktp.com';
export const SITE_NAME = 'Kappa Theta Pi at UGA';

export const DEFAULT_OG_IMAGE = '/PCalpha.jpg';

/**
 * creates metadata for a public page
 *
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.description
 * @param {string} options.path
 * @param {string} [options.image]
 */
export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
}) {
  // use the full title for page and social previews
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    // bypasses parent title templates
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url: path,
      title: fullTitle,
      description,
      images: [{ url: image, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
