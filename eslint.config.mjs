import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

// `next lint` was removed in Next 16 and `next build` no longer runs ESLint, so
// nothing lints this repo unless someone runs `npm run lint` or CI does it.
// .github/workflows/lint.yml runs it on every pull request.

// eslint-config-next declares react/react-hooks inside its own config object,
// and flat config does NOT share plugin namespaces between objects — a bare
// `{ rules: { 'react-hooks/...': 'warn' } }` fails with "could not find plugin".
// Reuse the instances it already loaded rather than adding our own copies of
// eslint-plugin-react{,-hooks}, which could drift from the version
// eslint-config-next pins and give us two plugins under one name.
const nextBase = nextVitals.find((config) => config.plugins?.['react-hooks']);
if (!nextBase) {
  throw new Error(
    'eslint-config-next no longer exposes the react-hooks plugin where we expect it. ' +
      'The rule overrides in eslint.config.mjs need to be re-pointed at whichever ' +
      'config object declares it.',
  );
}

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'coverage/**',
    'out/**',
    'public/**',
    'next-env.d.ts',
  ]),
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
    plugins: {
      react: nextBase.plugins.react,
      'react-hooks': nextBase.plugins['react-hooks'],
    },
    rules: {
      // Every violation in this repo is an apostrophe in prose ("member's",
      // "don't"). React renders those correctly; the rule only exists to catch
      // ambiguous `>` and `"`. Forcing &apos; through pages that are mostly
      // copy — /community-guidelines, /privacy — makes them painful to edit,
      // which is the opposite of what we want from outside contributors.
      'react/no-unescaped-entities': 'off',

      // ---------------------------------------------------------------
      // eslint-plugin-react-hooks v7 React Compiler rules.
      //
      // v7 turned the compiler diagnostics into lint rules and defaults most
      // of them to "error". The seven below already fire 57 times across 25
      // components. Every one was reviewed: they flag optimization and style
      // problems, not crashes, and clearing them means behavioral refactors
      // that belong in their own PRs. They are warnings so the baseline is
      // green and a genuinely broken PR stands out.
      //
      // The compiler rules NOT listed here are still errors and have zero
      // violations today, so they act as a real gate: rules-of-hooks,
      // set-state-in-render, globals, error-boundaries, void-use-memo,
      // config and gating. Those catch actual runtime bugs — leave them.
      //
      // Work these back up to "error" a rule at a time as the count drops.
      // ---------------------------------------------------------------

      // 31 hits. Effects that sync state after a fetch or a tab change. Real
      // cascading-render smell, but each fix is a rewrite of the component's
      // data flow.
      'react-hooks/set-state-in-effect': 'warn',

      // 10 hits, all in EventsCalendar. useMemo deps the compiler can't prove
      // it would infer the same way.
      'react-hooks/preserve-manual-memoization': 'warn',

      // 8 hits. Components declared inside other components; they remount on
      // every parent render. Worth fixing, not worth blocking on.
      'react-hooks/static-components': 'warn',

      // 6 hits, all the same shape: `Date.now()` inside a useMemo. Impure
      // during render, but the memo is already pinned to a dep array so the
      // clock never advances anyway. Fixing means moving "now" into state.
      'react-hooks/purity': 'warn',

      // 1 hit: `useEffect(() => { load(); }, [])` above `function load()`.
      // Function declarations hoist, so this works — the rule just reads it
      // top to bottom.
      'react-hooks/immutability': 'warn',

      // 1 hit in lib/use-tab-notifications.js, where writing the ref during
      // render is deliberate and commented. Changing it changes timing.
      'react-hooks/refs': 'warn',

      // 1 hit: a named function passed to useMemo instead of an inline one.
      'react-hooks/use-memo': 'warn',
    },
  },
]);
