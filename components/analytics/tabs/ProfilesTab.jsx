import { Crown } from 'lucide-react';

export default function ProfilesTab({ profileCoverage, leadershipCounts, memberCount, accentBase, accentGradient, accentMuted }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card lg:col-span-3">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div aria-hidden="true" className="h-4 w-0.5 rounded-full" style={{ background: accentBase }} />
            <h3 className="text-sm font-semibold tracking-tight">Profile Coverage</h3>
          </div>
          <span className="text-xs text-muted-foreground">of {memberCount} members</span>
        </div>

        <ul className="flex flex-1 flex-col divide-y divide-border px-6">
          {profileCoverage.map((field) => {
            const pct = field.total === 0 ? 0 : Math.round((field.filled / field.total) * 100);
            const trackColor = pct >= 90 ? '#16a34a' : pct >= 70 ? '#d97706' : accentBase;
            return (
              <li key={field.field} className="flex flex-col gap-2 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{field.field}</span>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-sm font-bold text-foreground">
                      {field.filled}
                      <span className="text-xs font-normal text-muted-foreground">/{field.total}</span>
                    </span>
                    <span
                      className="w-10 rounded-md px-1.5 py-0.5 text-center text-[11px] font-semibold"
                      style={{ background: `${trackColor}18`, color: trackColor }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: trackColor }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div aria-hidden="true" className="h-4 w-0.5 rounded-full" style={{ background: accentBase }} />
            <h3 className="text-sm font-semibold tracking-tight">Leadership</h3>
          </div>
        </div>

        <div className="flex flex-1 flex-col divide-y divide-border px-6">
          {leadershipCounts.map((item, i) => {
            const isTotalRow = i === leadershipCounts.length - 1;
            return (
              <div key={item.label} className="flex items-center gap-4 py-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: isTotalRow ? accentGradient : accentMuted }}>
                  <Crown className="h-[18px] w-[18px]" strokeWidth={1.75} style={{ color: isTotalRow ? '#fff' : accentBase }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: isTotalRow ? accentBase : 'var(--color-foreground)' }}>{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{isTotalRow ? 'E-board + chairs combined' : 'current roster'}</p>
                </div>
                <span className="text-3xl font-bold tabular-nums" style={{ color: isTotalRow ? accentBase : 'var(--color-foreground)' }}>
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
