import { TrendingUp, Minus } from 'lucide-react';

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Each stat's `delta` is either a real, computable fact (e.g. the actual
// next event's date) or omitted entirely — no fabricated growth numbers
// like "+3 this semester", since this app has no historical snapshots to
// compute a real trend from.
export default function AnalyticsStatRow({ stats, accentBase, accentGradient, accentMuted }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        const DeltaIcon = stat.delta ? TrendingUp : Minus;
        const isFeatured = i === 0;

        return (
          <div key={stat.id} className="relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{ background: `radial-gradient(ellipse 80% 60% at 0% 0%, ${tint(accentBase, isFeatured ? 0.15 : 0.07)} 0%, transparent 70%)` }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[3px] rounded-b-xl"
              style={{ background: isFeatured ? accentGradient : tint(accentBase, 0.25) }}
            />

            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="mt-1.5 text-4xl font-bold leading-none tracking-tight" style={{ color: accentBase }}>
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                {stat.delta && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <span
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: accentMuted, color: accentBase }}
                    >
                      <DeltaIcon size={10} />
                      {stat.delta}
                    </span>
                  </div>
                )}
              </div>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ background: isFeatured ? accentGradient : accentBase }}
              >
                {Icon && <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
