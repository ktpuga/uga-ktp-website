'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TEXT_LIMITS } from '@/lib/text-limits';
import { ACCEPTED_MEDIA, MEDIA_MAX, emptyLink } from '@/lib/announcement-form';
import { mediaSrc } from '@/components/portal/AnnouncementAttachments';

// The link rows and file picker inside an announcement composer.
//
// Shared by the main board's composer and the rush board's, for the reason
// stated on AnnouncementAttachments: two boards, one behaviour. The parent owns
// the state, because it is the parent that submits it.

// Object URLs have to be revoked or the page leaks a blob per file picked. Kept
// in a ref keyed by the File itself so re-renders reuse the same URL rather than
// minting a new one on every keystroke elsewhere in the form.
function useFilePreviews(files) {
  const urls = useRef(new Map());

  useEffect(() => {
    const map = urls.current;
    for (const [file, url] of map) {
      if (!files.includes(file)) {
        URL.revokeObjectURL(url);
        map.delete(file);
      }
    }
    return undefined;
  }, [files]);

  // Revoke everything on unmount, including the previews still in use.
  useEffect(() => {
    const map = urls.current;
    return () => {
      for (const url of map.values()) URL.revokeObjectURL(url);
      map.clear();
    };
  }, []);

  return (file) => {
    if (!urls.current.has(file)) urls.current.set(file, URL.createObjectURL(file));
    return urls.current.get(file);
  };
}

export default function AnnouncementComposerAttachments({
  links, onLinksChange,
  files, onFilesChange,
  existingMedia = [], onRemoveExisting,
  board = 'main',
  accent,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const previewFor = useFilePreviews(files);

  const total = existingMedia.length + files.length;

  function addFiles(picked) {
    setError('');
    const next = [...files, ...picked];
    if (existingMedia.length + next.length > MEDIA_MAX) {
      setError(`Up to ${MEDIA_MAX} photos or videos`);
      return;
    }
    onFilesChange(next);
  }

  function setLink(index, patch) {
    onLinksChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  }

  return (
    <div className="space-y-4">
      {/* ---------------- media ---------------- */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">Photos and videos</span>
          <span className="text-[10px] text-muted-foreground/70">{total} / {MEDIA_MAX}</span>
        </div>

        {(existingMedia.length > 0 || files.length > 0) && (
          <div className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {existingMedia.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-lg border border-border bg-muted">
                <img
                  src={mediaSrc(item, board, { size: 'thumbnail' })}
                  alt={item.filename ?? ''}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveExisting?.(item)}
                  disabled={disabled}
                  aria-label={`Remove ${item.filename ?? 'attachment'}`}
                  className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="group relative overflow-hidden rounded-lg border border-dashed border-border bg-muted">
                {file.type.startsWith('video/') ? (
                  <video src={previewFor(file)} className="aspect-square w-full object-cover" muted />
                ) : (
                  <img src={previewFor(file)} alt="" className="aspect-square w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => onFilesChange(files.filter((_, index) => index !== i))}
                  disabled={disabled}
                  aria-label={`Remove ${file.name}`}
                  className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_MEDIA}
          className="hidden"
          onChange={(e) => {
            addFiles([...e.target.files]);
            // Cleared so picking the same file twice in a row still fires
            // onChange — otherwise re-adding a file you just removed does
            // nothing and looks broken.
            e.target.value = '';
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || total >= MEDIA_MAX}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-40"
        >
          <ImagePlus size={14} /> Add photos or videos
        </button>

        {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
      </div>

      {/* ---------------- links ---------------- */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">Links</span>
          <span className="text-[10px] text-muted-foreground/70">
            {links.length} / {TEXT_LIMITS.ANNOUNCEMENT_LINK_COUNT}
          </span>
        </div>

        {links.length > 0 && (
          <div className="mb-2 space-y-2">
            {links.map((link, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                <input
                  type="text"
                  value={link.label}
                  maxLength={TEXT_LIMITS.ANNOUNCEMENT_LINK_LABEL}
                  onChange={(e) => setLink(i, { label: e.target.value })}
                  placeholder="What it is"
                  disabled={disabled}
                  className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)] sm:w-40"
                />
                <div className="relative min-w-0 flex-1">
                  <Link2 size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => setLink(i, { url: e.target.value })}
                    placeholder="https://"
                    disabled={disabled}
                    className="w-full rounded-lg border border-border bg-muted/40 py-2 pl-7 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onLinksChange(links.filter((_, index) => index !== i))}
                  disabled={disabled}
                  aria-label="Remove link"
                  className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onLinksChange([...links, emptyLink()])}
          disabled={disabled || links.length >= TEXT_LIMITS.ANNOUNCEMENT_LINK_COUNT}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40',
          )}
          style={{ borderColor: accent ? `${accent.base}33` : undefined }}
        >
          <Plus size={12} /> Add a link
        </button>
      </div>
    </div>
  );
}
