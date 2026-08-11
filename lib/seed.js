// Deterministic hashing for generated visuals.
//
// djb2 — dependency-free, and the same input always produces the same number,
// which is the whole point: anything derived from it looks identical on every
// render, device and reload. Nothing built on this may use Math.random().
//
// Lives here rather than in the component that needed it first because there
// are now two callers (the empty-album covers in PhotoFiles, the initials
// avatars in MemberDirectory) and a second copy is how the seven ACCENT_THEMES
// copies started.
export function djb2(value) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
    hash >>>= 0;
  }
  return hash;
}

// `count` independent values from one seed, for callers that need several
// unrelated numbers (a hue, an angle, a spacing) that must not move together.
export function seedValues(id, count) {
  return Array.from({ length: count }, (_, i) => djb2(`${id}:${i}`));
}
