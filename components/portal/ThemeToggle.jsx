'use client';
// these are icons used to toggle the theme of the portal
import { Moon, Sun } from 'lucide-react';
import { usePortalTheme } from './PortalThemeProvider';

export default function ThemeToggle({ className = '', iconOnly = false }) {

  // this is the theme of the portal check the PortalThemeProvider.jsx file for more details
  const { theme, toggleTheme } = usePortalTheme();
  const isDark = theme === 'dark';

  // this is the button that toggles the theme of the portal
  return (
    <button
      type="button"
      // this is the function that toggles the theme of the portal on mouse click
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      // this is just tailwind css for the button
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
    >
      {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      {!iconOnly && <span className="hidden sm:inline">{isDark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
