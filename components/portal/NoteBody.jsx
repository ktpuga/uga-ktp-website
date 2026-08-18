import { parseNoteBody } from '@/lib/interview-note-format';

// Renders one interview note's body.
//
// Used in three places that must not drift apart: the per-candidate panel an
// interviewer writes in, eboard's round-wide card, and the decision-night slide.
// A bullet that renders as a list in one and as a literal "- " in another would
// make people distrust the formatting and go back to Slides, which is the
// workflow this feature is replacing.
//
// No dangerouslySetInnerHTML anywhere in this path. The body is user-authored
// text about a named person and it stays text; `parseNoteBody` produces data,
// and React escapes every string below.

const MARKERS = ['•', '◦'];

// `slide` is the projected variant: bigger type and more air, because it is read
// from across a room rather than from a laptop.
const SIZES = {
  compact: {
    list: 'space-y-1',
    item: 'text-[12px] leading-relaxed',
    marker: 'text-[12px]',
    paragraph: 'text-[12px] leading-relaxed',
    indent: 14,
  },
  slide: {
    list: 'space-y-2',
    item: 'text-base leading-relaxed sm:text-lg',
    marker: 'text-base sm:text-lg',
    paragraph: 'text-base leading-relaxed sm:text-lg',
    indent: 24,
  },
};

export default function NoteBody({ body, size = 'compact', className = '' }) {
  const blocks = parseNoteBody(body);
  const style = SIZES[size] ?? SIZES.compact;

  // An empty body is not something the API stores, but a note whose whole
  // content was whitespace would parse to nothing. Render the raw string rather
  // than an empty element so the row never collapses to a blank card.
  if (blocks.length === 0) {
    return <p className={`${style.paragraph} whitespace-pre-line text-foreground ${className}`}>{body}</p>;
  }

  return (
    <div className={`${style.list} ${className}`}>
      {blocks.map((block, i) => (
        block.kind === 'bullet' ? (
          <div
            key={i}
            className="flex gap-2 text-foreground"
            style={{ paddingLeft: block.depth * style.indent }}
          >
            <span aria-hidden="true" className={`${style.marker} shrink-0 leading-relaxed text-muted-foreground`}>
              {MARKERS[block.depth] ?? MARKERS[MARKERS.length - 1]}
            </span>
            <span className={style.item}>{block.text}</span>
          </div>
        ) : (
          <p key={i} className={`${style.paragraph} text-foreground`}>{block.text}</p>
        )
      ))}
    </div>
  );
}
