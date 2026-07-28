import { Images } from 'lucide-react';
import PhotoMedia from '@/components/portal/PhotoMedia';

// Real per-photo list — v0's version grouped by album with per-album counts,
// but the actual /photos API doesn't return album names or aggregate counts
// for free, so that would've meant fabricating data. This keeps the same
// visual treatment (thumbnail, rank badge) without inventing anything.
export default function PhotosTab({ photos, accentBase, accentGradient, accentMuted }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div aria-hidden="true" className="h-4 w-0.5 rounded-full" style={{ background: accentBase }} />
          <h3 className="text-sm font-semibold tracking-tight">Recent Uploads</h3>
        </div>
        <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: accentMuted, color: accentBase }}>
          {photos.length} shown
        </span>
      </div>

      {photos.length === 0 ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">No photos uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {photos.map((photo, i) => (
            <li key={photo.id} className="group flex items-center gap-5 px-6 py-4 transition-colors hover:bg-muted/40">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                <PhotoMedia photo={photo} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{photo.title || 'Untitled photo'}</p>
                <p className="mt-1 text-xs text-muted-foreground">{photo.dateLabel}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                <Images size={13} />
              </div>

              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ background: i === 0 ? accentGradient : 'var(--color-muted)', color: i === 0 ? '#fff' : 'var(--color-muted-foreground)' }}
              >
                {i + 1}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
