'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Search, AlertCircle, ClipboardList, CircleDashed } from 'lucide-react';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { getRushInterestData } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';
import { toCsv, downloadCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';

// The rushee interest form data: what used to be a Google Forms response sheet.
//
// ONE component, rendered by two thin pages. /admin/rush-data for eboard and
// /member/rush-data for the pledge committee, because proxy.ts hard-gates
// /admin to the eboard group and redirects an eboard-only account away from
// /member -- neither portal can serve both audiences, and the answer to that is
// two routes over one component rather than two components. See
// project-portal-duplication: the trait markup existing twice is the failure
// this shape avoids.
//
// The API is the boundary either way. Reaching either page without the grant
// returns a 403 and this renders the refusal, so neither route is load-bearing
// for access.

// The columns, in the order the Google Form asked its questions.
//
// ONE list drives the table and the CSV, so the sheet a chair opens cannot
// disagree with the screen they exported it from. `header` is what a person
// reads; `key` matches userModel.findRushInterest's projection, which has a
// test pinning its shape for exactly this reason.
//
// `csvOnly` is for the columns worth having in a spreadsheet and not worth a
// horizontal scrollbar: a phone number and a personal address are for
// contacting somebody later, not for reading down a list.
//
// Exported, along with `cellsFor` below, for the render probe. A green next
// build says nothing about a client component -- it never renders one -- and
// the thing worth pinning is that the table and the CSV read the SAME cells,
// which is only checkable from outside. Same reason CommitteeDetail is exported.
export const COLUMNS = [
  { key: 'submitted', header: 'Submitted', csvOnly: true },
  { key: 'name', header: 'Name' },
  { key: 'preferred_name', header: 'Preferred Name', csvOnly: true },
  { key: 'email', header: 'UGA Email' },
  { key: 'personal_email', header: 'Personal Email', csvOnly: true },
  { key: 'phone', header: 'Phone', csvOnly: true },
  { key: 'major', header: 'Major(s)' },
  { key: 'minors', header: 'Minor(s) & Certificates' },
  { key: 'gpa', header: 'GPA' },
  { key: 'dob', header: 'Date of Birth', csvOnly: true },
  { key: 'graduation_date', header: 'Graduation' },
  { key: 'heard_from', header: 'How They Heard' },
  { key: 'status', header: 'Status' },
];

// A rushee's name as one cell. `preferred_name` gets its own column rather than
// replacing the legal one: the chapter addresses people by the first and files
// them by the second, and an export that silently substitutes one loses the
// other.
function fullName(row) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ') || '(no name yet)';
}

// A DATE column, rendered as the calendar date it is.
//
// Sliced, never passed through `new Date()`. `new Date('2004-03-15')` is UTC
// midnight shown in the viewer's zone, which prints *March 14* anywhere west of
// UTC -- the same day-shift trap that `dateOnly` exists for on the API side.
// The API returns either a bare YYYY-MM-DD or an ISO timestamp; both slice.
function dateOnly(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

// The submission timestamp. This one IS a real instant, so it formats as one,
// in the chapter's own reading rather than the viewer's locale ordering.
function submittedAt(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// One row, as the values both the table and the CSV read.
//
// Built once per row rather than twice, so a column cannot be formatted one way
// on screen and another in the file.
export function cellsFor(row) {
  return {
    submitted: submittedAt(row.created_at),
    name: fullName(row),
    preferred_name: row.preferred_name ?? '',
    email: row.email ?? '',
    personal_email: row.personal_email ?? '',
    phone: row.phone ?? '',
    major: row.major ?? '',
    minors: row.minors ?? '',
    // A string, because the column is NUMERIC and node-postgres reads NUMERIC
    // back as text. Rendered exactly as stored, so the sheet shows the digits
    // the rushee typed.
    gpa: row.gpa ?? '',
    dob: dateOnly(row.dob),
    graduation_date: row.graduation_date ?? '',
    heard_from: row.heard_from ?? '',
    status: row.profile_complete ? 'Complete' : 'In progress',
  };
}

function StatCard({ label, value, hint }) {
  const accent = useAccentPalette();
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="h-0.5 w-full" style={{ background: accent.gradient }} aria-hidden="true" />
      <div className="px-5 py-4">
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
        {hint && <p className="mt-1 text-[11px] text-muted-foreground/80">{hint}</p>}
      </div>
    </div>
  );
}

export default function RushInterestTable() {
  const accent = useAccentPalette();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  function load({ refresh = false } = {}) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    getRushInterestData()
      .then(setRows)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load rushee data');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  // Formatted once, then filtered, so the search matches what is on screen
  // rather than the raw row underneath it. Searching "Complete" finding the
  // finished profiles is a consequence of that and a welcome one.
  const prepared = useMemo(() => rows.map((row) => ({ id: row.authentik_id, cells: cellsFor(row) })), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return prepared;
    return prepared.filter(({ cells }) =>
      Object.values(cells).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [prepared, search]);

  const stats = useMemo(() => {
    const complete = prepared.filter(({ cells }) => cells.status === 'Complete').length;
    const withGpa = prepared.filter(({ cells }) => cells.gpa !== '').length;
    return { total: prepared.length, complete, withGpa };
  }, [prepared]);

  // Exports WHAT IS ON SCREEN, filter included, rather than everything.
  //
  // The search box is how somebody narrows to the people they are working on,
  // and an export that quietly ignored it would hand them the whole cohort
  // under a filename saying otherwise. Clearing the box is one click and gets
  // the full sheet.
  function handleExport() {
    const csv = toCsv(
      COLUMNS.map((c) => c.header),
      filtered.map(({ cells }) => COLUMNS.map((c) => cells[c.key])),
    );
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`ktp-rushee-interest-${stamp}.csv`, csv);
  }

  const visible = COLUMNS.filter((c) => !c.csvOnly);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rushee Interest Forms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What every rushee filled in while building their profile. Export it to open in Google
            Sheets or Excel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load({ refresh: true })}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw size={15} className={cn(refreshing && 'animate-spin')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: accent.gradient }}
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Rushees" value={stats.total} />
        <StatCard
          label="Finished their profile"
          value={stats.complete}
          hint={stats.total - stats.complete > 0 ? `${stats.total - stats.complete} still in progress` : null}
        />
        <StatCard label="Gave a GPA" value={stats.withGpa} />
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search any column"
          className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2"
          style={{ '--tw-ring-color': accent.ring }}
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <CircleDashed size={16} className="animate-spin" />
          Loading rushee data
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card">
          <ClipboardList size={20} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {rows.length === 0 ? 'No rushees have signed up yet' : 'Nothing matches that search'}
          </p>
        </div>
      ) : (
        <>
          {/* The table scrolls inside its own container rather than widening the
              page. Thirteen columns do not fit a laptop, and a body that scrolls
              sideways takes the sidebar with it. */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  {visible.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ id, cells }) => (
                  <tr key={id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                    {visible.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          'px-4 py-3 align-top text-foreground',
                          c.key === 'name' && 'font-medium whitespace-nowrap',
                          c.key === 'gpa' && 'tabular-nums',
                        )}
                      >
                        {c.key === 'status' ? (
                          <span
                            className={cn(
                              'inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                              cells.status === 'Complete'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                            )}
                          >
                            {cells.status}
                          </span>
                        ) : (
                          cells[c.key] || <span className="text-muted-foreground/50">&mdash;</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Said out loud because the table hides six of the thirteen columns
              and somebody who does not know that will assume the export matches
              what they can see. */}
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {prepared.length}. The export also includes submission
            date, preferred name, personal email, phone and date of birth.
          </p>
        </>
      )}
    </div>
  );
}
