import { TEXT_LIMITS } from '@/lib/text-limits';

// Building the multipart body for an announcement, in one place.
//
// Both boards post the same shape and the API parses it the same way, so the
// two composers share this rather than each remembering that `audience` and
// `links` have to be JSON-encoded. Getting that wrong does not fail loudly: the
// API's `multipartJson` shim hands a non-JSON string straight to the validator,
// which reports a confusing error about the audience being invalid.

export const MEDIA_MAX = 10;

// Mirrors ktp-api's LIMITS_MB.announcementMedia. Checked here so a 300MB video
// is refused before it is uploaded rather than after.
export const MEDIA_MAX_MB = 100;

export const ACCEPTED_MEDIA = 'image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm';

export function emptyLink() {
  return { label: '', url: '' };
}

// Drops rows the author started and never filled in.
//
// Both fields empty means an untouched row, which is not an error — the editor
// adds a blank one for convenience. A row with only one side filled IS sent, so
// the API answers with a real message naming the label rather than the website
// quietly discarding what someone typed.
export function cleanLinks(links) {
  return (links ?? []).filter((link) => link.label.trim() || link.url.trim());
}

// Returns an error string, or null. Runs before the upload so the person is
// told which file is the problem while it is still in front of them.
export function checkFiles(files, existingCount = 0) {
  if (!files?.length) return null;

  if (existingCount + files.length > MEDIA_MAX) {
    return `An announcement can hold up to ${MEDIA_MAX} photos or videos`;
  }

  const tooBig = files.find((file) => file.size > MEDIA_MAX_MB * 1024 * 1024);
  if (tooBig) return `${tooBig.name} is over the ${MEDIA_MAX_MB} MB limit`;

  return null;
}

export function buildAnnouncementFormData({
  title, body, audience, committeeId, sendEmail, links, files,
}) {
  const formData = new FormData();
  formData.set('title', title);
  formData.set('body', body);

  // JSON-encoded because multipart has no arrays: every field arrives at the
  // API as a string, and its multipartJson shim parses these two back.
  formData.set('links', JSON.stringify(cleanLinks(links)));

  if (audience !== undefined) {
    formData.set('audience', JSON.stringify(audience?.length ? audience : null));
  }
  if (committeeId !== undefined) {
    formData.set('committee_id', committeeId || '');
  }
  if (sendEmail !== undefined) {
    formData.set('send_email', String(Boolean(sendEmail)));
  }

  // The field name matches `uploadAnnouncementMedia.array("media", ...)` on the
  // API. A mismatch is multer's LIMIT_UNEXPECTED_FILE, which the shared
  // uploadErrorHandler turns into a 400 rather than something readable.
  for (const file of files ?? []) formData.append('media', file);

  return formData;
}

export { TEXT_LIMITS };
