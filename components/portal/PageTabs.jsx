'use client';

import { cn } from '@/lib/utils';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';

// The PAGE-level tab control, shared by every merged admin page.
//
// Deliberately NOT the underline treatment used elsewhere. Several of the
// components these pages embed -- ModerationQueue and AnalyticsContent -- render
// their own underline tab bar, down to the same padding and the same
// `inset-x-2 bottom-0 h-0.5` rule. Stacking a second identical row above one of
// those says nothing about which row is the page and which is the section, so
// the outer level gets a segmented control instead and the hierarchy reads at a
// glance.
//
// `tabs` is [{ id, label, icon? }]. Callers own the active id.
export default function PageTabs({ tabs, active, onChange, className }) {
  const accent = useAccentPalette();

  return (
    <div
      role="tablist"
      className={cn('inline-flex items-center gap-1 rounded-xl border border-border bg-muted/50 p-1', className)}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-150',
              isActive
                ? 'bg-card shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            style={isActive ? { color: accent.base } : undefined}
          >
            {Icon && <Icon size={14} aria-hidden="true" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
