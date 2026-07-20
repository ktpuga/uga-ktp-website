'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Loader2, PencilLine, Power, Plus, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { getDeleteConfirmationMessage } from '@/lib/slideshow-auth.cjs';
import slideshowUtils from '@/lib/slideshow-utils.cjs';

const {
  buildCreateSlideFormData,
  buildReorderPayload,
  buildUpdateSlidePayload,
  clamp01,
  convertPointerToFocalPoint,
  createEmptySlideForm,
  formatSlideSchedule,
  getSlideScheduleState,
  normalizeSlideRecord,
  validateSlideForm,
} = slideshowUtils;

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif';

function cx(...values) {
  return values.filter(Boolean).join(' ');
}

async function readJsonResponse(response) {
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage = body?.error || body?.message || 'The slideshow request failed.';
    throw new Error(errorMessage);
  }
  return body;
}

async function inspectImageDimensions(file) {
  if (!file) return null;
  try {
    const objectUrl = URL.createObjectURL(file);
    const dimensions = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Could not inspect image dimensions.'));
      image.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);
    return dimensions;
  } catch {
    return null;
  }
}

function StatusBadge({ label, tone }) {
  const toneClass = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    scheduled: 'border-amber-200 bg-amber-50 text-amber-900',
    expired: 'border-slate-200 bg-slate-50 text-slate-700',
    inactive: 'border-slate-200 bg-slate-100 text-slate-700',
  }[tone] ?? 'border-slate-200 bg-slate-100 text-slate-700';

  return <span className={cx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', toneClass)}>{label}</span>;
}

function FieldError({ id, error }) {
  if (!error) return null;
  return (
    <p id={id} className="text-sm text-red-700" role="alert">
      {error}
    </p>
  );
}

function SlidePreview({ src, alt, focalX = 0.5, focalY = 0.5, editable = false, onPointerPoint, onKeyPoint, emptyLabel = 'No preview yet' }) {
  const markerLeft = `${clamp01(focalX) * 100}%`;
  const markerTop = `${clamp01(focalY) * 100}%`;

  return (
    <div className="space-y-2">
      <div
        className={cx('relative aspect-[3/2] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm', editable ? 'cursor-crosshair' : 'cursor-default')}
        tabIndex={editable ? 0 : undefined}
        role={editable ? 'group' : undefined}
        aria-label={editable ? 'Focal point preview' : undefined}
        onPointerDown={onPointerPoint}
        onPointerMove={onPointerPoint}
        onKeyDown={onKeyPoint}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-full w-full object-cover" style={{ objectPosition: `${markerLeft} ${markerTop}` }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-slate-500">{emptyLabel}</div>
        )}
        {editable && (
          <button
            type="button"
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-600 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            style={{ left: markerLeft, top: markerTop }}
            aria-label={`Focal point marker at ${Math.round(clamp01(focalX) * 100)} percent by ${Math.round(clamp01(focalY) * 100)} percent`}
            onPointerDown={onPointerPoint}
            onKeyDown={onKeyPoint}
          >
            <span className="sr-only">Drag or use arrow keys to adjust the focal point</span>
            <span className="block h-3 w-3 rounded-full border border-white bg-red-600" />
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        {editable ? 'Click or drag to set the crop focus. Use the arrow keys when the preview is focused.' : 'Server preview shown at 3:2.'}
      </p>
    </div>
  );
}

function SlideEditorDialog({
  mode,
  form,
  errors,
  filePreviewUrl,
  slidePreviewUrl,
  fileDimensions,
  onChange,
  onSubmit,
  onClose,
  onFileSelected,
  submitting,
}) {
  const fileInputRef = useRef(null);
  const title = mode === 'create' ? 'Add slide' : 'Edit slide';
  const submitLabel = mode === 'create' ? 'Add slide' : 'Save changes';
  const previewUrl = mode === 'create' ? filePreviewUrl : slidePreviewUrl;

  const handleFocalPointer = (event) => {
    if (mode !== 'create') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const { focalX, focalY } = convertPointerToFocalPoint(rect, event.clientX, event.clientY);
    onChange({ focalX, focalY });
  };

  const handleFocalKey = (event) => {
    if (mode !== 'create') return;

    const step = event.shiftKey ? 0.1 : 0.02;
    let focalX = form.focalX;
    let focalY = form.focalY;

    switch (event.key) {
      case 'ArrowUp':
        focalY = clamp01(focalY - step);
        break;
      case 'ArrowDown':
        focalY = clamp01(focalY + step);
        break;
      case 'ArrowLeft':
        focalX = clamp01(focalX - step);
        break;
      case 'ArrowRight':
        focalX = clamp01(focalX + step);
        break;
      case 'Home':
        focalX = 0;
        focalY = 0;
        break;
      case 'End':
        focalX = 1;
        focalY = 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    onChange({ focalX, focalY });
  };

  const handleFileChange = async (file) => {
    await onFileSelected(file);
    fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
            <p className="text-sm text-slate-500">
              {mode === 'create' ? 'Upload a new slideshow image and its metadata.' : 'Edit the slide metadata and active window.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-slate-900"
            aria-label="Close editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            {mode === 'create' ? (
              <div
                className={cx('rounded-xl border border-dashed px-4 py-5 transition-colors', errors.file ? 'border-red-300 bg-red-50/60' : 'border-slate-300 bg-slate-50/70 hover:bg-slate-50')}
                onDrop={async (event) => {
                  event.preventDefault();
                  await handleFileChange(event.dataTransfer.files?.[0] ?? null);
                }}
                onDragOver={(event) => event.preventDefault()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose or drop an image file"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Upload className="h-4 w-4" />
                      Choose an image or drop one here
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      JPEG, PNG, WebP, HEIC, or HEIF. Max 15 MB. Minimum 900 × 600.
                    </p>
                  </div>
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => fileInputRef.current?.click()}>
                    Browse files
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="sr-only"
                  accept={IMAGE_ACCEPT}
                  onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                />
                {form.file && (
                  <p className="mt-3 text-sm text-slate-700">
                    Selected file: <span className="font-medium">{form.file.name}</span>
                    {fileDimensions ? ` · ${fileDimensions.width} × ${fileDimensions.height}` : ''}
                  </p>
                )}
                <FieldError id="slide-file-error" error={errors.file} />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                File replacement is not exposed here. Use the API if a slide needs a new asset.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Title</span>
                <Input
                  value={form.title}
                  onChange={(event) => onChange({ title: event.target.value })}
                  maxLength={100}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? 'slide-title-error' : undefined}
                />
                <FieldError id="slide-title-error" error={errors.title} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Alt text</span>
                <Input
                  value={form.altText}
                  onChange={(event) => onChange({ altText: event.target.value })}
                  maxLength={300}
                  aria-invalid={Boolean(errors.altText)}
                  aria-describedby={errors.altText ? 'slide-alt-error' : undefined}
                />
                <FieldError id="slide-alt-error" error={errors.altText} />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Subtitle</span>
                <Textarea
                  value={form.subtitle}
                  onChange={(event) => onChange({ subtitle: event.target.value })}
                  maxLength={220}
                  className="min-h-20"
                  aria-invalid={Boolean(errors.subtitle)}
                  aria-describedby={errors.subtitle ? 'slide-subtitle-error' : undefined}
                />
                <FieldError id="slide-subtitle-error" error={errors.subtitle} />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">HTTPS link URL</span>
                <Input
                  value={form.linkUrl}
                  onChange={(event) => onChange({ linkUrl: event.target.value })}
                  placeholder="https://"
                  aria-invalid={Boolean(errors.linkUrl)}
                  aria-describedby={errors.linkUrl ? 'slide-link-url-error' : undefined}
                />
                <FieldError id="slide-link-url-error" error={errors.linkUrl} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Link action label</span>
                <Input
                  value={form.linkLabel}
                  onChange={(event) => onChange({ linkLabel: event.target.value })}
                  maxLength={80}
                  aria-invalid={Boolean(errors.linkLabel)}
                  aria-describedby={errors.linkLabel ? 'slide-link-label-error' : undefined}
                />
                <FieldError id="slide-link-label-error" error={errors.linkLabel} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Start date/time</span>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => onChange({ startsAt: event.target.value })}
                  aria-invalid={Boolean(errors.startsAt)}
                  aria-describedby={errors.startsAt ? 'slide-starts-error' : undefined}
                />
                <FieldError id="slide-starts-error" error={errors.startsAt} />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">End date/time</span>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => onChange({ endsAt: event.target.value })}
                  aria-invalid={Boolean(errors.endsAt)}
                  aria-describedby={errors.endsAt ? 'slide-ends-error' : undefined}
                />
                <FieldError id="slide-ends-error" error={errors.endsAt} />
              </label>
            </div>

            {mode === 'create' && (
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => onChange({ isActive: event.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-red-700 focus-visible:ring-red-500"
                />
                Active by default
              </label>
            )}
          </div>

          <div className="space-y-4">
            <SlidePreview
              src={previewUrl}
              alt={form.altText || form.title || 'Slide preview'}
              focalX={form.focalX}
              focalY={form.focalY}
              editable={mode === 'create'}
              onPointerPoint={handleFocalPointer}
              onKeyPoint={handleFocalKey}
              emptyLabel={mode === 'create' ? 'Add an image to preview the crop focus.' : 'No slide preview available.'}
            />

            {mode === 'create' && (
              <div className="rounded-xl border border-slate-200 px-4 py-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Focal point</p>
                    <p className="text-xs text-slate-500">
                      x {Math.round(form.focalX * 100)} · y {Math.round(form.focalY * 100)}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => onChange({ focalX: 0.5, focalY: 0.5 })}>
                    Center focus
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-500">The server performs the actual crop, compression, and metadata stripping.</p>
              </div>
            )}

            {mode === 'edit' && (
              <div className="rounded-xl border border-slate-200 px-4 py-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                Current schedule: {formatSlideSchedule(form)}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-red-900 hover:bg-red-800">
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === 'create' ? 'Processing...' : 'Saving...'}
                  </span>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExistingImageDialog({ onClose, onAdded }) {
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [altText, setAltText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/ios-homepage-slideshow/library', { cache: 'no-store' })
      .then(readJsonResponse)
      .then((body) => setPhotos(Array.isArray(body) ? body : body?.items ?? body?.data ?? []))
      .catch((requestError) => setError(requestError.message || 'Could not load the photo library.'))
      .finally(() => setLoading(false));
  }, []);

  async function submit(event) {
    event.preventDefault();
    const assetId = selected?.immich_asset_id ?? selected?.asset_id ?? selected?.id;
    if (!assetId || !title.trim() || !altText.trim()) {
      setError('Choose an image and provide both a title and alt text.');
      return;
    }
    if (linkUrl && !/^https:\/\//i.test(linkUrl)) {
      setError('Link URL must use HTTPS.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/admin/ios-homepage-slideshow/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immich_asset_id: String(assetId), title: title.trim(), subtitle: subtitle.trim(), alt_text: altText.trim(), link_url: linkUrl.trim() || null, is_active: isActive, focal_x: 0.5, focal_y: 0.5 }),
      });
      await readJsonResponse(response);
      await onAdded();
    } catch (requestError) {
      setError(requestError.message || 'Could not add the selected image.');
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"><form onSubmit={submit} className="w-full max-w-4xl rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-950">
    <div className="mb-4 flex items-start justify-between"><div><h2 className="text-lg font-semibold">Choose photo-library image</h2><p className="text-sm text-slate-500">Register an existing image as a mobile slideshow slide.</p></div><button type="button" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button></div>
    {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="grid max-h-56 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">{loading ? <p className="col-span-full text-sm text-slate-500">Loading images…</p> : photos.filter((photo) => !photo.media_type || photo.media_type === 'image').map((photo) => <button key={photo.id} type="button" onClick={() => setSelected(photo)} className={cx('overflow-hidden rounded-lg border text-left', selected?.id === photo.id ? 'border-red-700 ring-2 ring-red-200' : 'border-slate-200')}><img src={`/api/photos/${photo.id}/media`} alt={photo.title || 'Library image'} className="aspect-square w-full object-cover" /><span className="block truncate p-1.5 text-xs">{photo.title || 'Untitled'}</span></button>)}</div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title (required)" /><Input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Alt text (required)" /><Textarea value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Subtitle (optional)" className="sm:col-span-2" /><Input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="HTTPS link (optional)" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />Show on homepage</label></div>
    <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button><Button type="submit" className="bg-red-900 hover:bg-red-800" disabled={submitting}>{submitting ? 'Adding…' : 'Add slide'}</Button></div>
  </form></div>;
}

function SlideRow({ slide, index, total, draggingId, busy, onMove, onEdit, onToggleActive, onDelete, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const status = getSlideScheduleState(slide);
  const mediaUrl = `/api/admin/ios-homepage-slideshow/${slide.id}/media`;
  const hasLink = Boolean(slide.linkUrl || slide.linkLabel);

  return (
    <li
      className={cx('rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition-shadow dark:border-slate-800 dark:bg-slate-950', draggingId === slide.id && 'ring-2 ring-red-500')}
      draggable
      onDragStart={(event) => onDragStart(event, slide.id)}
      onDragOver={(event) => onDragOver(event, slide.id)}
      onDrop={(event) => onDrop(event, slide.id)}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="flex items-start gap-3 xl:w-[calc(100%-24rem)]">
          <button
            type="button"
            className="mt-1 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label={`Drag slide ${index + 1}`}
            title="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="w-32 shrink-0 sm:w-40">
            <SlidePreview src={mediaUrl} alt={slide.altText || slide.title || 'Slide preview'} focalX={slide.focalX} focalY={slide.focalY} emptyLabel="No preview" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900">#{index + 1}</span>
              <StatusBadge label={status.label} tone={status.tone} />
              {slide.isActive ? <span className="text-xs font-medium text-emerald-700">Visible in slideshow</span> : <span className="text-xs font-medium text-slate-500">Hidden from slideshow</span>}
            </div>

            <div className="min-w-0 space-y-1">
              <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">{slide.title || 'Untitled slide'}</h3>
              {slide.subtitle && <p className="text-sm text-slate-600 dark:text-slate-300">{slide.subtitle}</p>}
              <p className="text-xs text-slate-500">Alt text: {slide.altText || 'Required but empty'}</p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span>Schedule: {formatSlideSchedule(slide)}</span>
              {hasLink && <span>Link: {slide.linkLabel || 'Open link'}{slide.linkUrl ? ` (${slide.linkUrl})` : ''}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:w-[22rem] xl:justify-end">
          <Button type="button" variant="outline" size="sm" disabled={busy || index === 0} onClick={() => onMove(index, -1)} aria-label={`Move slide ${index + 1} up`}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={busy || index === total - 1} onClick={() => onMove(index, 1)} aria-label={`Move slide ${index + 1} down`}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(slide)} aria-label={`Edit slide ${index + 1}`}>
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onToggleActive(slide)} disabled={busy} aria-label={slide.isActive ? `Deactivate slide ${index + 1}` : `Activate slide ${index + 1}`}>
            <Power className="h-4 w-4" />
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(slide)} disabled={busy} aria-label={`Delete slide ${index + 1}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}

export default function IosHomepageSlideshowManager() {
  const confirm = useConfirm();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(null);
  const [editorMode, setEditorMode] = useState(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [form, setForm] = useState(createEmptySlideForm());
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [fileDimensions, setFileDimensions] = useState(null);
  const [draggingId, setDraggingId] = useState('');
  const [busyOperation, setBusyOperation] = useState(false);
  const flashTimer = useRef(null);

  const editSlide = editorMode?.slide ?? null;
  const editPreviewUrl = editSlide ? `/api/admin/ios-homepage-slideshow/${editSlide.id}/media` : '';

  const sortedSlides = useMemo(() => [...slides].sort((a, b) => (a.displayOrder - b.displayOrder) || a.id.localeCompare(b.id)), [slides]);

  useEffect(() => {
    loadSlides();
  }, []);

  useEffect(() => {
    if (!form.file) {
      setFilePreviewUrl('');
      setFileDimensions(null);
      return undefined;
    }

    const previewUrl = URL.createObjectURL(form.file);
    setFilePreviewUrl(previewUrl);
    inspectImageDimensions(form.file).then((dimensions) => setFileDimensions(dimensions));
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.file]);

  useEffect(() => {
    if (!flash) return undefined;
    clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(flashTimer.current);
  }, [flash]);

  async function loadSlides() {
    setError('');
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/ios-homepage-slideshow', { cache: 'no-store' });
      const body = await readJsonResponse(response);
      const list = Array.isArray(body) ? body : body?.items ?? body?.data ?? [];
      setSlides(list.map(normalizeSlideRecord));
    } catch (requestError) {
      setError(requestError.message || 'Could not load slideshow items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openCreateEditor() {
    setFieldErrors({});
    setForm(createEmptySlideForm());
    setEditorMode({ type: 'create' });
  }

  function openEditEditor(slide) {
    setFieldErrors({});
    setForm({
      ...createEmptySlideForm(),
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      altText: slide.altText || '',
      linkUrl: slide.linkUrl || '',
      linkLabel: slide.linkLabel || '',
      startsAt: slide.startsAt || '',
      endsAt: slide.endsAt || '',
      isActive: slide.isActive,
    });
    setEditorMode({ type: 'edit', slide });
  }

  function updateForm(patch) {
    setForm((current) => ({ ...current, ...patch }));
    setFieldErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  }

  async function selectFile(file) {
    if (!file) {
      updateForm({ file: null });
      return;
    }

    const nextErrors = {};
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type)) {
      nextErrors.file = 'JPEG, PNG, WebP, HEIC, or HEIF images only.';
    } else if (file.size > 15 * 1024 * 1024) {
      nextErrors.file = 'Image must be 15 MB or smaller.';
    }

    const dimensions = await inspectImageDimensions(file);
    if (dimensions && (dimensions.width < 900 || dimensions.height < 600)) {
      nextErrors.file = 'Image must be at least 900 × 600 pixels.';
    }

    updateForm({ file });
    setFileDimensions(dimensions);
    setFieldErrors((current) => ({ ...current, ...nextErrors }));
  }

  async function submitCreate(event) {
    event.preventDefault();
    const validation = validateSlideForm({ ...form, fileDimensions, file: form.file }, { requireFile: true });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setFlash({ tone: 'error', text: 'Fix the highlighted fields before uploading.' });
      return;
    }

    setSubmitting(true);
    setBusyOperation(true);
    try {
      const response = await fetch('/api/admin/ios-homepage-slideshow', {
        method: 'POST',
        body: buildCreateSlideFormData(form),
      });
      await readJsonResponse(response);
      setEditorMode(null);
      setForm(createEmptySlideForm());
      setFieldErrors({});
      setFlash({ tone: 'success', text: 'Slide added successfully.' });
      await loadSlides();
    } catch (requestError) {
      setFieldErrors((current) => ({ ...current, file: requestError.message }));
      setFlash({ tone: 'error', text: requestError.message || 'Could not add the slide.' });
    } finally {
      setSubmitting(false);
      setBusyOperation(false);
    }
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editSlide) return;

    const validation = validateSlideForm(form, { requireFile: false });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setFlash({ tone: 'error', text: 'Fix the highlighted fields before saving.' });
      return;
    }

    const payload = buildUpdateSlidePayload(
      {
        title: editSlide.title,
        subtitle: editSlide.subtitle,
        altText: editSlide.altText,
        linkUrl: editSlide.linkUrl,
        linkLabel: editSlide.linkLabel,
        isActive: editSlide.isActive,
        startsAt: editSlide.startsAt,
        endsAt: editSlide.endsAt,
      },
      form,
    );

    if (Object.keys(payload).length === 0) {
      setEditorMode(null);
      setFlash({ tone: 'success', text: 'No changes to save.' });
      return;
    }

    setSubmitting(true);
    setBusyOperation(true);
    try {
      const response = await fetch(`/api/admin/ios-homepage-slideshow/${editSlide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await readJsonResponse(response);
      setEditorMode(null);
      setFlash({ tone: 'success', text: 'Slide updated successfully.' });
      await loadSlides();
    } catch (requestError) {
      setFlash({ tone: 'error', text: requestError.message || 'Could not save the slide.' });
    } finally {
      setSubmitting(false);
      setBusyOperation(false);
    }
  }

  async function toggleActive(slide) {
    setBusyOperation(true);
    try {
      const response = await fetch(`/api/admin/ios-homepage-slideshow/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !slide.isActive }),
      });
      await readJsonResponse(response);
      setFlash({ tone: 'success', text: slide.isActive ? 'Slide deactivated.' : 'Slide activated.' });
      await loadSlides();
    } catch (requestError) {
      setFlash({ tone: 'error', text: requestError.message || 'Could not change active status.' });
    } finally {
      setBusyOperation(false);
    }
  }

  async function deleteSlide(slide) {
    const confirmed = await confirm(
      getDeleteConfirmationMessage(),
      { title: 'Delete slide?', confirmLabel: 'Delete slide' },
    );

    if (!confirmed) return;

    setBusyOperation(true);
    try {
      const response = await fetch(`/api/admin/ios-homepage-slideshow/${slide.id}`, { method: 'DELETE' });
      await readJsonResponse(response);
      setFlash({ tone: 'success', text: 'Slide deleted.' });
      await loadSlides();
    } catch (requestError) {
      setFlash({ tone: 'error', text: requestError.message || 'Could not delete the slide.' });
    } finally {
      setBusyOperation(false);
    }
  }

  async function reorderSlides(nextSlides, message = 'Slide order saved.') {
    const previousSlides = slides;
    const nextOrder = nextSlides.map((slide) => slide.id);
    setSlides(nextSlides);
    setBusyOperation(true);

    try {
      const response = await fetch('/api/admin/ios-homepage-slideshow/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildReorderPayload(nextOrder)),
      });
      await readJsonResponse(response);
      setFlash({ tone: 'success', text: message });
      await loadSlides();
    } catch (requestError) {
      setSlides(previousSlides);
      setFlash({ tone: 'error', text: requestError.message || 'Could not save the new order.' });
      await loadSlides();
    } finally {
      setBusyOperation(false);
    }
  }

  function moveSlide(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sortedSlides.length) return;

    const nextSlides = [...sortedSlides];
    const [moved] = nextSlides.splice(index, 1);
    nextSlides.splice(targetIndex, 0, moved);
    nextSlides.forEach((slide, position) => {
      slide.displayOrder = position;
    });
    reorderSlides(nextSlides, 'Slide order updated.');
  }

  function handleDragStart(event, id) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
    setDraggingId(id);
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event, targetId) {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId('');
    if (!sourceId || sourceId === targetId) return;

    const sourceIndex = sortedSlides.findIndex((slide) => slide.id === sourceId);
    const targetIndex = sortedSlides.findIndex((slide) => slide.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const nextSlides = [...sortedSlides];
    const [moved] = nextSlides.splice(sourceIndex, 1);
    nextSlides.splice(targetIndex, 0, moved);
    reorderSlides(nextSlides, 'Slide order updated.');
  }

  function handleDragEnd() {
    setDraggingId('');
  }

  const bannerClass = flash?.tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">Slideshow</h1>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Manage the homepage slideshow in display order. Every change goes through the authenticated API proxy.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setLibraryOpen(true)}>Choose from library</Button>
          <Button onClick={openCreateEditor} className="bg-red-900 hover:bg-red-800">
            <Plus className="h-4 w-4" />
            Upload slide
          </Button>
        </div>
      </div>

      {(error || flash) && (
        <div className={cx('rounded-xl border px-4 py-3 text-sm', flash ? bannerClass : 'border-red-200 bg-red-50 text-red-800')} role="status" aria-live="polite">
          {flash?.text || error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Current slides</h2>
            <p className="text-sm text-slate-500">{loading || refreshing ? 'Loading slideshow items…' : `${sortedSlides.length} item${sortedSlides.length === 1 ? '' : 's'}`}</p>
          </div>
          <div className="text-xs text-slate-500">{busyOperation ? 'Processing changes…' : 'Use drag-and-drop or the move buttons to reorder.'}</div>
        </div>

        <div className="px-4 py-4 sm:px-6">
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading slideshow…
            </div>
          ) : sortedSlides.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center text-sm text-slate-500">
              <ImagePlus className="h-10 w-10 text-slate-400" />
              <p>No slides yet. Add the first one to populate the homepage slideshow.</p>
              <Button type="button" variant="outline" onClick={openCreateEditor}>
                Add slide
              </Button>
            </div>
          ) : (
            <ol className="space-y-3">
              {sortedSlides.map((slide, index) => (
                <SlideRow
                  key={slide.id}
                  slide={slide}
                  index={index}
                  total={sortedSlides.length}
                  draggingId={draggingId}
                  busy={busyOperation || submitting}
                  onMove={moveSlide}
                  onEdit={openEditEditor}
                  onToggleActive={toggleActive}
                  onDelete={deleteSlide}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </ol>
          )}
        </div>
      </div>

      {editorMode && (
        <SlideEditorDialog
          mode={editorMode.type}
          form={form}
          errors={fieldErrors}
          filePreviewUrl={filePreviewUrl}
          slidePreviewUrl={editPreviewUrl}
          fileDimensions={fileDimensions}
          onChange={updateForm}
          onSubmit={editorMode.type === 'create' ? submitCreate : submitEdit}
          onClose={() => setEditorMode(null)}
          onFileSelected={selectFile}
          submitting={submitting}
        />
      )}

      {libraryOpen && <ExistingImageDialog onClose={() => setLibraryOpen(false)} onAdded={async () => { setLibraryOpen(false); setFlash({ tone: 'success', text: 'Slide added from the photo library.' }); await loadSlides(); }} />}
    </div>
  );
}
