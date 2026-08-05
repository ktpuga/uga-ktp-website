'use client';

import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  Clock, GripVertical, Image as ImageIcon, Layers, LayoutTemplate, Link2, Loader2,
  Pencil, Play, Plus, RefreshCw, Square, Trash2, Upload, Video, X,
} from 'lucide-react';
import {
  getHomepagePhotos,
  registerHomepagePhoto,
  removeHomepagePhoto,
  reorderHomepagePhotos,
  updateHomepagePhoto,
  uploadHomepagePhoto,
} from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';

// Palette now comes from the portal accent context so the Admin red/blue
// toggle reaches this page, not just the sidebar. Each component asks for it
// directly — no prop threading through the sub-components in this file.

// Mirrors what ktp-api's multer config actually accepts for this route.
const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm';
const MAX_BYTES = 250 * 1024 * 1024;

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Hand-rolled rather than pulling in a date library — this repo has none, and
// adding one would need --legacy-peer-deps for the React 19 peer conflict.
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
  return `${Math.floor(days / 30)}mo ago`;
}

function photoMediaUrl(id) {
  return `/api/homepage-photos/${id}/media`;
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
  const MAROON = useAccentPalette();
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(MAROON.base, 0.03) }}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: MAROON.gradient }}>
          {icon}
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
        <X size={14} />
      </button>
    </div>
  );
}

function ConfirmModal({ title, body, confirmLabel, onClose, onConfirm, busy = false }) {
  return (
    <ModalWrapper onClose={onClose} label={title} maxWidth="max-w-sm">
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle size={18} className="text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? 'Removing…' : confirmLabel}
        </button>
      </div>
    </ModalWrapper>
  );
}

function AddMediaModal({ onClose, onUpload, onRegisterImmich }) {
  const MAROON = useAccentPalette();
  const [mode, setMode] = useState('upload');
  const [stagedFiles, setStagedFiles] = useState([]);
  const [immichId, setImmichId] = useState('');
  const [immichType, setImmichType] = useState('image');
  const [immichTitle, setImmichTitle] = useState('');
  const [immichCaption, setImmichCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function stageFiles(files) {
    if (!files) return;
    const staged = [];
    let rejected = '';
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        rejected = `"${file.name}" is over the 250 MB limit.`;
        continue;
      }
      staged.push({ file, title: '', caption: '' });
    }
    setStagedFiles((prev) => [...prev, ...staged]);
    setError(rejected);
  }

  function updateMeta(index, field, value) {
    setStagedFiles((prev) => prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)));
  }

  async function submit() {
    setError('');

    if (mode === 'upload' && stagedFiles.length === 0) {
      setError('Add at least one file.');
      return;
    }
    if (mode === 'immich' && !immichId.trim()) {
      setError('Immich asset ID is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'upload') {
        await onUpload(stagedFiles);
      } else {
        await onRegisterImmich({
          immich_asset_id: immichId.trim(),
          media_type: immichType,
          title: immichTitle.trim() || undefined,
          caption: immichCaption.trim() || undefined,
        });
      }
      onClose();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]';

  return (
    <ModalWrapper onClose={onClose} label="Add media" maxWidth="max-w-xl">
      <ModalHeader title="Add Media" icon={<Plus size={14} />} onClose={onClose} />
      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-0.5 text-xs font-medium">
          {['upload', 'immich'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-4 py-1.5 transition-all',
                mode === value ? 'text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
              style={mode === value ? { background: MAROON.gradient } : undefined}
            >
              {value === 'upload' ? (
                <><Upload size={11} /> Upload file</>
              ) : (
                <><Link2 size={11} /> Register from Immich</>
              )}
            </button>
          ))}
        </div>

        {mode === 'upload' ? (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                stageFiles(e.dataTransfer.files);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center transition-colors hover:bg-muted/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: tint(MAROON.base, 0.08) }}>
                <Upload size={18} style={{ color: MAROON.light }} />
              </div>
              <p className="text-sm font-medium text-foreground">Click or drag files here</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, MP4, MOV, WebM · up to 250 MB each</p>
              <p className="text-[11px] text-muted-foreground/70">
                Videos autoplay muted &amp; looping on the public homepage — keep them short.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => stageFiles(e.target.files)}
            />

            {stagedFiles.map((entry, index) => (
              <div key={`${entry.file.name}-${index}`} className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {entry.file.type.startsWith('video')
                      ? <Video size={12} className="shrink-0 text-muted-foreground" />
                      : <ImageIcon size={12} className="shrink-0 text-muted-foreground" />}
                    <span className="truncate text-xs font-medium text-foreground">{entry.file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStagedFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${entry.file.name}`}
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Title (optional)"
                    value={entry.title}
                    onChange={(e) => updateMeta(index, 'title', e.target.value)}
                    className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]"
                  />
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={entry.caption}
                    onChange={(e) => updateMeta(index, 'caption', e.target.value)}
                    className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]"
                  />
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Already uploaded the file directly in Immich? Paste its asset ID here instead of re-uploading it.
            </p>
            <div>
              <label htmlFor="immich-asset-id" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Immich Asset ID
              </label>
              <input
                id="immich-asset-id"
                type="text"
                value={immichId}
                onChange={(e) => setImmichId(e.target.value)}
                placeholder="UUID from Immich"
                className={cn(inputClass, 'font-mono')}
              />
            </div>
            <div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Media Type</span>
              <div className="flex gap-4">
                {['image', 'video'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setImmichType(value)}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <span
                      className={cn(
                        'h-4 w-4 rounded-full border-2 transition-colors',
                        immichType === value ? 'border-transparent' : 'border-border',
                      )}
                      style={immichType === value ? { background: MAROON.gradient } : undefined}
                    />
                    {value === 'image' ? 'Image' : 'Video'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="immich-title" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Title (optional)
                </label>
                <input id="immich-title" type="text" value={immichTitle} onChange={(e) => setImmichTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="immich-caption" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Caption (optional)
                </label>
                <input id="immich-caption" type="text" value={immichCaption} onChange={(e) => setImmichCaption(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
            <AlertTriangle size={12} /> {error}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ background: MAROON.gradient }}
        >
          {submitting && <Loader2 size={13} className="animate-spin" />}
          {submitting
            ? 'Saving…'
            : mode === 'upload'
              ? `Upload ${stagedFiles.length || ''} file${stagedFiles.length !== 1 ? 's' : ''}`
              : 'Register asset'}
        </button>
      </div>
    </ModalWrapper>
  );
}

function EditMetaModal({ photo, onClose, onSave }) {
  const MAROON = useAccentPalette();
  const [title, setTitle] = useState(photo.title ?? '');
  const [caption, setCaption] = useState(photo.caption ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      await onSave(title.trim() || null, caption.trim() || null);
      onClose();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not save those changes.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]';

  return (
    <ModalWrapper onClose={onClose} label="Edit media info" maxWidth="max-w-sm">
      <ModalHeader title="Edit Info" icon={<Pencil size={13} />} onClose={onClose} />
      <div className="space-y-4 p-5">
        <div>
          <label htmlFor="edit-title" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</label>
          <input id="edit-title" autoFocus type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional title" className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-caption" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caption</label>
          <textarea
            id="edit-caption"
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            className={cn(inputClass, 'resize-y')}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">Clearing a field removes it from the homepage entirely.</p>
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
            <AlertTriangle size={12} /> {error}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: MAROON.gradient }}
        >
          {submitting && <Loader2 size={13} className="animate-spin" />}
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </ModalWrapper>
  );
}

function GalleryCard({
  photo, index, selected, onSelect, onEdit, onRemove, onMoveUp, onMoveDown,
  isDragging, isDropTarget, onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const MAROON = useAccentPalette();
  const [hovered, setHovered] = useState(false);
  const showOverlay = hovered || selected;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card transition-all',
        isDragging && 'scale-95 border-dashed opacity-50',
        isDropTarget && !isDragging && 'ring-2 ring-offset-2 ring-offset-background',
        !isDragging && 'border-border hover:shadow-md',
      )}
      style={isDropTarget && !isDragging ? { '--tw-ring-color': MAROON.light } : undefined}
    >
      {/* 300x224 landscape ratio — matches the public homepage strip. */}
      <div className="relative aspect-[300/224] w-full overflow-hidden bg-muted">
        {photo.media_type === 'video' ? (
          <div className="relative h-full w-full">
            {/* preload="none" — the media endpoint serves full-size originals. */}
            <video
              src={photoMediaUrl(photo.id)}
              className="h-full w-full object-cover"
              muted
              playsInline
              loop
              preload="none"
              onMouseEnter={(e) => { const p = e.currentTarget.play(); if (p) p.catch(() => {}); }}
              onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
            />
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              <Play size={8} fill="currentColor" />
              VIDEO
            </div>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoMediaUrl(photo.id)}
            alt={photo.title || 'Gallery photo'}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}

        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[10px] font-bold text-white backdrop-blur-sm">
          {index + 1}
        </div>

        {showOverlay && (
          <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onSelect}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-white backdrop-blur-sm hover:bg-white/40"
                aria-label={selected ? `Deselect item ${index + 1}` : `Select item ${index + 1}`}
              >
                {selected ? <CheckSquare size={13} /> : <Square size={13} />}
              </button>
              <span className="cursor-grab rounded-md bg-white/20 p-1 text-white backdrop-blur-sm" aria-hidden="true">
                <GripVertical size={13} />
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <button type="button" onClick={onMoveUp} className="rounded-md bg-white/20 p-1 text-white backdrop-blur-sm hover:bg-white/40" aria-label={`Move item ${index + 1} earlier`}>
                <ChevronLeft size={13} />
              </button>
              <button type="button" onClick={onMoveDown} className="rounded-md bg-white/20 p-1 text-white backdrop-blur-sm hover:bg-white/40" aria-label={`Move item ${index + 1} later`}>
                <ChevronRight size={13} />
              </button>
              <button type="button" onClick={onEdit} className="rounded-md bg-white/20 p-1 text-white backdrop-blur-sm hover:bg-white/40" aria-label={`Edit item ${index + 1}`}>
                <Pencil size={13} />
              </button>
              <button type="button" onClick={onRemove} className="rounded-md bg-red-600/70 p-1 text-white backdrop-blur-sm hover:bg-red-600" aria-label={`Remove item ${index + 1}`}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {(photo.title || photo.caption) && (
        <div className="px-3 py-2">
          {photo.title && <p className="truncate text-xs font-semibold text-foreground">{photo.title}</p>}
          {photo.caption && <p className="truncate text-[11px] text-muted-foreground">{photo.caption}</p>}
        </div>
      )}
      <div className="px-3 pb-2">
        <p className="text-[10px] text-muted-foreground/60">{timeAgo(photo.created_at)}</p>
      </div>
    </div>
  );
}

function HomepagePreviewStrip({ photos }) {
  const MAROON = useAccentPalette();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(MAROON.base, 0.03) }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: MAROON.gradient }}>
            <LayoutTemplate size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Live Homepage Preview</p>
            <p className="text-[11px] text-muted-foreground">Matches the scroll strip visitors see at ugaktp.com</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {collapsed ? <><ChevronDown size={13} /> Show</> : <><ChevronUp size={13} /> Collapse</>}
        </button>
      </div>

      {/* Media elements only mount while expanded — this endpoint serves
          full-size originals, so a collapsed strip must not fetch anything. */}
      {!collapsed && (
        <div className="p-5">
          <div className="mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Chapter Gallery</p>
            <p className="font-serif text-lg font-normal text-foreground">A look at life in Phi Chapter</p>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {photos.length === 0 ? (
                <div className="flex h-[224px] w-[300px] items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                  No items yet
                </div>
              ) : (
                photos.map((photo, index) => (
                  <div key={photo.id} className="relative shrink-0 overflow-hidden rounded-xl" style={{ width: 300, height: 224 }}>
                    {photo.media_type === 'video' ? (
                      <video
                        src={photoMediaUrl(photo.id)}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        loop
                        preload="none"
                        onMouseEnter={(e) => { const p = e.currentTarget.play(); if (p) p.catch(() => {}); }}
                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                      />
                    ) : (
                      // Identical src to the grid card below, so this is a
                      // browser cache hit rather than a second full download.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoMediaUrl(photo.id)}
                        alt={photo.title || ''}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-[9px] font-bold text-white">
                      {index + 1}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {photos.length > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {photos.length} item{photos.length !== 1 ? 's' : ''} · scroll to see all
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomepagePhotoManager() {
  const MAROON = useAccentPalette();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  useEffect(() => {
    load({ initial: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load({ initial = false } = {}) {
    if (!initial) setRefreshing(true);
    setError('');
    try {
      const data = await getHomepagePhotos();
      setPhotos(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load homepage photos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const stats = useMemo(() => {
    const newest = [...photos].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
    return {
      total: photos.length,
      images: photos.filter((p) => p.media_type === 'image').length,
      videos: photos.filter((p) => p.media_type === 'video').length,
      lastAdded: newest ? timeAgo(newest.created_at) : '—',
    };
  }, [photos]);

  // Optimistically applies a new order, then reconciles with the server. On
  // failure it refetches rather than trusting local state — the same recovery
  // the pre-revamp page used.
  async function persistOrder(nextPhotos) {
    const previous = photos;
    setPhotos(nextPhotos);
    setBusy(true);
    setError('');
    try {
      await reorderHomepagePhotos(nextPhotos.map((p) => p.id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setPhotos(previous);
      setError(err.message ?? 'Failed to save the new order');
      load();
    } finally {
      setBusy(false);
    }
  }

  function moveItem(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next);
  }

  function handleDrop(index) {
    const from = dragIndex;
    setDragIndex(null);
    setOverIndex(null);
    if (from === null || from === index) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    persistOrder(next);
  }

  async function handleUpload(stagedFiles) {
    // ktp-api takes one file per request, so this fans out — matching how the
    // Files & Photos batch upload already works. Any failure aborts the rest
    // and surfaces the real message.
    for (const entry of stagedFiles) {
      const formData = new FormData();
      formData.append('file', entry.file);
      if (entry.title.trim()) formData.append('title', entry.title.trim());
      if (entry.caption.trim()) formData.append('caption', entry.caption.trim());
      await uploadHomepagePhoto(formData);
    }
    await load();
  }

  async function handleRegisterImmich(data) {
    await registerHomepagePhoto(data);
    await load();
  }

  async function handleSaveMeta(id, title, caption) {
    const updated = await updateHomepagePhoto(id, { title, caption });
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setBusy(true);
    setError('');
    try {
      await removeHomepagePhoto(removeTarget.id);
      setPhotos((prev) => prev.filter((p) => p.id !== removeTarget.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(removeTarget.id);
        return next;
      });
      setRemoveTarget(null);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to remove that item');
      setRemoveTarget(null);
    } finally {
      setBusy(false);
    }
  }

  async function bulkRemove() {
    setBusy(true);
    setError('');
    const ids = [...selected];
    const failed = [];
    for (const id of ids) {
      try {
        await removeHomepagePhoto(id);
      } catch (err) {
        if (isRedirectError(err)) throw err;
        failed.push(id);
      }
    }
    if (failed.length) {
      setError(`${failed.length} of ${ids.length} item${ids.length !== 1 ? 's' : ''} could not be removed.`);
    }
    setSelected(new Set());
    setShowBulkConfirm(false);
    setBusy(false);
    await load();
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = photos.length > 0 && selected.size === photos.length;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: MAROON.light }}>
            Admin Panel
          </p>
          <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">Homepage Photos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage what appears in the public gallery on the chapter homepage</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load()}
            disabled={refreshing || busy}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : undefined} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-85"
            style={{ background: MAROON.gradient }}
          >
            <Plus size={14} /> Add media
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total items', value: stats.total, icon: Layers },
          { label: 'Images', value: stats.images, icon: ImageIcon },
          { label: 'Videos', value: stats.videos, icon: Video },
          { label: 'Last added', value: stats.lastAdded, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="h-0.5 w-full" style={{ background: MAROON.gradient }} />
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-xl font-bold leading-tight text-foreground">{value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: MAROON.gradient }}>
                <Icon size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <HomepagePreviewStrip photos={photos} />
      </div>

      {selected.size > 0 && (
        <div
          className="mb-4 flex items-center justify-between rounded-2xl border px-4 py-3"
          style={{ background: tint(MAROON.base, 0.04), borderColor: tint(MAROON.base, 0.2) }}
        >
          <p className="text-sm font-medium text-foreground">
            {selected.size} item{selected.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground">
              Deselect all
            </button>
            <button
              type="button"
              onClick={() => setShowBulkConfirm(true)}
              disabled={busy}
              className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-40"
            >
              <Trash2 size={11} /> Remove
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">
            {photos.length} item{photos.length !== 1 ? 's' : ''}
          </p>
          {photos.length > 0 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <button
                type="button"
                onClick={() => setSelected(allSelected ? new Set() : new Set(photos.map((p) => p.id)))}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </>
          )}
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">Drag cards to reorder · hover for actions</p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading gallery…
        </div>
      ) : photos.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card">
          <ImageIcon size={26} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No homepage photos yet — add one with the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <GalleryCard
              key={photo.id}
              photo={photo}
              index={index}
              selected={selected.has(photo.id)}
              onSelect={() => toggleSelect(photo.id)}
              onEdit={() => setEditTarget(photo)}
              onRemove={() => setRemoveTarget(photo)}
              onMoveUp={() => moveItem(index, -1)}
              onMoveDown={() => moveItem(index, 1)}
              isDragging={dragIndex === index}
              isDropTarget={overIndex === index}
              onDragStart={() => setDragIndex(index)}
              onDragOver={() => setOverIndex(index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddMediaModal
          onClose={() => setShowAddModal(false)}
          onUpload={handleUpload}
          onRegisterImmich={handleRegisterImmich}
        />
      )}

      {editTarget && (
        <EditMetaModal
          photo={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(title, caption) => handleSaveMeta(editTarget.id, title, caption)}
        />
      )}

      {removeTarget && (
        <ConfirmModal
          title="Remove from homepage?"
          body={(
            <span>
              <span className="font-medium text-foreground">{removeTarget.title || 'This item'}</span>{' '}
              will be removed from the public gallery.{' '}
              <span className="font-semibold text-foreground">The file stays in Immich — it is not deleted.</span>{' '}
              You can re-add it at any time.
            </span>
          )}
          confirmLabel="Remove"
          busy={busy}
          onClose={() => setRemoveTarget(null)}
          onConfirm={confirmRemove}
        />
      )}

      {showBulkConfirm && (
        <ConfirmModal
          title={`Remove ${selected.size} item${selected.size !== 1 ? 's' : ''}?`}
          body={(
            <span>
              They&apos;ll be removed from the homepage.{' '}
              <span className="font-semibold text-foreground">Files stay in Immich — nothing is deleted.</span>
            </span>
          )}
          confirmLabel="Remove all"
          busy={busy}
          onClose={() => setShowBulkConfirm(false)}
          onConfirm={bulkRemove}
        />
      )}
    </div>
  );
}
