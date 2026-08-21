// The rotating hero collage on the public homepage.
//
// SERVER ONLY. `app/page.js` imports this and passes the result down as a prop;
// no client component may import it. That is deliberate -- it keeps the hero
// correct on the very first paint, where a client-side fetch would render the
// hardcoded fallback and then visibly swap the photos at the top of the page.
//
// This does NOT go through lib/portal-api.js. That file is a 'use server'
// module, so every export is a Server Action and its arguments are serialised;
// an AbortSignal cannot cross that boundary, and the timeout below is the whole
// point of fetching here.
//
// The album is the FIRST FEATURED COLLECTION that has enough usable photos --
// the same album <GallerySection /> shows further down the page, and the same
// ordering (`display_order ASC, event_date DESC NULLS LAST`), so the hero and
// the gallery never disagree about which album is current.

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

// How long one set of photos stays up.
export const HERO_ROTATION_HOURS = 4;

// Must match `heroPhotoPositions` in components/template-page.jsx, which is a
// fixed six-slot arrangement. Fewer photos than this leaves visible holes in
// the collage, which is why a short album falls back to the hardcoded set
// rather than rendering a gap-toothed hero.
export const HERO_PHOTO_COUNT = 6;

// The public landing page must not hang on a slow ktp-api. Anything past this
// is treated as "no gallery photos" and the hardcoded collage renders instead.
const FETCH_TIMEOUT_MS = 1500;

// Cached well below the rotation window: a 10-minute-stale collection list
// cannot change which 4-hour block we are in, and it keeps a force-dynamic
// landing page from hitting the API on every single request. A newly uploaded
// photo joins the rotation within 10 minutes.
const REVALIDATE_SECONDS = 600;

// Pure and `now`-injectable, mirroring getHourlySpotlightLinks in
// app/spotlight/links.js.
//
// A sliding window rather than a shuffle: every photo in the album eventually
// gets its turn, in the order eboard arranged them, and everyone looking during
// the same 4-hour block sees the same six. The window advances by `count` per
// block rather than by 1, so consecutive blocks show a completely fresh set
// instead of shuffling five of the same photos along by one.
//
// Returns [] when the album cannot fill the collage -- callers read that as
// "use the fallback", never as "render five".
export function pickRotatingPhotos(photos, count = HERO_PHOTO_COUNT, now = new Date()) {
  if (!Array.isArray(photos) || photos.length < count) return [];
  if (photos.length === count) return photos;

  const block = Math.floor(now.getTime() / (MILLISECONDS_PER_HOUR * HERO_ROTATION_HOURS));
  const startIndex = ((block * count) % photos.length + photos.length) % photos.length;

  return Array.from(
    { length: count },
    (_, index) => photos[(startIndex + index) % photos.length],
  );
}

// Videos are a real row type in `homepage_photos` (GalleryCollection branches on
// media_type), and the collage renders <Image>. Passing it a video would paint
// a broken tile at the top of the public site.
function usablePhotos(collection) {
  const photos = Array.isArray(collection?.photos) ? collection.photos : [];
  return photos.filter((photo) => photo?.id && photo.media_type !== 'video');
}

export async function getRotatingHeroPhotos(count = HERO_PHOTO_COUNT, now = new Date()) {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) return [];

  let collections;
  try {
    const res = await fetch(`${apiUrl}/homepage-photos/collections?featured=true`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    collections = await res.json();
  } catch {
    // Timeout, network failure, or malformed JSON. The homepage still renders.
    return [];
  }

  if (!Array.isArray(collections)) return [];

  // Skip a featured collection that is too short instead of giving up on the
  // first one. Eboard creates a collection and then uploads into it, so a
  // featured album with too few photos is a real state that lasts as long as
  // that takes -- the same reason GallerySection asks for three and takes the
  // first non-empty one.
  for (const collection of collections) {
    const picked = pickRotatingPhotos(usablePhotos(collection), count, now);
    if (picked.length) return picked;
  }

  return [];
}
