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
    linkedin_url: profile.linkedin_url ?? '',
    calendly_url: profile.calendly_url ?? '',
    pledge_class: profile.pledge_class ?? '',
    profile_picture_asset_id: data?.profile_picture_asset_id ?? profile.profile_picture_asset_id ?? null,
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
    linkedin_url: formData.get('linkedin_url') || null,
    calendly_url: formData.get('calendly_url') || null,
    pledge_class: formData.get('pledge_class') || null,
  };
}
