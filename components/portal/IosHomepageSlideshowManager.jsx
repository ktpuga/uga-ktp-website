'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  AlarmClock, AlertTriangle, Calendar, ChevronDown, ChevronUp, ExternalLink, Eye, EyeOff,
  GripVertical, Image as ImageIcon, Info, Loader2, MoreVertical, Pencil, Plus, RefreshCw,
  Trash2, Upload, X,
} from 'lucide-react';
import slideshowUtils from '@/lib/slideshow-utils.cjs';

const {
  buildCreateSlideFormData,
  buildReorderPayload,
  buildUpdateSlidePayload,
  formatSlideSchedule,
  getSlideScheduleState,
  normalizeSlideRecord,
  validateSlideForm,
} = slideshowUtils;

// Admin-only page — always maroon. Kept in sync with PortalShell's
// REVAMPED_ACCENTS.red.
const MAROON = {
  base: '#7f1d1d',
  gradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
  light: '#991b1b',
};

// Enforced server-side by ensureActiveLimit() in iosHomepageSlidesController —
// exceeding it returns 409 active_slide_limit. Mirrored here so the UI can warn
// before a save fails rather than after.
const MAX_ACTIVE = 10;
const IMG_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
const TIMELINE_DAYS = 28;
const DAY_MS = 24 * 60 * 60 * 1000;

const API_BASE = '/api/admin/ios-homepage-slideshow';

// Tailwind classes rather than raw hex so these follow the .portal-dark token
// swap — hardcoded light-mode colours were unreadable in dark mode.
const STATE_STYLES = {
  active: {
    label: 'Live now',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  scheduled: {
    label: 'Scheduled',
    pill: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  expired: {
    label: 'Expired',
    pill: 'border-border bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  inactive: {
    label: 'Inactive',
    pill: 'border-border bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground/60',
  },
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Live now' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'expired', label: 'Expired' },
  { id: 'inactive', label: 'Inactive' },
];

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function timeAgo(iso) {
  const parsed = new Date(iso).getTime();
  if (Number.isNaN(parsed)) return '';
  const mins = Math.floor((Date.now() - parsed) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function slideMediaUrl(id) {
  return `${API_BASE}/${id}/media`;
}

// Mirrors services/iosSlideshowImage.js exactly. The server extracts the
// largest possible 3:2 region centred on the focal point, then resizes it —
// so the crop is full-height on a source wider than 3:2 and full-width on a
// taller one. Reimplementing it here is what makes the preview frame honest;
// anything else shows the user a crop the server won't actually produce.
function computeCropRect(width, height, focalX, focalY) {
  if (!width || !height) return null;
  const cropWidth = Math.min(width, Math.round(height * 1.5));
  const cropHeight = Math.min(height, Math.round(width / 1.5));
  const left = Math.max(0, Math.min(width - cropWidth, Math.round(width * focalX - cropWidth / 2)));
  const top = Math.max(0, Math.min(height - cropHeight, Math.round(height * focalY - cropHeight / 2)));
  return {
    leftPct: (left / width) * 100,
    topPct: (top / height) * 100,
    widthPct: (cropWidth / width) * 100,
    heightPct: (cropHeight / height) * 100,
  };
}

async function readJson(response) {
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || body?.message || 'The slideshow request failed.');
  }
  return body;
}

function emptyForm() {
  return {
    title: '', subtitle: '', altText: '', linkUrl: '', linkLabel: '',
    startsAt: '', endsAt: '', isActive: true, focalX: 0.5, focalY: 0.5,
  };
}

function ModalWrapper({ children, onClose, label, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className={cn('relative z-10 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl', maxWidth)}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, icon, onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(MAROON.base, 0.03) }}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: MAROON.gradient }}>
          {icon}
        </div>
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
        <X size={14} />
      </button>
    </div>
  );
}

function ConfirmDeleteModal({ slide, busy, onClose, onConfirm }) {
  const [typed, setTyped] = useState('');
  const confirmed = typed.trim().toLowerCase() === 'delete';

  return (
    <ModalWrapper onClose={onClose} label="Delete slide" maxWidth="max-w-sm">
      <div className="flex items-center justify-between border-b border-destructive/15 bg-destructive/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15">
            <AlertTriangle size={14} className="text-destructive" />
          </div>
          <p className="text-sm font-semibold text-destructive">Delete slide</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close">
          <X size={14} />
        </button>
      </div>
      <div className="space-y-3 px-5 py-4">
        {/* Wording matches getDeleteConfirmationMessage() in slideshow-auth.cjs.
            Only the cropped 1500x1000 derivative is destroyed — a photo-library
            image this slide was registered from is left alone. */}
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">&ldquo;{slide.title}&rdquo;</span> will be permanently
          deleted, along with the cropped slideshow image generated for it. This cannot be undone.{' '}
          <span className="font-medium text-foreground">
            If this slide was registered from the shared photo library, that original stays untouched.
          </span>
        </p>
        <div>
          <label htmlFor="delete-confirm" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            Type <span className="font-mono font-bold text-destructive">delete</span> to confirm
          </label>
          <input
            id="delete-confirm"
            autoFocus
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="delete"
            className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-destructive/40"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
        <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!confirmed || busy}
          className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-35"
        >
          {busy && <Loader2 size={13} className="animate-spin" />}
          Permanently delete
        </button>
      </div>
    </ModalWrapper>
  );
}

// Renders a slide the way the iOS app composites it: the 3:2 image with title,
// subtitle and link button laid over it.
function IphoneFrame({ slide, imageSrc }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-foreground/10 bg-black shadow-2xl"
        style={{ width: 220, height: 440 }}
        aria-label="iPhone preview"
      >
        <div className="absolute left-1/2 top-2 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
        <div className="absolute left-0 top-0 z-10 flex w-full items-center justify-between px-5 pt-2 text-[8px] font-bold text-white">
          <span>9:41</span>
          <span className="flex items-center gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </div>

        <div className="h-full w-full bg-black">
          {slide ? (
            <div className="relative h-full w-full">
              <div className="absolute inset-x-0 top-0" style={{ bottom: '33%' }}>
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageSrc} alt={slide.altText || ''} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-800 text-[9px] text-white/40">No image yet</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              <div className="absolute inset-x-3 text-white" style={{ bottom: '35%' }}>
                <p className="line-clamp-2 text-[11px] font-bold leading-tight drop-shadow-sm">{slide.title || 'Title preview'}</p>
                {slide.subtitle && <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-white/80">{slide.subtitle}</p>}
                {slide.linkLabel && (
                  <div className="mt-1.5 inline-block rounded-full bg-white/20 px-2.5 py-0.5 backdrop-blur-sm">
                    <span className="text-[9px] font-semibold text-white">{slide.linkLabel}</span>
                  </div>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 rounded-b-[2rem] bg-[#1c1c1e] px-3 pb-3 pt-2" style={{ top: '67%' }}>
                <p className="mb-1 text-[8px] font-semibold uppercase tracking-wider text-white/40">KTP Phi Chapter</p>
                <div className="h-6 rounded-lg bg-white/10" />
                <div className="mt-1.5 grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map((i) => <div key={i} className="h-8 rounded-lg bg-white/10" />)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center">
              <p className="text-[10px] text-white/40">Select a slide to preview it here</p>
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">App preview</p>
    </div>
  );
}

// Shows the WHOLE source at its natural aspect ratio with the real 3:2 crop
// rectangle overlaid. Anything that pre-crops the container to 3:2 is lying to
// the user about what they'll get.
function FocalPointPicker({ src, focal, onChange }) {
  const stageRef = useRef(null);
  const dragging = useRef(false);
  const [dimensions, setDimensions] = useState(null);

  useEffect(() => {
    setDimensions(null);
    if (!src) return undefined;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) setDimensions({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.src = src;
    return () => { cancelled = true; };
  }, [src]);

  function pick(clientX, clientY) {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    onChange(x, y);
  }

  const crop = dimensions ? computeCropRect(dimensions.width, dimensions.height, focal.x, focal.y) : null;
  const tooSmall = dimensions && (dimensions.width < 900 || dimensions.height < 600);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Set focal point</span>
        <span className="font-mono text-[11px] text-muted-foreground">{focal.x.toFixed(2)}, {focal.y.toFixed(2)}</span>
      </div>

      <div
        ref={stageRef}
        className="relative w-full cursor-crosshair select-none overflow-hidden rounded-xl border border-border bg-muted"
        style={{ aspectRatio: dimensions ? `${dimensions.width} / ${dimensions.height}` : '3 / 2' }}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); pick(e.clientX, e.clientY); }}
        onPointerMove={(e) => { if (dragging.current) pick(e.clientX, e.clientY); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="pointer-events-none h-full w-full object-contain" decoding="async" />

        {crop && (
          <div
            className="pointer-events-none absolute rounded-sm border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
            style={{
              left: `${crop.leftPct}%`,
              top: `${crop.topPct}%`,
              width: `${crop.widthPct}%`,
              height: `${crop.heightPct}%`,
            }}
          />
        )}

        <div
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/30 shadow-md backdrop-blur-sm"
          style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        The white rectangle is the exact 3:2 area the server will keep. Click or drag to move it.
      </p>
      {tooSmall && (
        <p className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          <AlertTriangle size={11} /> This image is {dimensions.width} × {dimensions.height}. The minimum is 900 × 600.
        </p>
      )}
    </div>
  );
}

function Field({ label, required, counter, error, children, htmlFor }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        {counter && <span className="text-[10px] tabular-nums text-muted-foreground">{counter}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[rgba(127,29,29,0.28)]';

function SlideMetaForm({ form, errors, onChange }) {
  const altDupesTitle =
    form.altText.trim().length > 0 &&
    form.altText.trim().toLowerCase() === form.title.trim().toLowerCase();

  return (
    <div className="space-y-4">
      <Field label="Title" required counter={`${form.title.length}/100`} error={errors.title} htmlFor="slide-title">
        <input id="slide-title" type="text" maxLength={100} value={form.title} placeholder="Spring Rush 2026"
          onChange={(e) => onChange({ title: e.target.value })} className={INPUT_CLASS} />
      </Field>

      <Field label="Subtitle" counter={`${form.subtitle.length}/220`} error={errors.subtitle} htmlFor="slide-subtitle">
        <textarea id="slide-subtitle" rows={2} maxLength={220} value={form.subtitle}
          placeholder="Join us this semester for events, workshops, and networking."
          onChange={(e) => onChange({ subtitle: e.target.value })} className={cn(INPUT_CLASS, 'resize-none')} />
      </Field>

      <Field label="Alt text" required counter={`${form.altText.length}/300`} error={errors.altText} htmlFor="slide-alt">
        <input id="slide-alt" type="text" maxLength={300} value={form.altText}
          placeholder="KTP members at a spring networking event"
          onChange={(e) => onChange({ altText: e.target.value })} className={INPUT_CLASS} />
        {altDupesTitle && (
          <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            <Info size={11} className="mt-0.5 shrink-0" />
            Alt text repeats the title. Good alt text describes what is visible in the photo, for members using VoiceOver.
          </div>
        )}
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Link URL (HTTPS)" error={errors.linkUrl} htmlFor="slide-link-url">
          <input id="slide-link-url" type="url" value={form.linkUrl} placeholder="https://ugaktp.com/rush"
            onChange={(e) => onChange({ linkUrl: e.target.value })} className={INPUT_CLASS} />
        </Field>
        <Field label="Button label" counter={`${form.linkLabel.length}/80`} error={errors.linkLabel} htmlFor="slide-link-label">
          <input id="slide-link-label" type="text" maxLength={80} value={form.linkLabel} placeholder="Learn more"
            onChange={(e) => onChange({ linkLabel: e.target.value })} className={INPUT_CLASS} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Show from (optional)" error={errors.startsAt} htmlFor="slide-starts">
          <input id="slide-starts" type="datetime-local" value={form.startsAt}
            onChange={(e) => onChange({ startsAt: e.target.value })} className={INPUT_CLASS} />
        </Field>
        <Field label="Hide after (optional)" error={errors.endsAt} htmlFor="slide-ends">
          <input id="slide-ends" type="datetime-local" value={form.endsAt} min={form.startsAt || undefined}
            onChange={(e) => onChange({ endsAt: e.target.value })} className={INPUT_CLASS} />
        </Field>
      </div>
    </div>
  );
}

function SlideModal({ slide, activeCount, onClose, onCreate, onRegister, onSaveMeta, onReplaceImage }) {
  const isEdit = Boolean(slide);

  const [mode, setMode] = useState('upload');
  const [form, setForm] = useState(() => (isEdit
    ? {
      ...emptyForm(),
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      altText: slide.altText || '',
      linkUrl: slide.linkUrl || '',
      linkLabel: slide.linkLabel || '',
      startsAt: slide.startsAt ? String(slide.startsAt).slice(0, 16) : '',
      endsAt: slide.endsAt ? String(slide.endsAt).slice(0, 16) : '',
      isActive: slide.isActive,
    }
    : emptyForm()));

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [fileDimensions, setFileDimensions] = useState(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySelection, setLibrarySelection] = useState(null);

  const fileRef = useRef(null);

  // Object URLs leak if they're not revoked when the chosen file changes.
  useEffect(() => () => { if (filePreview.startsWith('blob:')) URL.revokeObjectURL(filePreview); }, [filePreview]);

  useEffect(() => {
    if (isEdit || mode !== 'library' || library.length || libraryLoading) return;
    setLibraryLoading(true);
    fetch(`${API_BASE}/library`, { cache: 'no-store' })
      .then(readJson)
      .then((body) => setLibrary(Array.isArray(body) ? body : body?.items ?? body?.data ?? []))
      .catch((err) => setError(err.message ?? 'Could not load the photo library.'))
      .finally(() => setLibraryLoading(false));
  }, [isEdit, mode, library.length, libraryLoading]);

  function selectFile(picked) {
    if (!picked) return;
    setFile(picked);
    setErrors((prev) => ({ ...prev, file: undefined }));
    setError('');

    const url = URL.createObjectURL(picked);
    setFilePreview(url);

    const probe = new Image();
    probe.onload = () => setFileDimensions({ width: probe.naturalWidth, height: probe.naturalHeight });
    probe.onerror = () => setFileDimensions(null);
    probe.src = url;
  }

  function updateForm(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  }

  const previewSlide = useMemo(() => ({
    title: form.title,
    subtitle: form.subtitle || null,
    altText: form.altText,
    linkLabel: form.linkLabel || null,
  }), [form]);

  // In edit mode with no new file, the only image is the stored 1500x1000
  // derivative — already exactly 3:2, so there is nothing left to reposition.
  const previewImage = filePreview || (isEdit ? slideMediaUrl(slide.id) : '');
  const showFocalPicker = Boolean(filePreview);

  async function submit(e) {
    e.preventDefault();
    setError('');

    const validation = validateSlideForm(
      { ...form, file, fileDimensions },
      { requireFile: !isEdit && mode === 'upload' },
    );
    if (!validation.valid) {
      setErrors(validation.errors);
      setError('Fix the highlighted fields before saving.');
      return;
    }
    if (!isEdit && mode === 'library' && !librarySelection) {
      setError('Choose an image from the library first.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        // Metadata first, then the image. The reverse order can leave a slide
        // with a swapped picture but the caption edits silently dropped.
        const payload = buildUpdateSlidePayload(
          {
            title: slide.title, subtitle: slide.subtitle, altText: slide.altText,
            linkUrl: slide.linkUrl, linkLabel: slide.linkLabel,
            isActive: slide.isActive, startsAt: slide.startsAt, endsAt: slide.endsAt,
          },
          form,
        );
        if (Object.keys(payload).length) await onSaveMeta(slide.id, payload);
        if (replaceMode && file) await onReplaceImage(slide.id, file, form.focalX, form.focalY);
      } else if (mode === 'library') {
        await onRegister({ ...form, immichAssetId: librarySelection.immich_asset_id });
      } else {
        await onCreate({ ...form, file });
      }
      onClose();
    } catch (err) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  const atCapacity = !isEdit && activeCount >= MAX_ACTIVE;

  return (
    <ModalWrapper onClose={onClose} label={isEdit ? 'Edit slide' : 'New slide'} maxWidth="max-w-4xl">
      <ModalHeader
        title={isEdit ? `Edit: ${slide.title}` : 'New slide'}
        icon={isEdit ? <Pencil size={13} /> : <Plus size={14} />}
        onClose={onClose}
      />
      <form onSubmit={submit}>
        <div className="flex max-h-[75vh] overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {!isEdit && (
              <div className="inline-flex rounded-xl border border-border bg-muted/40 p-0.5 text-xs font-medium">
                {[['upload', 'Upload image'], ['library', 'From photo library']].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setMode(value); setError(''); }}
                    className={cn('rounded-lg px-4 py-1.5 transition-all', mode === value ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                    style={mode === value ? { background: MAROON.gradient } : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {!isEdit && mode === 'library' ? (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Registers an existing shared-album image as a slide. The server still crops its own 3:2 copy; the original is untouched.
                </p>
                <div className="grid max-h-56 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
                  {libraryLoading ? (
                    <p className="col-span-full flex items-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" /> Loading images…
                    </p>
                  ) : library.length === 0 ? (
                    <p className="col-span-full py-6 text-sm text-muted-foreground">No library images available.</p>
                  ) : (
                    library
                      .filter((photo) => (!photo.media_type || photo.media_type === 'image') && photo.immich_asset_id)
                      .map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setLibrarySelection(photo)}
                          className={cn(
                            'overflow-hidden rounded-lg border text-left',
                            librarySelection?.id === photo.id ? 'border-transparent ring-2' : 'border-border',
                          )}
                          style={librarySelection?.id === photo.id ? { '--tw-ring-color': MAROON.light } : undefined}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/api/photos/${photo.id}/media`} alt={photo.title || 'Library image'}
                            className="aspect-square w-full object-cover" loading="lazy" decoding="async" />
                          <span className="block truncate p-1.5 text-xs text-foreground">{photo.title || 'Untitled'}</span>
                        </button>
                      ))
                  )}
                </div>
              </div>
            ) : isEdit && !replaceMode ? (
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slideMediaUrl(slide.id)} alt="" className="h-12 w-[72px] rounded-lg object-cover" loading="lazy" decoding="async" />
                  <p className="text-xs text-muted-foreground">Current image</p>
                </div>
                <button type="button" onClick={() => setReplaceMode(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Upload size={11} /> Replace image
                </button>
              </div>
            ) : showFocalPicker ? (
              <div className="space-y-2">
                <FocalPointPicker src={filePreview} focal={{ x: form.focalX, y: form.focalY }}
                  onChange={(x, y) => updateForm({ focalX: x, focalY: y })} />
                <button type="button"
                  onClick={() => { setFile(null); setFilePreview(''); setFileDimensions(null); if (isEdit) setReplaceMode(false); }}
                  className="text-xs text-muted-foreground hover:text-foreground">
                  {isEdit ? 'Keep the current image' : 'Choose a different image'}
                </button>
                {errors.file && <p className="text-[11px] text-destructive">{errors.file}</p>}
              </div>
            ) : (
              <div>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); selectFile(e.dataTransfer.files?.[0]); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
                  role="button"
                  tabIndex={0}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center hover:bg-muted/40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: tint(MAROON.base, 0.08) }}>
                    <Upload size={18} style={{ color: MAROON.light }} />
                  </div>
                  <p className="text-sm font-medium text-foreground">Click or drag an image here</p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, HEIC · max 15 MB</p>
                  <p className="text-[11px] text-muted-foreground/70">At least 900 × 600. The server crops a 3:2 copy at 1500 × 1000.</p>
                </div>
                {errors.file && <p className="mt-1 text-[11px] text-destructive">{errors.file}</p>}
                {isEdit && (
                  <button type="button" onClick={() => setReplaceMode(false)} className="mt-2 text-xs text-muted-foreground hover:text-foreground">
                    Keep the current image
                  </button>
                )}
              </div>
            )}

            <input ref={fileRef} type="file" accept={IMG_ACCEPT} className="sr-only"
              onChange={(e) => selectFile(e.target.files?.[0])} />

            <SlideMetaForm form={form} errors={errors} onChange={updateForm} />

            {!isEdit && (
              <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm text-foreground">
                <input type="checkbox" checked={form.isActive} disabled={atCapacity}
                  onChange={(e) => updateForm({ isActive: e.target.checked })} className="h-4 w-4 rounded border-border" />
                Show in the slideshow straight away
              </label>
            )}

            {atCapacity && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                <Info size={12} className="mt-0.5 shrink-0" />
                The slideshow already has {MAX_ACTIVE} active slides. This one can be saved as inactive — deactivate another to make room for it.
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
                <AlertTriangle size={12} /> {error}
              </div>
            )}
          </div>

          <div className="hidden w-64 shrink-0 flex-col items-center border-l border-border bg-muted/20 p-6 lg:flex">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p>
            <IphoneFrame slide={previewSlide} imageSrc={previewImage} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: MAROON.gradient }}>
            {submitting && <Loader2 size={13} className="animate-spin" />}
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create slide'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

function CapacityMeter({ activeCount }) {
  const atCap = activeCount >= MAX_ACTIVE;
  const nearCap = activeCount >= MAX_ACTIVE - 2;
  const pct = Math.min(100, (activeCount / MAX_ACTIVE) * 100);

  return (
    <div className={cn('overflow-hidden rounded-2xl border bg-card shadow-sm',
      atCap ? 'border-destructive/30' : nearCap ? 'border-amber-300 dark:border-amber-900' : 'border-border')}>
      <div className="px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Active slide capacity</p>
          <p className={cn('text-sm font-bold', atCap ? 'text-destructive' : nearCap ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>
            {activeCount} / {MAX_ACTIVE}
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: atCap ? '#dc2626' : nearCap ? '#f59e0b' : MAROON.gradient }} />
        </div>
        <p className={cn('mt-2 text-xs', atCap ? 'text-destructive' : nearCap ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
          {atCap
            ? 'At capacity — deactivate a slide before activating another.'
            : `${MAX_ACTIVE - activeCount} slot${MAX_ACTIVE - activeCount !== 1 ? 's' : ''} available`}
        </p>
      </div>
    </div>
  );
}

function ScheduleTimeline({ slides }) {
  const [collapsed, setCollapsed] = useState(false);

  const { gapRanges, lanes, startMs } = useMemo(() => {
    const start = Date.now();
    const scheduled = slides.filter((s) => s.startsAt || s.endsAt);

    const isActiveOn = (slide, dayStart, dayEnd) => {
      if (!slide.isActive) return false;
      const from = slide.startsAt ? new Date(slide.startsAt).getTime() : 0;
      const to = slide.endsAt ? new Date(slide.endsAt).getTime() : Infinity;
      return from < dayEnd && to > dayStart;
    };

    const gapDays = [];
    for (let d = 0; d < TIMELINE_DAYS; d += 1) {
      const dayStart = start + d * DAY_MS;
      if (!slides.some((s) => isActiveOn(s, dayStart, dayStart + DAY_MS))) gapDays.push(d);
    }

    const ranges = [];
    let open = null;
    for (let d = 0; d <= TIMELINE_DAYS; d += 1) {
      if (gapDays.includes(d)) {
        if (open === null) open = d;
      } else if (open !== null) {
        ranges.push({ start: open, end: d - 1 });
        open = null;
      }
    }

    return { gapRanges: ranges, lanes: scheduled, startMs: start };
  }, [slides]);

  const fmt = (ms) => new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const laneColors = ['#7f1d1d', '#7e22ce', '#1d4ed8', '#15803d', '#b45309', '#0e7490', '#be185d'];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(MAROON.base, 0.03) }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: MAROON.gradient }}>
            <AlarmClock size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Schedule timeline</p>
            <p className="text-[11px] text-muted-foreground">Next {TIMELINE_DAYS} days · coverage gaps highlighted</p>
          </div>
        </div>
        <button type="button" onClick={() => setCollapsed((p) => !p)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
          {collapsed ? <><ChevronDown size={13} /> Show</> : <><ChevronUp size={13} /> Collapse</>}
        </button>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto p-5">
          {gapRanges.length > 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950">
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold">No slides scheduled for:</span>{' '}
                {gapRanges.map((r) => (r.start === r.end
                  ? fmt(startMs + r.start * DAY_MS)
                  : `${fmt(startMs + r.start * DAY_MS)}–${fmt(startMs + r.end * DAY_MS)}`)).join(', ')}
                {' '}— the app slideshow will be empty on those dates.
              </div>
            </div>
          )}

          {lanes.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No slides have a scheduling window. Every active slide shows all the time.
            </p>
          ) : (
            <div style={{ minWidth: 600 }}>
              <div className="mb-1 flex" style={{ paddingLeft: 140 }}>
                {Array.from({ length: TIMELINE_DAYS }).map((_, d) => (d % 7 === 0 ? (
                  <div key={d} className="text-[10px] text-muted-foreground" style={{ flex: `0 0 ${(7 / TIMELINE_DAYS) * 100}%` }}>
                    {fmt(startMs + d * DAY_MS)}
                  </div>
                ) : null))}
              </div>

              <div className="relative mb-1 h-3 rounded-full" style={{ marginLeft: 140 }}>
                {gapRanges.map((r) => (
                  <div key={`${r.start}-${r.end}`} className="absolute h-full rounded-full bg-amber-300/50"
                    style={{ left: `${(r.start / TIMELINE_DAYS) * 100}%`, width: `${((r.end - r.start + 1) / TIMELINE_DAYS) * 100}%` }} />
                ))}
              </div>

              {lanes.map((slide, i) => {
                const from = slide.startsAt ? Math.max(0, (new Date(slide.startsAt).getTime() - startMs) / (TIMELINE_DAYS * DAY_MS)) : 0;
                const to = slide.endsAt ? Math.min(1, (new Date(slide.endsAt).getTime() - startMs) / (TIMELINE_DAYS * DAY_MS)) : 1;
                return (
                  <div key={slide.id} className="mb-1 flex items-center gap-2">
                    <div className="w-[132px] shrink-0 truncate pr-2 text-right text-[11px] text-muted-foreground">{slide.title}</div>
                    <div className="relative h-5 flex-1 rounded-full bg-muted/60">
                      <div className="absolute h-full rounded-full"
                        style={{ left: `${from * 100}%`, width: `${Math.max(0.02, to - from) * 100}%`, background: laneColors[i % laneColors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StateBadge({ tone }) {
  const style = STATE_STYLES[tone] ?? STATE_STYLES.inactive;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', style.pill)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  );
}

function SlideRow({
  slide, index, selected, busy, atCap, isDragging, isDropTarget,
  onSelect, onEdit, onToggleActive, onDelete, onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const state = getSlideScheduleState(slide);
  const schedule = formatSlideSchedule(slide);
  const blockedByCap = atCap && !slide.isActive;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={cn(
        'group relative flex cursor-pointer items-start gap-3 rounded-2xl border bg-card px-4 py-3 transition-all',
        selected ? 'border-transparent ring-1' : 'border-border hover:shadow-sm',
        isDragging && 'scale-[0.98] opacity-50',
        isDropTarget && !isDragging && 'border-dashed',
        state.tone === 'expired' && 'opacity-70',
      )}
      style={selected ? { '--tw-ring-color': tint(MAROON.base, 0.4), borderColor: tint(MAROON.base, 0.4) } : undefined}
    >
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: MAROON.gradient }}>
          {index + 1}
        </span>
        <span className="cursor-grab text-muted-foreground/50" aria-hidden="true"><GripVertical size={13} /></span>
      </div>

      <div className="relative shrink-0 overflow-hidden rounded-xl" style={{ width: 80, height: 54 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slideMediaUrl(slide.id)} alt={slide.altText || ''} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        {!slide.isActive && <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]" />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-foreground">{slide.title}</p>
          <StateBadge tone={state.tone} />
          {state.tone === 'expired' && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              Cleanup candidate
            </span>
          )}
        </div>
        {slide.subtitle && <p className="truncate text-xs text-muted-foreground">{slide.subtitle}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {schedule && schedule !== 'Unscheduled' && <span className="flex items-center gap-1"><Calendar size={10} />{schedule}</span>}
          {slide.linkUrl && <span className="flex items-center gap-1"><ExternalLink size={10} />{slide.linkLabel || 'Link'}</span>}
          {slide.created_at && <span>Added {timeAgo(slide.created_at)}</span>}
        </div>
      </div>

      <div className="ml-2 flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onEdit}
          className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
          <Pencil size={11} /> Edit
        </button>
        <button
          type="button"
          onClick={onToggleActive}
          disabled={busy || blockedByCap}
          title={blockedByCap ? `At ${MAX_ACTIVE} active slides — deactivate another first` : undefined}
          className={cn(
            'flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40',
            slide.isActive ? 'border-border text-muted-foreground hover:bg-muted' : 'border-transparent text-white hover:opacity-85',
          )}
          style={!slide.isActive ? { background: MAROON.gradient } : undefined}
        >
          {slide.isActive ? <><EyeOff size={11} /> Deactivate</> : <><Eye size={11} /> Activate</>}
        </button>
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen((p) => !p)} aria-label={`More actions for ${slide.title}`}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <MoreVertical size={13} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <button type="button" onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-destructive hover:bg-destructive/5">
                  <Trash2 size={11} /> Delete slide
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IosHomepageSlideshowManager() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  useEffect(() => {
    load({ initial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(''), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  async function load({ initial = false } = {}) {
    if (!initial) setRefreshing(true);
    setError('');
    try {
      const body = await readJson(await fetch(API_BASE, { cache: 'no-store' }));
      const list = Array.isArray(body) ? body : body?.slides ?? body?.items ?? body?.data ?? [];
      const normalized = list.map(normalizeSlideRecord).sort((a, b) => (a.displayOrder - b.displayOrder) || String(a.id).localeCompare(String(b.id)));
      setSlides(normalized);
      setSelectedId((prev) => (prev && normalized.some((s) => s.id === prev) ? prev : normalized[0]?.id ?? null));
    } catch (err) {
      setError(err.message ?? 'Could not load slideshow items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const activeCount = useMemo(() => slides.filter((s) => s.isActive).length, [slides]);
  const atCap = activeCount >= MAX_ACTIVE;
  const selectedSlide = useMemo(() => slides.find((s) => s.id === selectedId) ?? null, [slides, selectedId]);

  const counts = useMemo(() => {
    const base = { all: slides.length, active: 0, scheduled: 0, expired: 0, inactive: 0 };
    slides.forEach((s) => { base[getSlideScheduleState(s).tone] += 1; });
    return base;
  }, [slides]);

  const visibleSlides = useMemo(
    () => (filter === 'all' ? slides : slides.filter((s) => getSlideScheduleState(s).tone === filter)),
    [slides, filter],
  );

  async function persistOrder(next) {
    const previous = slides;
    setSlides(next);
    setBusy(true);
    setError('');
    try {
      await readJson(await fetch(`${API_BASE}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildReorderPayload(next.map((s) => s.id))),
      }));
      setFlash('Slide order saved.');
      await load();
    } catch (err) {
      setSlides(previous);
      setError(err.message ?? 'Could not save the new order.');
      await load();
    } finally {
      setBusy(false);
    }
  }

  function handleDrop(index) {
    const from = dragIndex;
    setDragIndex(null);
    setOverIndex(null);
    if (from === null || from === index) return;
    const next = [...slides];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    persistOrder(next);
  }

  async function toggleActive(slide) {
    if (!slide.isActive && atCap) return;
    setBusy(true);
    setError('');
    try {
      await readJson(await fetch(`${API_BASE}/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !slide.isActive }),
      }));
      setFlash(slide.isActive ? 'Slide deactivated.' : 'Slide activated.');
      await load();
    } catch (err) {
      setError(err.message ?? 'Could not change the active status.');
    } finally {
      setBusy(false);
    }
  }

  async function createSlide(values) {
    await readJson(await fetch(API_BASE, { method: 'POST', body: buildCreateSlideFormData(values) }));
    setFlash('Slide created.');
    await load();
  }

  async function registerSlide(values) {
    await readJson(await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        immich_asset_id: String(values.immichAssetId),
        title: values.title.trim(),
        subtitle: values.subtitle.trim() || null,
        alt_text: values.altText.trim(),
        link_url: values.linkUrl.trim() || null,
        link_label: values.linkLabel.trim() || null,
        is_active: values.isActive,
        starts_at: values.startsAt || null,
        ends_at: values.endsAt || null,
        focal_x: values.focalX,
        focal_y: values.focalY,
      }),
    }));
    setFlash('Slide added from the photo library.');
    await load();
  }

  async function saveMeta(id, payload) {
    await readJson(await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }));
    setFlash('Slide updated.');
    await load();
  }

  async function replaceImage(id, file, focalX, focalY) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('focal_x', String(focalX));
    formData.append('focal_y', String(focalY));
    await readJson(await fetch(`${API_BASE}/${id}/image`, { method: 'PUT', body: formData }));
    setFlash('Slide image replaced.');
    await load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    setError('');
    try {
      await readJson(await fetch(`${API_BASE}/${deleteTarget.id}`, { method: 'DELETE' }));
      setFlash('Slide deleted.');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err.message ?? 'Could not delete that slide.');
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: MAROON.light }}>Admin Panel</p>
          <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">Homepage Slideshow</h1>
          <p className="mt-1 text-sm text-muted-foreground">Controls the slideshow on the KTP Life app&apos;s home screen</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => load()} disabled={refreshing || busy}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground disabled:opacity-40">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : undefined} /> Refresh
          </button>
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-85"
            style={{ background: MAROON.gradient }}>
            <Plus size={14} /> New slide
          </button>
        </div>
      </div>

      {(error || flash) && (
        <div className={cn('mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm',
          error
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300')}
          role="status" aria-live="polite">
          {error ? <AlertTriangle size={14} /> : null} {error || flash}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_auto]">
        <div className="space-y-5">
          <CapacityMeter activeCount={activeCount} />
          <ScheduleTimeline slides={slides} />
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-5 shadow-sm lg:w-64">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">App preview</p>
          <p className="mb-4 text-[11px] text-muted-foreground/70">Click a slide to preview it</p>
          <IphoneFrame slide={selectedSlide} imageSrc={selectedSlide ? slideMediaUrl(selectedSlide.id) : ''} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)}
            className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filter === f.id ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:text-foreground')}
            style={filter === f.id ? { background: MAROON.gradient } : undefined}>
            {f.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none',
              filter === f.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground')}>
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading slideshow…
        </div>
      ) : visibleSlides.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card">
          <ImageIcon size={20} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {slides.length === 0 ? 'No slides yet — add the first one above.' : `No ${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} slides.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleSlides.map((slide) => {
            const index = slides.findIndex((s) => s.id === slide.id);
            return (
              <SlideRow
                key={slide.id}
                slide={slide}
                index={index}
                selected={selectedId === slide.id}
                busy={busy}
                atCap={atCap}
                isDragging={dragIndex === index}
                isDropTarget={overIndex === index}
                onSelect={() => setSelectedId(slide.id)}
                onEdit={() => setEditTarget(slide)}
                onToggleActive={() => toggleActive(slide)}
                onDelete={() => setDeleteTarget(slide)}
                onDragStart={() => setDragIndex(index)}
                onDragOver={() => setOverIndex(index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              />
            );
          })}
        </div>
      )}

      {showCreate && (
        <SlideModal
          activeCount={activeCount}
          onClose={() => setShowCreate(false)}
          onCreate={createSlide}
          onRegister={registerSlide}
        />
      )}

      {editTarget && (
        <SlideModal
          slide={editTarget}
          activeCount={activeCount}
          onClose={() => setEditTarget(null)}
          onSaveMeta={saveMeta}
          onReplaceImage={replaceImage}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          slide={deleteTarget}
          busy={busy}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
