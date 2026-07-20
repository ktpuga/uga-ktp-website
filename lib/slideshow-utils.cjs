const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MIN_IMAGE_WIDTH = 900;
const MIN_IMAGE_HEIGHT = 600;

const ACCEPTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function emptyToNull(value) {
  const text = trimText(value);
  return text ? text : null;
}

function toNumberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function createEmptySlideForm() {
  return {
    file: null,
    title: '',
    subtitle: '',
    altText: '',
    linkUrl: '',
    linkLabel: '',
    startsAt: '',
    endsAt: '',
    isActive: true,
    focalX: 0.5,
    focalY: 0.5,
  };
}

function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.5;
  if (number < 0) return 0;
  if (number > 1) return 1;
  return number;
}

function convertPointerToFocalPoint(rect, clientX, clientY) {
  if (!rect || !rect.width || !rect.height) {
    return { focalX: 0.5, focalY: 0.5 };
  }

  return {
    focalX: clamp01((clientX - rect.left) / rect.width),
    focalY: clamp01((clientY - rect.top) / rect.height),
  };
}

function getSlideScheduleState(slide, now = Date.now()) {
  const isActive = Boolean(slide?.isActive);
  const startsAt = slide?.startsAt ? Date.parse(slide.startsAt) : NaN;
  const endsAt = slide?.endsAt ? Date.parse(slide.endsAt) : NaN;

  if (!isActive) return { label: 'Inactive', tone: 'inactive' };
  if (!Number.isNaN(startsAt) && startsAt > now) return { label: 'Scheduled', tone: 'scheduled' };
  if (!Number.isNaN(endsAt) && endsAt < now) return { label: 'Expired', tone: 'expired' };
  return { label: 'Active', tone: 'active' };
}

function formatSlideSchedule(slide) {
  const startsAt = slide?.startsAt ? new Date(slide.startsAt) : null;
  const endsAt = slide?.endsAt ? new Date(slide.endsAt) : null;

  if (!startsAt && !endsAt) return 'Unscheduled';

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  if (startsAt && endsAt) return `${formatter.format(startsAt)} to ${formatter.format(endsAt)}`;
  if (startsAt) return `Starts ${formatter.format(startsAt)}`;
  return `Ends ${formatter.format(endsAt)}`;
}

function normalizeSlideRecord(record) {
  const id = record?.id ?? record?._id ?? record?.homepage_photo_id ?? record?.homepagePhotoId;
  return {
    ...record,
    id: id == null ? '' : String(id),
    title: trimText(record?.title),
    subtitle: emptyToNull(record?.subtitle ?? record?.caption),
    altText: trimText(record?.alt_text ?? record?.altText),
    linkUrl: emptyToNull(record?.link_url ?? record?.linkUrl),
    linkLabel: emptyToNull(record?.link_label ?? record?.linkLabel),
    startsAt: emptyToNull(record?.starts_at ?? record?.startsAt),
    endsAt: emptyToNull(record?.ends_at ?? record?.endsAt),
    isActive: Boolean(record?.is_active ?? record?.isActive),
    focalX: clamp01(toNumberOrDefault(record?.focal_x ?? record?.focalX, 0.5)),
    focalY: clamp01(toNumberOrDefault(record?.focal_y ?? record?.focalY, 0.5)),
    mediaType: record?.media_type ?? record?.mediaType ?? 'image',
    displayOrder: toNumberOrDefault(record?.display_order ?? record?.displayOrder ?? record?.sort_order ?? record?.sortOrder, 0),
  };
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function validDate(value) {
  if (!value) return true;
  return !Number.isNaN(Date.parse(value));
}

function validateSlideForm(values, { requireFile = false } = {}) {
  const errors = {};
  const title = trimText(values.title);
  const subtitle = trimText(values.subtitle);
  const altText = trimText(values.altText);
  const linkUrl = trimText(values.linkUrl);
  const linkLabel = trimText(values.linkLabel);
  const startsAt = trimText(values.startsAt);
  const endsAt = trimText(values.endsAt);
  const file = values.file ?? null;

  if (requireFile && !file) {
    errors.file = 'Image file is required.';
  }

  if (file) {
    if (!ACCEPTED_IMAGE_MIME_TYPES.has(file.type)) {
      errors.file = 'JPEG, PNG, WebP, HEIC, or HEIF images only.';
    } else if (file.size > MAX_FILE_SIZE) {
      errors.file = 'Image must be 15 MB or smaller.';
    } else if (values.fileDimensions) {
      const width = Number(values.fileDimensions.width);
      const height = Number(values.fileDimensions.height);
      if (Number.isFinite(width) && Number.isFinite(height) && (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT)) {
        errors.file = 'Image must be at least 900 × 600 pixels.';
      }
    }
  }

  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length > 100) {
    errors.title = 'Title must be 100 characters or fewer.';
  }

  if (subtitle.length > 220) {
    errors.subtitle = 'Subtitle must be 220 characters or fewer.';
  }

  if (!altText) {
    errors.altText = 'Alt text is required.';
  } else if (altText.length > 300) {
    errors.altText = 'Alt text must be 300 characters or fewer.';
  }

  if (linkLabel.length > 80) {
    errors.linkLabel = 'Link label must be 80 characters or fewer.';
  }

  if (linkUrl && !isHttpsUrl(linkUrl)) {
    errors.linkUrl = 'Link URL must use HTTPS.';
  }

  if (startsAt && !validDate(startsAt)) {
    errors.startsAt = 'Start date/time is invalid.';
  }

  if (endsAt && !validDate(endsAt)) {
    errors.endsAt = 'End date/time is invalid.';
  }

  if (startsAt && endsAt && !Number.isNaN(Date.parse(startsAt)) && !Number.isNaN(Date.parse(endsAt))) {
    if (Date.parse(startsAt) >= Date.parse(endsAt)) {
      errors.endsAt = 'End date/time must be after the start date/time.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function buildCreateSlideFormData(values) {
  const formData = new FormData();
  formData.append('file', values.file);
  formData.append('title', trimText(values.title));
  formData.append('subtitle', trimText(values.subtitle));
  formData.append('alt_text', trimText(values.altText));
  formData.append('link_url', trimText(values.linkUrl));
  formData.append('link_label', trimText(values.linkLabel));
  formData.append('starts_at', trimText(values.startsAt));
  formData.append('ends_at', trimText(values.endsAt));
  formData.append('is_active', values.isActive ? 'true' : 'false');
  formData.append('focal_x', String(clamp01(values.focalX ?? 0.5)));
  formData.append('focal_y', String(clamp01(values.focalY ?? 0.5)));
  return formData;
}

function compareNullableText(initial, current) {
  return emptyToNull(initial) === emptyToNull(current);
}

function buildUpdateSlidePayload(initialValues, currentValues) {
  const payload = {};

  if (trimText(initialValues.title) !== trimText(currentValues.title)) {
    payload.title = trimText(currentValues.title);
  }

  if (!compareNullableText(initialValues.subtitle, currentValues.subtitle)) {
    payload.subtitle = emptyToNull(currentValues.subtitle);
  }

  if (trimText(initialValues.altText) !== trimText(currentValues.altText)) {
    payload.alt_text = trimText(currentValues.altText);
  }

  if (!compareNullableText(initialValues.linkUrl, currentValues.linkUrl)) {
    payload.link_url = emptyToNull(currentValues.linkUrl);
  }

  if (!compareNullableText(initialValues.linkLabel, currentValues.linkLabel)) {
    payload.link_label = emptyToNull(currentValues.linkLabel);
  }

  if (Boolean(initialValues.isActive) !== Boolean(currentValues.isActive)) {
    payload.is_active = Boolean(currentValues.isActive);
  }

  if (!compareNullableText(initialValues.startsAt, currentValues.startsAt)) {
    payload.starts_at = emptyToNull(currentValues.startsAt);
  }

  if (!compareNullableText(initialValues.endsAt, currentValues.endsAt)) {
    payload.ends_at = emptyToNull(currentValues.endsAt);
  }

  return payload;
}

function buildReorderPayload(ids) {
  return { ids: ids.map((id) => String(id)) };
}

function extractApiErrorMessage(errorBody, fallbackMessage) {
  if (!errorBody) return fallbackMessage;
  if (typeof errorBody === 'string') return errorBody || fallbackMessage;
  return errorBody.error || errorBody.message || fallbackMessage;
}

module.exports = {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_FILE_SIZE,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
  buildCreateSlideFormData,
  buildReorderPayload,
  buildUpdateSlidePayload,
  clamp01,
  compareNullableText,
  convertPointerToFocalPoint,
  createEmptySlideForm,
  extractApiErrorMessage,
  formatSlideSchedule,
  getSlideScheduleState,
  normalizeSlideRecord,
  validateSlideForm,
};
