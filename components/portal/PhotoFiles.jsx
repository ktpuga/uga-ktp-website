'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, Plus, Trash2, Download, X, Search, ImageIcon, FileText, FileIcon,
  Link2, ExternalLink, FolderIcon, FolderOpen, Upload, Film, ChevronRight, AlertCircle, Lock,
} from 'lucide-react';
import {
  getPhotos, getAlbums, getGeneralAlbumStats, createAlbum, deleteAlbum, uploadPhoto, deletePhoto,
  getDocumentFolders, getDocuments, createDocumentFolder, deleteDocumentFolder,
  uploadDocument, createDocumentLink, deleteDocument,
  setAlbumVisibility, setFolderVisibility, setDocumentVisibility,
} from '@/lib/portal-api';
import { formatPhotoDate } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import VisibilityControl from '@/components/portal/VisibilityControl';
import { useConfirm } from '@/components/ui/confirm-dialog';
import PhotoMedia from './PhotoMedia';
import ReportButton from './ReportButton';
import { PALETTES } from '@/components/portal/PortalAccentContext';

// Palette comes from PortalAccentContext, the single source of truth. Each of
// these files used to carry its own ACCENT_THEMES copy; they had already
// drifted (MemberDirectory was missing 'red' entirely, and every copy still
// had a real teal that nothing rendered — pledge passes 'blue').

const GENERAL_ALBUM = { id: null, name: 'Shared Album', description: 'General chapter photos, open to everyone', isShared: true };

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewable(mimeType) {
  return mimeType?.startsWith('image/') || mimeType === 'application/pdf';
}

function FileTypeIcon({ mimeType, size = 16, style }) {
  if (mimeType?.startsWith('image/')) return <ImageIcon size={size} style={style} />;
  if (mimeType === 'application/pdf') return <FileText size={size} style={style} />;
  return <FileIcon size={size} style={style} />;
}

// ─── Shared: page header + tab bar ───

function PageHeader({ title, description, accent }) {
  return (
    <div className="mb-7">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>Chapter Overview</p>
      <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

function TabBar({ active, onChange, accent }) {
  const tabs = [{ id: 'albums', label: 'Albums' }, { id: 'documents', label: 'Documents' }];
  return (
    <div className="relative mb-6 flex items-center gap-1 border-b border-border">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn('relative px-4 pb-3 pt-1 text-sm font-medium transition-colors duration-150', isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
            role="tab"
            aria-selected={isActive}
          >
            {tab.label}
            {isActive && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ background: accent.base }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Shared modal primitives ───

function ModalWrapper({ children, onClose, label, maxWidth = 'max-w-sm' }) {
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className={cn('relative z-10 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl', maxWidth)}>{children}</div>
    </div>
  );
}

function ModalHeader({ accent, title, icon, onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent.gradient }}>{icon}</div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
        <X size={14} />
      </button>
    </div>
  );
}

function ModalFooter({ accent, onClose, onConfirm, confirmLabel, disabled }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
      <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        style={{ background: accent.gradient }}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function FieldInput(props) {
  const { accent, ...rest } = props;
  return (
    <input
      {...rest}
      className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
      style={{ '--tw-ring-color': tint(accent.base, 0.3) }}
      onFocus={(e) => { e.currentTarget.style.borderColor = tint(accent.base, 0.4); }}
      onBlur={(e) => { e.currentTarget.style.borderColor = ''; }}
    />
  );
}

// ─── Albums tab ───

// djb2 — deterministic, dependency-free. Every visual property of an empty
// album's cover is derived from this, so the same album always looks identical
// on every render, device and reload. Nothing here may use Math.random().
function djb2(value) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
    hash >>>= 0;
  }
  return hash;
}

function seedValues(id, count) {
  return Array.from({ length: count }, (_, i) => djb2(`${id}:${i}`));
}

// The general shared album is synthetic (id: null) and never comes from the
// API, so hashing its id would seed every render from the string "null".
// A stable literal keeps it distinct and consistent instead.
function coverSeed(album) {
  return album.isShared || album.id == null ? 'shared-album' : String(album.id);
}

function thumbUrl(photoId) {
  return `/api/photos/${photoId}/media?size=thumbnail`;
}

// Empty-album cover. Four motifs, a full 0–359° hue wheel, a rotation and a
// spacing — all seeded from the album id, so no two albums collide visually
// and a brand-new album looks intentional on day one with zero configuration.
function GenerativePattern({ album, accent }) {
  const seed = coverSeed(album);
  const [s0, s1, s2, s3] = seedValues(seed, 4);

  const hue = s0 % 360;
  const motif = s1 % 4;
  const angleDeg = (s2 % 40) - 20 + 45;
  const spacing = 12 + (s3 % 8) * 3;

  // React's useId is unique per mounted instance, which matters because two
  // cards for the same album (grid + detail header) would otherwise emit
  // duplicate SVG pattern ids. The colons it contains are invalid inside a
  // url(#...) reference, hence the strip.
  const patternId = `album-pattern-${useId().replace(/:/g, '')}`;
  const stroke = accent.base;
  const strokeOpacity = 0.18;
  const width = 1.2;

  let motifEl;
  if (motif === 0) {
    motifEl = (
      <pattern id={patternId} width={spacing} height={spacing} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angleDeg})`}>
        <line x1={0} y1={0} x2={0} y2={spacing} stroke={stroke} strokeWidth={width} strokeOpacity={strokeOpacity} />
      </pattern>
    );
  } else if (motif === 1) {
    motifEl = (
      <pattern id={patternId} width={spacing} height={spacing} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angleDeg})`}>
        <line x1={0} y1={0} x2={0} y2={spacing} stroke={stroke} strokeWidth={width} strokeOpacity={strokeOpacity} />
        <line x1={0} y1={0} x2={spacing} y2={0} stroke={stroke} strokeWidth={width} strokeOpacity={strokeOpacity} />
      </pattern>
    );
  } else if (motif === 2) {
    motifEl = (
      <pattern id={patternId} width={spacing} height={spacing} patternUnits="userSpaceOnUse">
        <circle cx={spacing / 2} cy={spacing / 2} r={1.4} fill={stroke} fillOpacity={strokeOpacity * 1.6} />
      </pattern>
    );
  } else {
    motifEl = (
      <pattern id={patternId} width={spacing} height={spacing} patternUnits="userSpaceOnUse">
        <circle cx={0} cy={0} r={spacing * 0.35} fill="none" stroke={stroke} strokeWidth={width * 0.9} strokeOpacity={strokeOpacity} />
        <circle cx={0} cy={0} r={spacing * 0.65} fill="none" stroke={stroke} strokeWidth={width * 0.5} strokeOpacity={strokeOpacity * 0.7} />
        <circle cx={spacing} cy={spacing} r={spacing * 0.35} fill="none" stroke={stroke} strokeWidth={width * 0.9} strokeOpacity={strokeOpacity} />
        <circle cx={spacing} cy={spacing} r={spacing * 0.65} fill="none" stroke={stroke} strokeWidth={width * 0.5} strokeOpacity={strokeOpacity * 0.7} />
      </pattern>
    );
  }

  return (
    // `relative` lives here rather than being inherited from a parent, so the
    // absolutely-positioned SVG anchors correctly wherever this is mounted.
    <div
      className="relative h-full w-full"
      style={{ background: `linear-gradient(135deg, hsl(${hue},38%,82%) 0%, hsl(${(hue + 25) % 360},30%,75%) 100%)` }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
        <defs>{motifEl}</defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* The HSL wash is deliberately light; without this it glares as a bright
          block in dark mode. Darkening here keeps one gradient definition
          rather than branching the whole colour calculation on theme. */}
      <div className="pointer-events-none absolute inset-0 hidden bg-black/55 dark:block" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm"
          style={{ background: tint(accent.base, 0.18), border: `1px solid ${tint(accent.base, 0.25)}` }}
        >
          <ImageIcon size={16} style={{ color: accent.base }} strokeWidth={1.5} />
        </div>
        <p
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ background: tint(accent.base, 0.12), color: accent.light }}
        >
          Empty album
        </p>
      </div>
    </div>
  );
}

// 1–4 recent images, laid out per count so each arrangement looks deliberate
// rather than like a grid that ran out of cells.
function CollageThumbnail({ ids }) {
  const tile = (id) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumbUrl(id)} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
  );

  if (ids.length === 1) {
    return <div className="h-full w-full overflow-hidden">{tile(ids[0])}</div>;
  }

  if (ids.length === 2) {
    return (
      <div className="flex h-full w-full gap-px">
        <div className="flex-1 overflow-hidden">{tile(ids[0])}</div>
        <div className="flex-1 overflow-hidden">{tile(ids[1])}</div>
      </div>
    );
  }

  if (ids.length === 3) {
    return (
      <div className="flex h-full w-full gap-px">
        <div className="flex-[2] overflow-hidden">{tile(ids[0])}</div>
        <div className="flex flex-1 flex-col gap-px">
          <div className="flex-1 overflow-hidden">{tile(ids[1])}</div>
          <div className="flex-1 overflow-hidden">{tile(ids[2])}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-2 gap-px">
      {ids.slice(0, 4).map((id) => (
        <div key={id} className="overflow-hidden">{tile(id)}</div>
      ))}
    </div>
  );
}

function AlbumCard({ album, accent, isEboard, onOpen, onDelete, onEditVisibility }) {
  const coverIds = Array.isArray(album.cover_photo_ids) ? album.cover_photo_ids : [];
  // photo_count counts ALL media while cover_photo_ids is images only, so a
  // video-only album correctly reads "3 items" over a generated pattern. The
  // synthetic shared album has no count at all, hence the type check.
  const hasCount = typeof album.photo_count === 'number';

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md cursor-pointer"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      aria-label={`Open ${album.name}`}
    >
      <div className="relative aspect-video w-full overflow-hidden" style={{ background: tint(accent.base, 0.07) }}>
        {coverIds.length > 0 ? (
          <>
            <CollageThumbnail ids={coverIds} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <GenerativePattern album={album} accent={accent} />
        )}

        {hasCount && (
          <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {album.photo_count === 0 ? 'Empty' : `${album.photo_count} item${album.photo_count !== 1 ? 's' : ''}`}
          </div>
        )}

        {/* Always visible, not hover-only: a restricted album looks exactly
            like an open one otherwise, and eboard needs to see at a glance
            which albums the chapter can't see. */}
        {isRestricted(album) && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            <Lock size={9} /> Restricted
          </div>
        )}

        {isEboard && !album.isShared && (
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEditVisibility(); }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              aria-label={`Change who can see ${album.name}`}
            >
              <Lock size={11} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-destructive"
              aria-label={`Delete ${album.name}`}
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
      <div className="px-4 py-3">
        <p className="truncate text-sm font-semibold text-foreground">{album.name}</p>
        {album.isShared ? (
          <p className="text-[11px] text-muted-foreground">General shared album</p>
        ) : album.description ? (
          <p className="line-clamp-1 text-[11px] text-muted-foreground">{album.description}</p>
        ) : null}
      </div>
    </div>
  );
}

// True when eboard has restricted this row. Albums and folders normalise an
// empty audience to NULL, so any non-empty array means restricted. A DOCUMENT
// uses overrides_folder instead: a document with no audience of its own is
// inheriting, which may well be stricter than "everyone", so the absence of an
// audience says nothing about whether it's restricted.
function isRestricted(item) {
  if (item.overrides_folder !== undefined && !item.overrides_folder) return false;
  return (item.audience?.length ?? 0) > 0 || (item.committee_ids?.length ?? 0) > 0;
}

// One modal for all three kinds. `kind` picks both the save call and the
// semantics of an empty selection — see VisibilityControl.
function EditVisibilityModal({ kind, item, accent, onClose, onSaved }) {
  const [value, setValue] = useState({
    // A document that isn't overriding is inheriting; albums and folders have
    // nothing to inherit from, so the toggle never shows for them.
    inherit: kind === 'document' ? !item.overrides_folder : false,
    audience: item.audience ?? [],
    committeeIds: (item.committee_ids ?? []).map(String),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    try {
      const updated =
        kind === 'album'
          ? await setAlbumVisibility(item.id, value)
          : kind === 'folder'
            ? await setFolderVisibility(item.id, value)
            : await setDocumentVisibility(item.id, value);
      onSaved(updated);
      onClose();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not update visibility.');
      setSaving(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose} label="Edit visibility" maxWidth="max-w-md">
      <ModalHeader accent={accent} title={`Who can see "${item.name ?? item.filename}"`} icon={<Lock size={14} strokeWidth={1.75} />} onClose={onClose} />
      <div className="max-h-[70vh] overflow-y-auto p-5">
        <VisibilityControl
          inheritable={kind === 'document'}
          value={value}
          onChange={setValue}
        />
        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-destructive">
            <AlertCircle size={11} /> {error}
          </p>
        )}
      </div>
      <ModalFooter accent={accent} onClose={onClose} onConfirm={save} confirmLabel={saving ? 'Saving…' : 'Save'} disabled={saving} />
    </ModalWrapper>
  );
}

function NewAlbumModal({ accent, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  // Defaults to unrestricted, matching how every album behaved before
  // visibility existed. Restricting has to be a deliberate act.
  const [visibility, setVisibility] = useState({ inherit: false, audience: [], committeeIds: [] });
  return (
    <ModalWrapper onClose={onClose} label="New album">
      <ModalHeader accent={accent} title="New Album" icon={<ImageIcon size={14} strokeWidth={1.75} />} onClose={onClose} />
      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
        <FormField label="Album Name">
          <FieldInput accent={accent} autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring Formal 2026" />
        </FormField>
        <FormField label="Description (optional)">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            placeholder="A brief description…"
            className="w-full resize-none rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': tint(accent.base, 0.3) }}
          />
        </FormField>
        <FormField label="Who can see this">
          <VisibilityControl value={visibility} onChange={setVisibility} />
        </FormField>
      </div>
      <ModalFooter
        accent={accent}
        onClose={onClose}
        onConfirm={() => onCreate(name.trim(), desc.trim(), visibility)}
        confirmLabel="Create Album"
        disabled={!name.trim()}
      />
    </ModalWrapper>
  );
}

function StagedFileRow({ file, caption, accent, onCaptionChange, onRemove }) {
  const isVideo = file.type.startsWith('video/');
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: tint(accent.base, 0.08) }}>
        {isVideo ? <Film size={16} style={{ color: accent.light }} /> : <ImageIcon size={16} style={{ color: accent.light }} />}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
        <input
          type="text"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </div>
      <button type="button" onClick={onRemove} className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground" aria-label="Remove">
        <X size={13} />
      </button>
    </div>
  );
}

function AlbumDetail({ album, accent, isEboard, currentUserId, onBack }) {
  const confirm = useConfirm();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [stagedFiles, setStagedFiles] = useState([]);
  const [stagedCaptions, setStagedCaptions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getPhotos(album.id ?? undefined)
      .then(setPhotos)
      .catch((err) => { if (isRedirectError(err)) throw err; setError(err.message ?? 'Could not load photos'); })
      .finally(() => setLoading(false));
  }, [album.id]);

  const filtered = useMemo(() => {
    if (!search.trim()) return photos;
    const q = search.toLowerCase();
    return photos.filter((p) => (p.title ?? '').toLowerCase().includes(q) || (p.caption ?? '').toLowerCase().includes(q));
  }, [photos, search]);

  function stageFiles(fileList) {
    if (!fileList) return;
    const arr = Array.from(fileList);
    setStagedFiles((prev) => [...prev, ...arr]);
    setStagedCaptions((prev) => [...prev, ...arr.map(() => '')]);
  }

  function removeStagedFile(idx) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
    setStagedCaptions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUpload() {
    setUploading(true);
    try {
      const uploaded = await Promise.all(stagedFiles.map((file, i) => {
        const formData = new FormData();
        formData.append('file', file);
        if (album.id) formData.append('album_id', album.id);
        if (stagedCaptions[i].trim()) formData.append('caption', stagedCaptions[i].trim());
        return uploadPhoto(formData);
      }));
      setPhotos((prev) => [...uploaded.reverse(), ...prev]);
      setStagedFiles([]);
      setStagedCaptions([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to upload');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!(await confirm('Delete this photo? This cannot be undone.'))) return;
    try {
      await deletePhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete photo');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={onBack} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Back to albums">
          <ChevronLeft size={15} />
        </button>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground">{album.name}</h2>
          {album.description && <p className="text-xs text-muted-foreground">{album.description}</p>}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upload Photos / Videos</p>
        <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" className="sr-only" onChange={(e) => stageFiles(e.target.files)} />

        {stagedFiles.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = tint(accent.base, 0.35); }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
          >
            <Upload size={16} /> Click to select photos or videos
          </button>
        ) : (
          <div className="space-y-2">
            {stagedFiles.map((f, i) => (
              <StagedFileRow
                key={i}
                file={f}
                caption={stagedCaptions[i]}
                accent={accent}
                onCaptionChange={(v) => { const c = [...stagedCaptions]; c[i] = v; setStagedCaptions(c); }}
                onRemove={() => removeStagedFile(i)}
              />
            ))}
            <div className="flex items-center justify-between pt-1">
              <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: accent.light }}>+ Add more</button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ background: accent.gradient }}
              >
                <Upload size={12} /> {uploading ? 'Uploading…' : `Upload ${stagedFiles.length} file${stagedFiles.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="relative mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or caption…"
          className="w-full rounded-xl border border-border bg-card py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-sm focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': tint(accent.base, 0.25) }}
        />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading photos…</p>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card">
          <ImageIcon size={26} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{search ? 'No results' : 'No photos or videos yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((photo) => (
            <MediaCard
              key={photo.id}
              photo={photo}
              accent={accent}
              isEboard={isEboard}
              currentUserId={currentUserId}
              onOpen={() => setLightboxPhoto(photo)}
              onDelete={() => handleDelete(photo.id)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 px-1">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: accent.light }} aria-hidden="true" />
        <p className="text-xs text-muted-foreground">{photos.length} item{photos.length !== 1 ? 's' : ''} in album</p>
      </div>

      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          accent={accent}
          isEboard={isEboard}
          currentUserId={currentUserId}
          onClose={() => setLightboxPhoto(null)}
          onDelete={() => { handleDelete(lightboxPhoto.id); setLightboxPhoto(null); }}
        />
      )}
    </div>
  );
}

function MediaCard({ photo, accent, isEboard, currentUserId, onOpen, onDelete }) {
  const canDelete = photo.uploaded_by === currentUserId || isEboard;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="relative aspect-square cursor-pointer overflow-hidden"
        style={{ background: tint(accent.base, 0.06) }}
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
        aria-label={`View ${photo.title || 'media'}`}
      >
        <PhotoMedia photo={photo} />
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
      </div>

      <div className="px-3 py-2.5">
        {photo.title && <p className="truncate text-xs font-semibold text-foreground">{photo.title}</p>}
        {photo.caption && <p className="line-clamp-1 text-[11px] text-muted-foreground">{photo.caption}</p>}
        <div className="mt-1.5 flex items-center justify-between gap-1">
          <p className="text-[10px] text-muted-foreground">{photo.created_at ? formatPhotoDate(photo.created_at) : ''}</p>
          <div className="flex items-center gap-1">
            <a
              href={`/api/photos/${photo.id}/media`}
              download={photo.title || `photo-${photo.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Download"
            >
              <Download size={11} />
            </a>
            {photo.uploaded_by && photo.uploaded_by !== currentUserId && (
              <ReportButton
                contentType="photo"
                contentId={photo.id}
                reportedUserId={photo.uploaded_by}
                className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              />
            )}
            {canDelete && (
              <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-destructive" aria-label="Delete">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
        {photo.uploaded_by_name && <p className="mt-0.5 text-[10px] text-muted-foreground">Added by {photo.uploaded_by_name}</p>}
      </div>
    </div>
  );
}

function Lightbox({ photo, accent, isEboard, currentUserId, onClose, onDelete }) {
  const canDelete = photo.uploaded_by === currentUserId || isEboard;

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={photo.title || 'Media viewer'}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-black shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            {photo.title && <p className="truncate text-sm font-semibold text-white">{photo.title}</p>}
            {photo.uploaded_by_name && <p className="text-[11px] text-white/60">Added by {photo.uploaded_by_name}{photo.created_at ? ` · ${formatPhotoDate(photo.created_at)}` : ''}</p>}
          </div>
          <div className="ml-4 flex shrink-0 items-center gap-2">
            <a href={`/api/photos/${photo.id}/media`} download={photo.title || `photo-${photo.id}`} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20" aria-label="Download">
              <Download size={13} />
            </a>
            {photo.uploaded_by && photo.uploaded_by !== currentUserId && (
              <ReportButton
                contentType="photo"
                contentId={photo.id}
                reportedUserId={photo.uploaded_by}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-destructive/70"
              />
            )}
            {canDelete && (
              <button type="button" onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-destructive/70" aria-label="Delete">
                <Trash2 size={13} />
              </button>
            )}
            <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20" aria-label="Close">
              <X size={13} />
            </button>
          </div>
        </div>

        <div className="relative flex max-h-[70vh] items-center justify-center bg-black/50">
          {photo.media_type === 'video' ? (
            <video src={`/api/photos/${photo.id}/media`} controls autoPlay className="max-h-[70vh] w-full" />
          ) : (
            <img src={`/api/photos/${photo.id}/media`} alt={photo.title || ''} className="max-h-[70vh] w-full object-contain" />
          )}
        </div>

        {photo.caption && (
          <div className="px-4 py-3">
            <p className="text-sm text-white/80">{photo.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AlbumsTab({ accent, isEboard, currentUserId }) {
  const confirm = useConfirm();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [visibilityFor, setVisibilityFor] = useState(null);

  const [generalStats, setGeneralStats] = useState(null);

  useEffect(() => {
    getAlbums()
      .then(setAlbums)
      .catch((err) => { if (isRedirectError(err)) throw err; setError(err.message ?? 'Could not load albums'); })
      .finally(() => setLoading(false));

    // Separate call because the shared album isn't a row in `albums`. Failure
    // here only costs its thumbnail, so it must not surface as a page error or
    // block the album list from rendering.
    getGeneralAlbumStats()
      .then(setGeneralStats)
      .catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  const sorted = useMemo(
    () => [{ ...GENERAL_ALBUM, ...(generalStats ?? {}) }, ...albums],
    [albums, generalStats],
  );

  async function handleCreate(name, desc, visibility) {
    const album = await createAlbum(name, desc || undefined, visibility?.audience, visibility?.committeeIds);
    setAlbums((prev) => [album, ...prev]);
    setShowNewAlbum(false);
  }

  async function handleDelete(id) {
    if (!(await confirm('Delete this album? Its photos will move to the Shared Album, not be deleted.'))) return;
    try {
      await deleteAlbum(id);
      setAlbums((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete album');
    }
  }

  if (activeAlbum) {
    return <AlbumDetail album={activeAlbum} accent={accent} isEboard={isEboard} currentUserId={currentUserId} onBack={() => setActiveAlbum(null)} />;
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading albums…</p>;
  }

  if (error) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card">
        <AlertCircle size={26} className="text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{sorted.length} album{sorted.length !== 1 ? 's' : ''}</p>
        {isEboard && (
          <button type="button" onClick={() => setShowNewAlbum(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85" style={{ background: accent.gradient }}>
            <Plus size={12} /> New Album
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((album) => (
          <AlbumCard
            key={album.id ?? 'general'}
            album={album}
            accent={accent}
            isEboard={isEboard}
            onOpen={() => setActiveAlbum(album)}
            onDelete={() => handleDelete(album.id)}
            onEditVisibility={() => setVisibilityFor(album)}
          />
        ))}
      </div>

      {showNewAlbum && <NewAlbumModal accent={accent} onClose={() => setShowNewAlbum(false)} onCreate={handleCreate} />}
      {visibilityFor && (
        <EditVisibilityModal
          kind="album"
          item={visibilityFor}
          accent={accent}
          onClose={() => setVisibilityFor(null)}
          onSaved={(updated) => setAlbums((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)))}
        />
      )}
    </>
  );
}

// ─── Documents tab ───

function NewFolderModal({ accent, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState({ inherit: false, audience: [], committeeIds: [] });
  return (
    <ModalWrapper onClose={onClose} label="New folder">
      <ModalHeader accent={accent} title="New Folder" icon={<FolderIcon size={14} strokeWidth={1.75} />} onClose={onClose} />
      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
        <FormField label="Folder Name">
          <FieldInput
            accent={accent}
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fall 2026 Resources"
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onCreate(name.trim(), visibility); }}
          />
        </FormField>
        <FormField label="Who can see this">
          {/* A folder is hidden ENTIRELY when restricted, name included — a
              locked-but-listed folder called "Exec Only" leaks by itself. */}
          <VisibilityControl value={visibility} onChange={setVisibility} />
        </FormField>
      </div>
      <ModalFooter accent={accent} onClose={onClose} onConfirm={() => onCreate(name.trim(), visibility)} confirmLabel="Create Folder" disabled={!name.trim()} />
    </ModalWrapper>
  );
}

function AddLinkModal({ accent, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const valid = name.trim().length > 0 && url.trim().length > 0;
  return (
    <ModalWrapper onClose={onClose} label="Add link">
      <ModalHeader accent={accent} title="Add Link" icon={<Link2 size={14} strokeWidth={1.75} />} onClose={onClose} />
      <div className="space-y-4 p-5">
        <FormField label="Display Name">
          <FieldInput accent={accent} autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring Budget (Google Sheets)" />
        </FormField>
        <FormField label="URL">
          <FieldInput accent={accent} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/…" />
        </FormField>
      </div>
      <ModalFooter accent={accent} onClose={onClose} onConfirm={() => onAdd(name.trim(), url.trim())} confirmLabel="Add Link" disabled={!valid} />
    </ModalWrapper>
  );
}

function FilePreviewModal({ doc, accent, onClose }) {
  const canPreview = isPreviewable(doc.mime_type);
  const previewUrl = `/api/documents/${doc.id}/preview`;

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <ModalWrapper onClose={onClose} label={`Preview: ${doc.filename}`} maxWidth="max-w-3xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: tint(accent.base, 0.10) }}>
            <FileTypeIcon mimeType={doc.mime_type} size={15} style={{ color: 'var(--color-foreground)' }} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{doc.filename}</p>
            {doc.file_size != null && <p className="text-[11px] text-muted-foreground">{formatFileSize(doc.file_size)}</p>}
          </div>
        </div>
        <div className="ml-4 flex shrink-0 items-center gap-2">
          <a href={`/api/documents/${doc.id}/download`} download={doc.filename} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Download size={12} /> Download
          </a>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="p-5">
        {canPreview ? (
          doc.mime_type.startsWith('image/') ? (
            <img src={previewUrl} alt={doc.filename} className="mx-auto max-h-[60vh] rounded-xl object-contain" />
          ) : (
            <iframe src={previewUrl} title={doc.filename} className="h-[60vh] w-full rounded-xl border border-border" />
          )
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/30">
            <AlertCircle size={26} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Preview isn&apos;t available for this file type</p>
            <a href={`/api/documents/${doc.id}/download`} download={doc.filename} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: accent.gradient }}>
              <Download size={13} /> Download to view
            </a>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}

function DocRow({ doc, isFolder, accent, isEboard, onOpenFolder, onPreview, onDelete, onEditVisibility }) {
  const isLink = doc.kind === 'link';
  const isFile = doc.kind !== 'link' && !isFolder;

  function handleNameClick() {
    if (isFolder) onOpenFolder(doc);
    else if (isFile) onPreview(doc);
  }

  return (
    <tr className="group border-b border-border transition-colors last:border-b-0 hover:bg-muted/30">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: tint(accent.base, 0.07) }}>
            {isFolder ? (
              <FolderIcon size={18} style={{ color: accent.light }} />
            ) : isLink ? (
              <Link2 size={16} style={{ color: accent.light }} />
            ) : doc.mime_type?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/documents/${doc.id}/preview`} alt="" className="h-full w-full object-cover" />
            ) : (
              <FileTypeIcon mimeType={doc.mime_type} size={16} style={{ color: accent.light }} />
            )}
          </div>

          <div className="min-w-0">
            {isFolder || isFile ? (
              <button type="button" onClick={handleNameClick} className="truncate text-sm font-medium text-foreground transition-colors hover:underline" style={{ maxWidth: '28ch' }}>
                {doc.name ?? doc.filename}
              </button>
            ) : (
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 truncate text-sm font-medium transition-colors hover:underline" style={{ color: accent.light, maxWidth: '28ch' }}>
                {doc.filename}
                <ExternalLink size={11} className="shrink-0" />
              </a>
            )}
            {isLink && <p className="truncate text-[11px] text-muted-foreground" style={{ maxWidth: '28ch' }}>{doc.url}</p>}
          </div>
        </div>
      </td>

      <td className="hidden px-4 py-3 md:table-cell">
        {isFile && (
          <div>
            {doc.file_size != null && <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</p>}
            {doc.created_at && <p className="text-[11px] text-muted-foreground">{formatPhotoDate(doc.created_at)}</p>}
          </div>
        )}
        {isLink && doc.created_at && <p className="text-[11px] text-muted-foreground">{formatPhotoDate(doc.created_at)}</p>}
        {isFolder && doc.created_at && <p className="text-[11px] text-muted-foreground">{formatPhotoDate(doc.created_at)}</p>}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          {/* A restricted row is otherwise indistinguishable from an open one.
              For a DOCUMENT this reflects its own override only — an
              inheriting document inside a restricted folder is restricted in
              effect, but the folder is where that is shown and changed. */}
          {isRestricted(doc) && (
            <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground" title="Restricted">
              <Lock size={9} /> Restricted
            </span>
          )}
          {isEboard && (
            <button
              type="button"
              onClick={onEditVisibility}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Change who can see ${doc.name ?? doc.filename}`}
            >
              <Lock size={13} />
            </button>
          )}
          {isFile && (
            <a href={`/api/documents/${doc.id}/download`} download={doc.filename} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Download">
              <Download size={13} />
            </a>
          )}
          {isLink && (
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex h-7 items-center justify-center gap-1 rounded-lg border border-border bg-card px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Open link">
              <ExternalLink size={11} /> Open
            </a>
          )}
          {isEboard && !isFolder && (
            <button type="button" onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Delete">
              <Trash2 size={13} />
            </button>
          )}
          {isEboard && isFolder && (
            <button type="button" onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive" aria-label="Delete folder">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function DocumentsTab({ accent, isEboard }) {
  const confirm = useConfirm();
  const [path, setPath] = useState([]);
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [visibilityFor, setVisibilityFor] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const fileUploadRef = useRef(null);

  const currentFolderId = path.length ? path[path.length - 1].id : null;

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getDocumentFolders(currentFolderId), getDocuments(currentFolderId)])
      .then(([folderList, documentList]) => { setFolders(folderList); setDocuments(documentList); })
      .catch((err) => { if (isRedirectError(err)) throw err; setError('Could not load this folder'); })
      .finally(() => setLoading(false));
  }, [currentFolderId]);

  const sorted = useMemo(() => {
    const combined = [
      ...folders.map((f) => ({ ...f, kind: 'folder' })),
      ...documents,
    ];
    const folderRows = combined.filter((d) => d.kind === 'folder').sort((a, b) => a.name.localeCompare(b.name));
    const rest = combined.filter((d) => d.kind !== 'folder').sort((a, b) => a.filename.localeCompare(b.filename));
    return [...folderRows, ...rest];
  }, [folders, documents]);

  function openFolder(folder) {
    setPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }

  function navigateTo(index) {
    setPath((prev) => prev.slice(0, index + 1));
  }

  async function handleCreateFolder(name, visibility) {
    const folder = await createDocumentFolder(name, currentFolderId, visibility?.audience, visibility?.committeeIds);
    setFolders((prev) => [...prev, folder]);
    setShowNewFolder(false);
  }

  async function handleUploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    if (currentFolderId) formData.append('folder_id', currentFolderId);
    const result = await uploadDocument(formData);
    if (result?.error) { window.alert(result.error); return; }
    setDocuments((prev) => [result, ...prev]);
  }

  async function handleAddLink(name, url) {
    const doc = await createDocumentLink({ folderId: currentFolderId, filename: name, url });
    setDocuments((prev) => [doc, ...prev]);
    setShowAddLink(false);
  }

  async function handleDeleteFolder(id) {
    if (!(await confirm('Delete this folder and everything inside it? This cannot be undone.'))) return;
    try {
      await deleteDocumentFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert('Failed to delete folder');
    }
  }

  async function handleDeleteDocument(id) {
    if (!(await confirm('Delete this document? This cannot be undone.'))) return;
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert('Failed to delete document');
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Folder breadcrumb">
          <span className="flex items-center gap-1">
            {path.length === 0 ? (
              <span className="font-semibold text-foreground">Documents</span>
            ) : (
              <button type="button" onClick={() => setPath([])} className="font-medium text-muted-foreground transition-colors hover:text-foreground">Documents</button>
            )}
          </span>
          {path.map((entry, i) => {
            const isLast = i === path.length - 1;
            return (
              <span key={entry.id} className="flex items-center gap-1">
                <ChevronRight size={13} className="text-muted-foreground/60" />
                {isLast ? (
                  <span className="font-semibold text-foreground">{entry.name}</span>
                ) : (
                  <button type="button" onClick={() => navigateTo(i)} className="font-medium text-muted-foreground transition-colors hover:text-foreground">{entry.name}</button>
                )}
              </span>
            );
          })}
        </nav>

        {isEboard && (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowNewFolder(true)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <FolderIcon size={12} /> New Folder
            </button>
            <button type="button" onClick={() => fileUploadRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Upload size={12} /> Upload File
            </button>
            <input ref={fileUploadRef} type="file" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) handleUploadFile(e.target.files[0]); }} />
            <button type="button" onClick={() => setShowAddLink(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85" style={{ background: accent.gradient }}>
              <Link2 size={12} /> Add Link
            </button>
          </div>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : sorted.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <FolderOpen size={26} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">This folder is empty</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border" style={{ background: tint(accent.base, 0.03) }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Size / Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((doc) => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  isFolder={doc.kind === 'folder'}
                  accent={accent}
                  isEboard={isEboard}
                  onOpenFolder={openFolder}
                  onPreview={setPreviewDoc}
                  onDelete={() => (doc.kind === 'folder' ? handleDeleteFolder(doc.id) : handleDeleteDocument(doc.id))}
                  onEditVisibility={() => setVisibilityFor(doc)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 px-1">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: accent.light }} aria-hidden="true" />
        <p className="text-xs text-muted-foreground">{sorted.length} item{sorted.length !== 1 ? 's' : ''}</p>
      </div>

      {showNewFolder && <NewFolderModal accent={accent} onClose={() => setShowNewFolder(false)} onCreate={handleCreateFolder} />}
      {showAddLink && <AddLinkModal accent={accent} onClose={() => setShowAddLink(false)} onAdd={handleAddLink} />}
      {previewDoc && <FilePreviewModal doc={previewDoc} accent={accent} onClose={() => setPreviewDoc(null)} />}
      {visibilityFor && (
        <EditVisibilityModal
          kind={visibilityFor.kind === 'folder' ? 'folder' : 'document'}
          item={visibilityFor}
          accent={accent}
          onClose={() => setVisibilityFor(null)}
          onSaved={(updated) => {
            // Folders and documents live in two separate lists that the table
            // merges, so the update has to go back to whichever it came from.
            if (visibilityFor.kind === 'folder') {
              setFolders((prev) => prev.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)));
            } else {
              setDocuments((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
            }
          }}
        />
      )}
    </>
  );
}

// ─── Main revamped page ───

function RevampedPhotoFiles({ title, description, accentKey }) {
  const accent = PALETTES[accentKey] ?? PALETTES.blue;
  const { data: session } = useSession();
  const currentUserId = session?.user?.authentik_id;
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;
  const [activeTab, setActiveTab] = useState('albums');

  return (
    <div className="space-y-4">
      <PageHeader title={title} description={description} accent={accent} />
      <TabBar active={activeTab} onChange={setActiveTab} accent={accent} />
      {activeTab === 'albums' && <AlbumsTab accent={accent} isEboard={isEboard} currentUserId={currentUserId} />}
      {activeTab === 'documents' && <DocumentsTab accent={accent} isEboard={isEboard} />}
    </div>
  );
}

// Every portal passes blue, amber or red, so the pre-revamp variant this used
// to fall back to was unreachable and has been deleted. An unrecognised accent
// now renders the revamped UI with the blue palette (see the PALETTES
// lookup above), which is a better failure than a second copy of the whole UI
// that nobody maintains — two copies is what let the CircleCheck/BlockButton
// fix keep disappearing from one of them.
export default function PhotoFiles({ title, description, accent }) {
  return <RevampedPhotoFiles title={title} description={description} accentKey={accent} />;
}
