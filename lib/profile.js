// if you need to figure the order this goes in

// check components/profile/ProfileForm.jsx line 65-72
// then check lib/portal-api
// then lib/profile.js
// then check here?
// or just use ai ask where everything goes

export function normalizeUserProfile(data) {
  const profile = data?.profile ?? data ?? {};

  return {
    authentik_id: data?.authentik_id ?? profile.authentik_id ?? null,
    username: data?.username ?? profile.username ?? null,
    member_group: data?.member_group ?? profile.member_group ?? null,
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    preferred_name: profile.preferred_name ?? '',
    dob: formatDateInput(profile.dob),
    major: profile.major ?? '',
    graduation_date: profile.graduation_date ?? '',
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    personal_email: profile.personal_email ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    pledge_class: profile.pledge_class ?? '',
    about_me: profile.about_me ?? '',
    doing_now: profile.doing_now ?? '',
    // Rush interest form. `gpa` is a NUMERIC column, and node-postgres returns
    // NUMERIC as a STRING ("3.75") rather than a number, so this arrives as
    // text and stays text -- it goes straight back into an input.
    minors: profile.minors ?? '',
    gpa: profile.gpa ?? '',
    heard_from: profile.heard_from ?? '',
    // Always an array. The form maps over this to render its rows, and the
    // column is NOT NULL DEFAULT '[]', so anything else here is a row from
    // before the migration or a response shape that changed underneath us.
    links: Array.isArray(profile.links) ? profile.links : [],
    // Defaults to true, matching the column, so a response from an API that
    // predates this column doesn't render the Settings switch as "off" and tell
    // the member they are hidden from a page they are actually on.
    show_on_public_roster: profile.show_on_public_roster ?? true,
    profile_picture_asset_id: data?.profile_picture_asset_id ?? profile.profile_picture_asset_id ?? null,
    // Owner-only: /users/me returns this so Settings can show an existing
    // subscription without issuing a new token on every page load.
    calendar_feed_token: profile.calendar_feed_token ?? null,
  };
}

function formatDateInput(value) {
  if (!value) return '';
  const str = String(value);
  return str.includes('T') ? str.split('T')[0] : str;
}

// Pronoun presets, and the sentinel that means "none of these".
//
// The list lives HERE rather than in either form, so the member's own profile
// builder and eboard's edit modal cannot drift apart -- the same reason
// buildProfilePayload itself is shared. It is a CONVENIENCE, not a vocabulary:
// the API stores plain TEXT and validates only the length, so the Custom box is
// a real escape hatch rather than a fifth preset.
export const PRONOUN_PRESETS = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they'];

// Deliberately a value no real answer can collide with. A bare 'custom' would
// be storable as somebody's actual pronouns, and the select would then reopen
// as the Custom row instead of showing what they typed.
export const CUSTOM_PRONOUNS = '__custom__';

// Which way a stored value opens the control: a value that is not one of the
// presets is a custom one, and an empty value is unanswered.
export function splitPronouns(stored) {
  const value = (stored ?? '').trim();
  if (!value) return { preset: '', custom: '' };
  if (PRONOUN_PRESETS.includes(value)) return { preset: value, custom: '' };
  return { preset: CUSTOM_PRONOUNS, custom: value };
}

export function parseGraduationDate(graduationDate) {
  if (!graduationDate) return { semester: '', year: '' };
  const parts = String(graduationDate).trim().split(/\s+/);
  if (parts.length >= 2) {
    return { semester: parts[0], year: parts[parts.length - 1] };
  }
  return { semester: '', year: '' };
}

// 

export function buildProfilePayload(formData) {
  const semester = formData.get('graduation_semester');
  const year = formData.get('graduation_year');
  let graduation_date = formData.get('graduation_date') || null;
  if (semester && year) {
    graduation_date = `${semester} ${year}`;
  }

  return {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    preferred_name: formData.get('preferred_name') || null,
    dob: formData.get('dob') || null,
    major: formData.get('major') || null,
    graduation_date,
    phone: formData.get('phone') || null,
    // `has` rather than `get`, and it is the one key treated this way.
    //
    // A form that does not RENDER the UGA email input must omit the key
    // entirely, not send null. The API distinguishes the two: an absent key
    // defers to the address already on file (enrollment collects it now, so the
    // profile builder no longer asks), while an explicit null is someone
    // clearing the field on the full profile form and is still refused.
    // `formData.get` collapses both cases to null and loses that distinction.
    ...(formData.has('email') ? { email: formData.get('email') || null } : {}),
    personal_email: formData.get('personal_email') || null,
    linkedin_url: formData.get('linkedin_url') || null,
    pledge_class: formData.get('pledge_class') || null,
    about_me: formData.get('about_me') || null,
    doing_now: formData.get('doing_now') || null,
    // Two inputs, one column -- the same shape as graduation_semester +
    // graduation_year above. The select carries a preset or the CUSTOM_PRONOUNS
    // sentinel; only in the sentinel case does the free-text box mean anything,
    // so a leftover custom value from before someone switched back to a preset
    // is ignored rather than saved.
    pronouns: readPronouns(formData),
    links: parseLinksField(formData.get('links')),
    // Rush interest form, and `has` rather than `get` for the same reason the
    // UGA email above uses it -- this is the second field group to need that
    // distinction, and here it prevents real data loss rather than a 400.
    //
    // These inputs are rendered for RUSHEES ONLY. The API's updateProfile
    // writes only the keys a request actually carried, so omitting them leaves
    // the stored values alone; sending an explicit null clears them. Without
    // this, the day a rushee is given a pledge class their form stops
    // rendering the fields, `formData.get` returns null for all three, and
    // their GPA and interest answers are erased by the next unrelated save --
    // taking the pledge committee's own record of them with it.
    //
    // Spread as a group because they are one form section: a partial omission
    // would clear some and keep others, which is harder to reason about than
    // either extreme.
    ...(formData.has('gpa')
      ? {
          minors: formData.get('minors') || null,
          gpa: formData.get('gpa') || null,
          heard_from: formData.get('heard_from') || null,
        }
      : {}),
  };
}

function readPronouns(formData) {
  const preset = formData.get('pronouns_preset');
  if (preset === CUSTOM_PRONOUNS) {
    return (formData.get('pronouns_custom') || '').trim() || null;
  }
  return preset || null;
}

// Links ride through the form as one JSON string in a hidden input, because
// FormData is a flat map of strings and this is a list of pairs whose ORDER the
// member chose. The alternatives are worse: `links[0][label]`-style keys have to
// be re-assembled by hand on the other side, and two parallel arrays lose their
// pairing the moment somebody deletes a middle row.
//
// One hidden input also means both submit paths carry it for free —
// `saveProfile` at onboarding and `updateProfile` on the settings page both
// build their body from this same function.
//
// Parse failure resolves to an empty list rather than throwing. This value is
// written by the form itself, so a malformed one is a bug on this side rather
// than member input; the API validates the result regardless, and a thrown
// error inside a Server Action would reach the member as React's #441.
function parseLinksField(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
