'use client';

import { useEffect, useState } from 'react';
import { Loader2, Lock, Globe, AlertTriangle } from 'lucide-react';
import AudienceSelect from '@/components/portal/AudienceSelect';
import { getCommittees } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';
import { cn } from '@/lib/utils';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { formatMemberGroup } from '@/lib/portal-format';

// Who can see an album, folder or document.
//
// Two shapes, because a document's rules genuinely differ from an album's:
//
//   inheritable={false}  (albums, folders) — no selection means EVERYONE.
//   inheritable={true}   (documents)       — no selection means INHERIT THE
//                                            FOLDER, which is not the same
//                                            thing and can be far stricter.
//
// That distinction is the whole reason a document needs an explicit
// Inherit/Custom toggle rather than a bare AudienceSelect: with a plain picker
// there is no way to express "follow the folder", and clearing the selection
// would silently publish a file sitting inside a restricted folder.
export default function VisibilityControl({
  inheritable = false,
  value,
  onChange,
  folderLabel,
}) {
  const accent = useAccentPalette();
  const [committees, setCommittees] = useState([]);

  useEffect(() => {
    getCommittees()
      .then((data) => setCommittees(Array.isArray(data) ? data : []))
      .catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  const audience = value?.audience ?? [];
  const committeeIds = value?.committeeIds ?? [];
  const inherit = Boolean(value?.inherit);
  const restricted = audience.length > 0 || committeeIds.length > 0;

  function set(patch) {
    onChange({ inherit, audience, committeeIds, ...patch });
  }

  function toggleCommittee(id) {
    set({
      committeeIds: committeeIds.includes(id)
        ? committeeIds.filter((c) => c !== id)
        : [...committeeIds, id],
    });
  }

  const modeButton = (active) =>
    cn(
      'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
      active
        ? 'border-transparent text-white'
        : 'border-border bg-card text-muted-foreground hover:text-foreground',
    );

  return (
    <div className="space-y-3">
      {inheritable && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => set({ inherit: true, audience: [], committeeIds: [] })}
            className={modeButton(inherit)}
            style={inherit ? { background: accent.gradient } : undefined}
          >
            Inherit{folderLabel ? ` from ${folderLabel}` : ' from folder'}
          </button>
          <button
            type="button"
            onClick={() => set({ inherit: false })}
            className={modeButton(!inherit)}
            style={!inherit ? { background: accent.gradient } : undefined}
          >
            Custom
          </button>
        </div>
      )}

      {(!inheritable || !inherit) && (
        <>
          {/* Rush is excluded because albums, folders and documents are gated
              on SHARED_ALBUM_GROUPS, which has no 'rush' — a rushee can never
              see this content, and parseAudience rejects the group outright.
              Offering the pill produced a form that 400'd on submit. */}
          <AudienceSelect
            value={audience}
            onChange={(next) => set({ audience: next })}
            exclude={['rush']}
            showHint={false}
          />

          {committees.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Or specific committees
              </p>
              <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-3">
                {committees.map((c) => {
                  const selected = committeeIds.includes(String(c.id));
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCommittee(String(c.id))}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                        selected
                          ? 'border-transparent text-white'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground',
                      )}
                      style={selected ? { background: accent.gradient } : undefined}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Says plainly what will happen, because "no boxes ticked" means two
          opposite things depending on inheritable. */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        {inheritable && inherit ? (
          <>
            <Lock size={12} className="mt-0.5 shrink-0" />
            <span>Follows the folder. If the folder is restricted, this is too.</span>
          </>
        ) : restricted ? (
          <>
            <Lock size={12} className="mt-0.5 shrink-0" />
            <span>
              Visible to{' '}
              <strong className="text-foreground">
                {[...audience.map(formatMemberGroup), ...committeeIds.map((id) => committees.find((c) => String(c.id) === id)?.name).filter(Boolean)].join(', ')}
              </strong>
              . Hidden entirely from everyone else, name included.
            </span>
          </>
        ) : (
          <>
            <Globe size={12} className="mt-0.5 shrink-0" />
            <span>Visible to every member. Rushees never see photos or documents.</span>
          </>
        )}
      </div>
    </div>
  );
}

// Small inline editor used from a list row. Owns its own saving state so the
// parent only deals with the resulting value.
export function VisibilitySaveRow({ onSave, onCancel, disabled }) {
  const accent = useAccentPalette();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    try {
      await onSave();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not save visibility.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="flex items-center gap-1.5 text-[11px] text-destructive">
          <AlertTriangle size={11} /> {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || disabled}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          style={{ background: accent.gradient }}
        >
          {saving && <Loader2 size={11} className="animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );
}
