'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CheckCircle2, Clock, HelpCircle } from 'lucide-react';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} event{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

const STATUS_ICONS = [CheckCircle2, Clock, HelpCircle];

export default function EventsTab({ eventsByMonth, eventStatus, accentBase, accentMuted }) {
  const total = eventsByMonth.reduce((s, m) => s + m.events, 0);
  const avg = eventsByMonth.length === 0 ? 0 : Math.round((total / eventsByMonth.length) * 10) / 10;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card lg:col-span-3">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div aria-hidden="true" className="h-4 w-0.5 rounded-full" style={{ background: accentBase }} />
            <h3 className="text-sm font-semibold tracking-tight">Event Volume</h3>
            <span className="text-xs text-muted-foreground">last 6 months</span>
          </div>
          <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: accentMuted, color: accentBase }}>
            avg {avg}/mo
          </span>
        </div>
        <div className="flex-1 p-6 pt-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={eventsByMonth} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'dataMax + 1']} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
              <ReferenceLine y={avg} stroke={accentBase} strokeDasharray="4 3" strokeWidth={1.5} opacity={0.5} />
              <Bar dataKey="events" fill={accentBase} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div aria-hidden="true" className="h-4 w-0.5 rounded-full" style={{ background: accentBase }} />
            <h3 className="text-sm font-semibold tracking-tight">Event Status</h3>
          </div>
        </div>
        <div className="flex flex-1 flex-col divide-y divide-border px-6">
          {eventStatus.map((status, i) => {
            const Icon = STATUS_ICONS[i];
            return (
              <div key={status.label} className="flex items-center gap-4 py-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: i === 0 ? accentMuted : 'var(--color-muted)' }}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} style={{ color: i === 0 ? accentBase : 'var(--color-muted-foreground)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{status.label}</p>
                  <p className="text-[11px] text-muted-foreground">{status.description}</p>
                </div>
                <span className="text-3xl font-bold tabular-nums" style={{ color: i === 0 ? accentBase : 'var(--color-foreground)' }}>
                  {status.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
