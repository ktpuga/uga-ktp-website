'use client';

import { createContext, useContext } from 'react';

// The resolved accent for the portal currently being rendered.
//
// This exists because the Admin portal's colour is a *preference* (red or
// blue, per user) rather than fixed identity, so "which colour am I" can't be
// answered by a hardcoded constant any more.
//
// Deliberately a context rather than a prop: the admin-only components
// (Analytics, User Management, Rush Signup, …) define sub-components in the
// same file that each need the palette, and threading a prop through all of
// them would be a lot of churn for something every one of them agrees on.
// Any component, at any depth, can just ask.

export const PALETTES = {
  blue: {
    base: '#1e3a8a',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
    light: '#1d4ed8',
    muted: 'rgba(30,58,138,0.10)',
    ring: 'rgba(30,58,138,0.28)',
  },
  red: {
    base: '#7f1d1d',
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
    light: '#991b1b',
    muted: 'rgba(127,29,29,0.10)',
    ring: 'rgba(127,29,29,0.28)',
  },
  amber: {
    base: '#b45309',
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
    light: '#d97706',
    muted: 'rgba(180,83,9,0.10)',
    ring: 'rgba(180,83,9,0.28)',
  },
};

// Pledge and Rush render the same blue as Member — their keys stay distinct
// only because `accent` also selects the sidebar's NAV_GROUPING.
PALETTES.teal = PALETTES.blue;
PALETTES.violet = PALETTES.blue;

const PortalAccentContext = createContext('blue');

export function PortalAccentProvider({ accent, children }) {
  const palette = PALETTES[accent] ?? PALETTES.blue;
  return (
    <PortalAccentContext.Provider value={accent}>
      {/* Input focus rings are Tailwind arbitrary values inside plain string
          constants, so a hook can't reach them. Publishing the colour as a CSS
          variable lets those classes read focus:ring-[var(--portal-ring)] and
          follow the accent with no scoping. display:contents keeps this div
          out of layout entirely. */}
      <div style={{ display: 'contents', '--portal-ring': palette.ring }}>{children}</div>
    </PortalAccentContext.Provider>
  );
}

/** The resolved accent KEY, e.g. 'red' | 'blue'. */
export function usePortalAccent() {
  return useContext(PortalAccentContext);
}

/**
 * The resolved palette object. Admin-only components use this in place of the
 * hardcoded MAROON constant they used to define, so they follow the red/blue
 * toggle automatically.
 */
export function useAccentPalette() {
  return PALETTES[useContext(PortalAccentContext)] ?? PALETTES.blue;
}
