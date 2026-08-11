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
    email: formData.get('email') || null,
    personal_email: formData.get('personal_email') || null,
    linkedin_url: formData.get('linkedin_url') || null,
    pledge_class: formData.get('pledge_class') || null,
    about_me: formData.get('about_me') || null,
    doing_now: formData.get('doing_now') || null,
    links: parseLinksField(formData.get('links')),
  };
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
