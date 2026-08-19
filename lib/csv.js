// CSV generation, for exports that open in Google Sheets and Excel.
//
// Its own module rather than a loop inside the one page that needs it, because
// two of the three rules below are not obvious and would be re-derived wrongly
// the second time somebody adds an export. Neither Sheets nor Excel is
// forgiving about any of them.

// A cell, quoted per RFC 4180 and made safe to open.
//
// THREE separate problems, in the order they bite:
//
//  1. **Separators inside a value.** A comma, a quote or a newline inside a
//     cell has to be quoted, and a literal quote is doubled. A rushee whose
//     answer is `Instagram, and a friend` becomes two columns without this,
//     and every column after it on that row shifts by one -- which is the
//     failure mode where the spreadsheet looks fine until somebody sorts it.
//
//  2. **Formula injection.** A cell beginning with = + - @ or a control
//     character is executed as a formula on open, by BOTH Sheets and Excel.
//     The values here are typed by rushees, i.e. by people outside the
//     chapter, into a sheet that eboard opens. `=HYPERLINK(...)` and
//     `=IMPORTXML(...)` in a "how did you hear about KTP" box are a real
//     exfiltration path, not a theoretical one. Prefixing with a single quote
//     is the standard neutralisation: the leading quote is not displayed by
//     either program, so the cell still reads as what was typed.
//
//     Note the check runs BEFORE quoting. Wrapping in double quotes does not
//     disarm a formula -- Excel strips the quotes and evaluates what is left.
//
//  3. **A leading minus is not always an attack.** -3 is a number somebody
//     might legitimately export. It is still prefixed, because a negative
//     number that arrives as text is a nuisance and a formula that arrives as
//     a formula is a breach, and this export contains no column where
//     arithmetic on a negative value is meaningful.
function cell(value) {
  if (value === null || value === undefined) return '';

  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Build a CSV document.
 *
 * @param {string[]} headers  the header row, already in the order you want
 * @param {Array<Array<*>>} rows  one array of cells per row, same length
 * @returns {string} the document, CRLF-terminated per RFC 4180
 */
export function toCsv(headers, rows) {
  // CRLF rather than LF. RFC 4180 says so, and Excel on Windows is the reason
  // the RFC says so -- a bare LF file opens there as one very long row.
  return [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
}

/**
 * Hand a CSV to the browser as a download.
 *
 * The BOM is not decoration. Excel does not detect UTF-8 in a .csv and falls
 * back to the system codepage, so without it every accented name in the chapter
 * opens mangled -- and a name is exactly the kind of value nobody thinks to
 * check before mailing the sheet around. Sheets ignores the BOM either way.
 *
 * `text/csv` rather than `application/vnd.ms-excel`: the second makes Excel the
 * owner of a file that Sheets imports just as often, and it is a lie about the
 * bytes.
 */
export function downloadCsv(filename, csv) {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoked, or the blob is held for the lifetime of the tab. A member who
  // exports repeatedly while chasing incomplete profiles would otherwise leak
  // one copy of the sheet per click.
  URL.revokeObjectURL(url);
}
