'use client';

import { AUDIENCE_GROUPS, formatMemberGroup } from '@/lib/portal-format';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { cn } from '@/lib/utils';

const ACTIVES_ONLY = ['eboard', 'chair', 'active'];

function sameGroups(a, b) {
  return a.length === b.length && a.every((g) => b.includes(g));
}

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Shared multi-select used by both the event and announcement forms at
// /admin/announcements, plus the committee "Schedule Meeting" form. `value`
// is an array of group names, or null/empty for "everyone" — that's a
// convention enforced by the backend query, not just a display choice here.
//
// Pill buttons rather than checkboxes so this matches the committee picker in
// AnnouncementsContent, which sits directly beside it in the same form.
export default function AudienceSelect({ value, onChange }) {
  const accent = useAccentPalette();
  const selected = value ?? [];
  const isAll = selected.length === 0;
  const isActivesOnly = sameGroups(selected, ACTIVES_ONLY);

  function toggle(group) {
    onChange(selected.includes(group) ? selected.filter((g) => g !== group) : [...selected, group]);
  }

  // Matches the committee pills exactly: accent gradient when on, a faint
  // accent wash on hover when off.
  const pillProps = (active) => ({
    className: cn(
      'rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
      active
        ? 'border-transparent text-white'
        : 'border-border bg-card text-muted-foreground hover:border-transparent hover:text-foreground',
    ),
    style: active ? { background: accent.gradient } : undefined,
    onMouseEnter: (e) => { if (!active) e.currentTarget.style.background = tint(accent.base, 0.07); },
    onMouseLeave: (e) => { if (!active) e.currentTarget.style.background = ''; },
  });

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => onChange(isActivesOnly ? [] : ACTIVES_ONLY)} {...pillProps(isActivesOnly)}>
        Actives Only
      </button>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-3">
        {AUDIENCE_GROUPS.map((group) => {
          const active = selected.includes(group);
          return (
            <button key={group} type="button" onClick={() => toggle(group)} aria-pressed={active} {...pillProps(active)}>
              {formatMemberGroup(group)}
            </button>
          );
        })}
      </div>

      {/* "Everyone" does NOT include rushees: the backend's untargeted branch
          requires a member group, so anything left unticked is invisible in the
          Rush portal. This used to read "Visible to everyone", which reliably
          produced rush events that no rushee could see. */}
      {isAll ? (
        <p className="text-xs text-muted-foreground">
          Visible to <span className="font-medium text-foreground">all members</span>. Rushees will not
          see this unless you tick <span className="font-medium text-foreground">Rushee</span>.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Visible to: {selected.map(formatMemberGroup).join(', ')}
        </p>
      )}
    </div>
  );
}
