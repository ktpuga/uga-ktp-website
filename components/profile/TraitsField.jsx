'use client';

import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PROFILE_LIMITS } from '@/lib/text-limits';
import { usePairRows } from './LinksField';

// Eboard-typed traits: "Concentration: Fintech", "Hometown: Atlanta, GA".
//
// The same widget as the links editor, sharing its row-state hook, with a plain
// text value instead of a URL. Two things make it a different component rather
// than a prop on that one:
//
//   - It appears in a different place. Links are on the member's OWN settings
//     form; traits are eboard-only and exist solely in the admin edit modal,
//     because they land on the public roster.
//   - It saves through its own endpoint (`PUT /admin/users/:id/traits`) rather
//     than riding along in the profile payload, which is what makes
//     "eboard-only" true of the API and not just of the UI.
export function useTraitRows(saved) {
  return usePairRows(saved, 'value', PROFILE_LIMITS.TRAITS);
}

export default function TraitsField({ rows, error, onAdd, onRemove, onEdit, disabled = false }) {
  const full = rows.length >= PROFILE_LIMITS.TRAITS;

  return (
    <div data-field="traits">
      <p className="mb-2 text-xs text-muted-foreground">
        Shown on this member&apos;s directory card and on the public roster page. Up to{' '}
        {PROFILE_LIMITS.TRAITS}. Members cannot edit these themselves.
      </p>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-start gap-2">
            {/* Label narrow, value wide: the label is a word ("Hometown") and
                the value is the content ("Atlanta, GA"), which is why the API
                gives it twice the budget. */}
            <Input
              value={row.label}
              onChange={(e) => onEdit(row.key, 'label', e.target.value)}
              placeholder="Concentration"
              maxLength={PROFILE_LIMITS.TRAIT_LABEL}
              aria-label="Trait label"
              disabled={disabled}
              className="sm:w-44"
            />
            <Input
              value={row.value}
              onChange={(e) => onEdit(row.key, 'value', e.target.value)}
              placeholder="Fintech"
              maxLength={PROFILE_LIMITS.TRAIT_VALUE}
              aria-label="Trait value"
              disabled={disabled}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => onRemove(row.key)}
              disabled={disabled}
              // Named, so a screen reader hears which trait is going rather than
              // six identical "Remove" buttons.
              aria-label={`Remove ${row.label.trim() || 'trait'}`}
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
