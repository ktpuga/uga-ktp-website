'use client';

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PROFILE_LIMITS } from '@/lib/text-limits';

// Eboard-typed traits: "Pledge Chair", "Fintech", "Atlanta, GA".
//
// One plain string each, not a label/value pair. They render as pills on the
// badge row of the directory card and the public roster, beside the member
// group badge and a chair's committee caption — and "Pledge Chair" is one
// string. The pair shape made eboard invent a label for things that don't have
// one, and rendered as a definition list instead of a caption.
//
// It saves through its own endpoint (`PUT /admin/users/:id/traits`) rather than
// riding along in the profile payload, which is what makes "eboard-only" true
// of the API and not just of the UI. That is also why this is a component of
// its own rather than a mode of the links editor.
export function useTraitRows(saved) {
  // Each row carries a `key` that is NOT its index, for the same reason the
  // links editor does: deleting a middle row renumbers every index below it, so
  // React reuses the wrong input for the wrong row and text visibly jumps.
  const [rows, setRows] = useState(() =>
    (saved ?? []).map((value, i) => ({
      key: `saved-${i}`,
      // Tolerates a pre-migration {label, value} row rather than rendering
      // "[object Object]" into the input. Eboard sees the joined string and can
      // edit it, which is exactly what the migration produces anyway.
      value: typeof value === 'string'
        ? value
        : [value?.label, value?.value].filter(Boolean).join(': '),
    })),
  );
  const nextKey = useRef(0);

  const add = () =>
    setRows((current) => (
      current.length >= PROFILE_LIMITS.TRAITS
        ? current
        : [...current, { key: `new-${nextKey.current++}`, value: '' }]
    ));
  const remove = (key) => setRows((current) => current.filter((row) => row.key !== key));
  const edit = (key, value) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, value } : row)));

  // Rows added and never filled in are dropped rather than sent: an empty row is
  // someone who clicked Add and changed their mind, and the API rejects an empty
  // trait, so sending it would turn "I didn't use that row" into a failed save
  // of the whole form.
  const submittable = rows
    .map((row) => row.value.trim())
    .filter((value) => value !== '');

  return { rows, add, remove, edit, submittable };
}

export default function TraitsField({ rows, error, onAdd, onRemove, onEdit, disabled = false }) {
  const full = rows.length >= PROFILE_LIMITS.TRAITS;

  return (
    <div data-field="traits">
      <p className="mb-2 text-xs text-muted-foreground">
        Short captions shown next to this member&apos;s group badge, on their directory card
        and on the public roster. Up to {PROFILE_LIMITS.TRAITS}. Members cannot edit these
        themselves.
      </p>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-start gap-2">
            <Input
              value={row.value}
              onChange={(e) => onEdit(row.key, e.target.value)}
              placeholder="Pledge Chair"
              maxLength={PROFILE_LIMITS.TRAIT}
              aria-label="Trait"
              disabled={disabled}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => onRemove(row.key)}
              disabled={disabled}
              // Named, so a screen reader hears which trait is going rather than
              // six identical "Remove" buttons.
              aria-label={`Remove ${row.value.trim() || 'trait'}`}
              className="mt-1 shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={full || disabled}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
        {full ? `That's all ${PROFILE_LIMITS.TRAITS}` : 'Add a trait'}
      </button>

      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
