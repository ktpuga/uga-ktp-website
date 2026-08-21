'use client';

import { useState } from 'react';
import { PRONOUN_PRESETS, CUSTOM_PRONOUNS, splitPronouns } from '@/lib/profile';
import { PROFILE_LIMITS } from '@/lib/text-limits';

// Shared by BOTH profile write paths: the member's own ProfileForm and eboard's
// AdminEditProfileModal.
//
// Shared for the same reason LinksField is. Both forms build their body with
// buildProfilePayload, and the member write is an upsert while the admin write
// is whole-row -- so a surface that renders no pronouns input still SENDS
// `pronouns: null` and blanks the column. That is not hypothetical: it is
// exactly how eboard correcting a major used to wipe a member's links. A third
// profile-editing surface must render this component or repeat that bug.
//
// Two inputs, one column: a select carrying a preset or the CUSTOM_PRONOUNS
// sentinel, plus a free-text box that only counts when the sentinel is chosen.
// buildProfilePayload recombines them; see readPronouns there.
export default function PronounsField({ defaultValue, selectClass, inputClass }) {
  const initial = splitPronouns(defaultValue);
  const [preset, setPreset] = useState(initial.preset);

  return (
    <div className="space-y-2">
      <select
        name="pronouns_preset"
        value={preset}
        onChange={(event) => setPreset(event.target.value)}
        className={selectClass}
      >
        {/* Not "prefer not to say" -- that would be an ANSWER, stored as text
            and rendered as a pill. This is the absence of one, which the API
            stores as NULL and the directory renders as nothing at all. */}
        <option value="">Prefer not to say</option>
        {PRONOUN_PRESETS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
        <option value={CUSTOM_PRONOUNS}>Custom…</option>
      </select>

      {preset === CUSTOM_PRONOUNS && (
        <input
          type="text"
          name="pronouns_custom"
          defaultValue={initial.custom}
          placeholder="e.g. ze/hir"
          // One table of caps shared with the API; see lib/text-limits.js.
          maxLength={PROFILE_LIMITS.PRONOUNS}
          className={inputClass}
          aria-label="Custom pronouns"
        />
      )}
    </div>
  );
}
