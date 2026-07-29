'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{payload[0].payload.label}</p>
      <p className="text-muted-foreground">{payload[0].value} member{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

export default function MembersTab({ memberGroups, totalMembers, accentBase }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card lg:col-span-3">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div aria-hidden="true" className="h-4 w-0.5 rounded-full" style={{ background: accentBase }} />
            <h3 className="text-sm font-semibold tracking-tight">Member Distribution</h3>
          </div>
          <span className="text-xs text-muted-foreground">{totalMembers} total</span>
        </div>
        <div className="flex-1 p-6 pt-4">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={memberGroups} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {memberGroups.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div aria-hidden="true" className="h-4 w-0.5 rounded-full" style={{ background: accentBase }} />
            <h3 className="text-sm font-semibold tracking-tight">By Group</h3>
          </div>
        </div>
        <ul className="flex flex-1 flex-col divide-y divide-border px-6">
          {memberGroups.map((group) => {
            const pct = totalMembers === 0 ? 0 : Math.round((group.count / totalMembers) * 100);
            return (
              <li key={group.id} className="flex flex-col gap-2 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: group.color }} aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">{group.label}</span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-sm font-bold text-foreground">{group.count}</span>
                    <span className="w-8 text-right text-[11px] text-muted-foreground">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: group.color }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
