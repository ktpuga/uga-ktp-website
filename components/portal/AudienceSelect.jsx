'use client';

import { AUDIENCE_GROUPS, formatMemberGroup } from '@/lib/portal-format';

const ACTIVES_ONLY = ['eboard', 'chair', 'active'];

function sameGroups(a, b) {
  return a.length === b.length && a.every((g) => b.includes(g));
}

// Shared multi-select used by both the event and announcement forms at
// /admin/announcements, plus the committee "Schedule Meeting" form. `value`
// is an array of group names, or null/empty for "everyone" — that's a
// convention enforced by the backend query (audience IS NULL/empty = public),
// not just a display choice here.
export default function AudienceSelect({ value, onChange }) {
  const selected = value ?? [];
  const isAll = selected.length === 0;
  const isActivesOnly = sameGroups(selected, ACTIVES_ONLY);

  function toggle(group) {
    onChange(selected.includes(group) ? selected.filter((g) => g !== group) : [...selected, group]);
  }

  const presetClass = (active) =>
    `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? 'border-blue-600 bg-blue-600 text-white'
        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'
    }`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange([])} className={presetClass(isAll)}>
          All Members
        </button>
        <button type="button" onClick={() => onChange(ACTIVES_ONLY)} className={presetClass(isActivesOnly)}>
          Actives Only
        </button>
      </div>
      <div className="flex flex-wrap gap-3 rounded-md border border-slate-300 p-3 dark:border-slate-700">
        {AUDIENCE_GROUPS.map((group) => (
          <label
            key={group}
            className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300"
          >
            <input
              type="checkbox"
              checked={selected.includes(group)}
              onChange={() => toggle(group)}
              className="h-4 w-4 rounded border-gray-300"
            />
            {formatMemberGroup(group)}
          </label>
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {isAll ? 'Visible to everyone.' : `Visible to: ${selected.map(formatMemberGroup).join(', ')}`}
      </p>
    </div>
  );
}
