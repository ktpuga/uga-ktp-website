// Bullet structure for interview notes.
//
// Notes are stored as one TEXT column and still are. This file adds structure at
// the EDGES — an editor that helps you type a list and a renderer that displays
// one — rather than in the database, which is why raising the cap to 6000 was
// the only schema-adjacent change the feature needed. Every note written before
// this existed still parses: a line with no marker is a paragraph.
//
// The alternative was storing an array of bullet objects. It was rejected
// because the round-wide read, the per-candidate panel, `archiveModel`'s
// rush_history snapshot and every one of the API's note tests all key on `body`
// being a string, and because iOS reads these fields later (see the memory note
// on keeping JSON additive). A format that degrades to plain text costs nothing
// to introduce and nothing to abandon.

// Two spaces per level, and `-` on the way in. `•` and `*` are accepted because
// people paste from Google Docs and Slides, which is exactly where these notes
// are coming from.
const BULLET_LINE = /^(\s*)([-*•])[ \t]+(.*)$/;

export const INDENT = '  ';

// Depth 0 and 1 only. A third level is unreadable projected on a wall at the
// back of a room, which is the one place these are guaranteed to be read.
export const MAX_DEPTH = 1;

function depthFromIndent(indent) {
  return Math.min(Math.floor(indent.replace(/\t/g, INDENT).length / INDENT.length), MAX_DEPTH);
}

// Splits a stored body into blocks for rendering.
//
// Returns a FLAT array rather than a tree, and the renderer indents by depth
// instead of nesting <ul>s. A tree has to decide what to do with a note that
// opens at depth 1, or jumps from 0 to 2, or interleaves paragraphs into a list
// — all of which a free-text box produces routinely. Flat has no such cases: it
// renders exactly what was typed, in order, and cannot throw on malformed input.
export function parseNoteBody(body) {
  const lines = String(body ?? '').split(/\r?\n/);
  const blocks = [];

  for (const line of lines) {
    const match = line.match(BULLET_LINE);
    if (match) {
      blocks.push({ kind: 'bullet', depth: depthFromIndent(match[1]), text: match[3].trim() });
      continue;
    }
    // Blank lines are dropped rather than rendered as empty paragraphs, so
    // spacing comes from the stylesheet and one stray newline does not open a
    // gap in the middle of a slide.
    if (line.trim()) blocks.push({ kind: 'paragraph', text: line.trim() });
  }

  return blocks;
}

// True when a body is worth rendering as a list at all. Used to decide whether
// to show the formatting hint under the editor.
export function hasBullets(body) {
  return parseNoteBody(body).some((block) => block.kind === 'bullet');
}

function lineBoundsAt(value, caret) {
  const start = value.lastIndexOf('\n', caret - 1) + 1;
  const end = value.indexOf('\n', caret);
  return { start, end: end === -1 ? value.length : end };
}

// Keyboard behaviour for the note editor.
//
// A PURE FUNCTION returning the next value and where the caret belongs, rather
// than a hook that touches the textarea. That split is deliberate: caret
// arithmetic is the part that breaks, and this way it can be tested without a
// DOM, a React tree or a render probe.
//
// Returns null when the key should do its normal thing, and the caller must only
// preventDefault when it does NOT return null.
//
//   Enter on a bullet      continues the list at the same depth
//   Enter on an EMPTY one  removes the marker and leaves the list
//   Tab / Shift+Tab        indents or outdents, but only on a bullet line
//
// ⚠ Tab is intercepted ONLY on a bullet line. Swallowing Tab unconditionally
// inside a textarea traps keyboard users in the control with no way out, which
// is a real accessibility failure and not a trade worth making for an indent
// shortcut. Off a bullet, Tab moves focus like it does everywhere else.
export function bulletKeyDown(event, value) {
  const el = event.target;
  const caret = el.selectionStart ?? 0;
  const selectionEnd = el.selectionEnd ?? caret;

  if (event.key === 'Enter') {
    if (event.shiftKey || caret !== selectionEnd) return null;

    const { start, end } = lineBoundsAt(value, caret);
    const match = value.slice(start, end).match(BULLET_LINE);
    if (!match) return null;

    const [, indent, marker, text] = match;

    // An empty bullet means "I'm done with the list". Same as Docs, Notes and
    // every other editor, and without it the only way out is deleting the
    // marker the editor just inserted for you.
    if (!text.trim()) {
      return { value: value.slice(0, start) + value.slice(end), caret: start };
    }

    const inserted = `\n${indent}${marker} `;
    return {
      value: value.slice(0, caret) + inserted + value.slice(caret),
      caret: caret + inserted.length,
    };
  }

  if (event.key === 'Tab') {
    const { start, end } = lineBoundsAt(value, caret);
    const line = value.slice(start, end);
    const match = line.match(BULLET_LINE);
    if (!match) return null;

    const [, indent] = match;
    const depth = depthFromIndent(indent);

    if (event.shiftKey) {
      if (depth === 0) return null;
      const next = line.replace(/^(\s*)/, indent.slice(INDENT.length));
      return {
        value: value.slice(0, start) + next + value.slice(end),
        caret: Math.max(start, caret - INDENT.length),
      };
    }

    if (depth >= MAX_DEPTH) {
      // Already as deep as the renderer draws. Returning a value here would let
      // the stored indent drift past what anyone can see.
      return { value, caret };
    }

    return {
      value: value.slice(0, start) + INDENT + line + value.slice(end),
      caret: caret + INDENT.length,
    };
  }

  return null;
}
