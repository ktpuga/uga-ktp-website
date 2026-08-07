'use client';


// if you need to figure the order this goes in

// check components/profile/ProfileForm.jsx line 65-72
// then check lib/portal-api
// then lib/profile.js
// then check here?
// or just use ai ask where everything goes

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { buildProfilePayload, parseGraduationDate } from '@/lib/profile';
import { updateProfile, uploadProfilePicture } from '@/lib/portal-api';
import { saveProfile } from '@/app/complete-profile/actions';
import { isRedirectError } from '@/lib/is-redirect-error';
import { linkedinHref } from '@/lib/portal-format';
import { cn } from '@/lib/utils';

function ProfilePictureField({ authentikId, variant }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadProfilePicture(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setVersion((v) => v + 1);
      }
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to upload photo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const labelClass = variant === 'onboarding' ? 'text-white/80' : 'text-foreground';

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        {authentikId && (
          <AvatarImage
            src={`/api/users/${authentikId}/profile-picture/media?v=${version}`}
            alt="Profile picture"
          />
        )}
        <AvatarFallback>
          <User className="h-6 w-6 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div>
        <label className={`inline-block cursor-pointer text-sm font-medium underline ${labelClass}`}>
          {uploading ? 'Uploading...' : 'Change photo'}
          {/* Keep in sync with PROFILE_PICTURE_MIMETYPES in ktp-api's
              middleware/upload.js. iOS reports HEIC inconsistently (sometimes
              with an empty type), so `image/*` is the fallback that keeps the
              picker from greying out a member's own camera roll — the API
              re-validates the real content either way. */}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,image/gif,image/tiff,image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

const ACCENT_BUTTON = {
  blue: 'bg-blue-800 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
  amber: 'bg-amber-800 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600',
  red: 'bg-red-800 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
  teal: 'bg-teal-800 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600',
  onboarding: 'bg-[#2A5CCA] hover:bg-[#3570DB]',
};

function Field({ label, required, variant, children }) {
  const labelClass =
    variant === 'onboarding'
      ? 'block text-sm font-medium text-white/80 mb-1'
      : 'block text-sm font-medium text-foreground mb-1';

  return (
    <div>
      <label className={labelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ProfileForm({
  mode = 'create',
  variant = 'onboarding',
  defaultValues = {},
  readOnly = {},
  accent = 'blue',
  onSuccess,
}) {
  const { data: session, update } = useSession();
  const authentikId = session?.user?.authentik_id ?? defaultValues.authentik_id;

  // Rushees fill this in as the very first thing they do after signing up, so
  // it's the app's first impression. Chapter-member fields are meaningless to
  // someone who hasn't been offered a bid — asking a prospective member for
  // their Pledge Class reads as a form built for somebody else.
  //
  // Rush-*only*: someone accepted into a pledge class keeps the rush group in
  // Authentik until it's removed, and should get the full form again.
  const groups = session?.user?.groups ?? [];
  const isRushee =
    groups.includes('rush') &&
    !groups.some((g) => ['eboard', 'chair', 'active', 'alumni', 'pledge'].includes(g));
  const isAlumni = groups.includes('alumni') || defaultValues.member_group === 'alumni';
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [linkedinError, setLinkedinError] = useState(null);

  const graduation = parseGraduationDate(defaultValues.graduation_date);

  const inputClass =
    variant === 'onboarding'
      ? 'bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/50'
      : '';

  const selectClass =
    variant === 'onboarding'
      ? `${inputClass} flex-1 h-10 rounded-md border px-3 py-2 text-sm`
      : 'flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm';


  // and this handles the submisson of the data
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // FormData = new FormData(e.target)
    // the e.target comes from what the user inputs

    const formData = new FormData(e.target);

    // Same rule the API enforces, run here so a typo is a message next to the
    // field instead of a 400 banner at the top of the form. The API is still
    // the one that decides — this only saves a round trip.
    const linkedinRaw = formData.get('linkedin_url');
    if (linkedinRaw && !linkedinHref(linkedinRaw)) {
      setLinkedinError("That doesn't look like a LinkedIn profile link.");
      setLoading(false);
      return;
    }
    setLinkedinError(null);

    const semester = formData.get('graduation_semester');
    const year = formData.get('graduation_year');
    if (semester && year) {
      formData.set('graduation_date', `${semester} ${year}`);
    }
    formData.delete('graduation_semester');
    formData.delete('graduation_year');

    let result;
    if (mode === 'create') {
      result = await saveProfile(formData);
    } else {
      try {

        // this handles the form data to update the users profile
        // check @portal-api
        const updatedProfile = await updateProfile(buildProfilePayload(formData));
        result = { success: true, profile: updatedProfile };
      } catch (err) {
        if (isRedirectError(err)) throw err;
        result = { error: err.message ?? 'Failed to save profile. Please try again.' };
      }
    }

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (mode === 'create') {
      await update({ profile_complete: true });
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = '/auth/redirect';
      }
      return;
    }

    setSuccess('Profile updated successfully.');
    setLoading(false);
    onSuccess?.(result.profile);
  }

  const buttonAccent = variant === 'onboarding' ? 'onboarding' : accent;
  const submitLabel = mode === 'create' ? 'Complete Profile' : 'Save Changes';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ProfilePictureField authentikId={authentikId} variant={variant} />

      <Field label="Username" required variant={variant}>
        <Input
          name="username"
          required
          minLength={3}
          maxLength={64}
          pattern="[A-Za-z0-9._-]+"
          title="Use 3–64 letters, numbers, periods, underscores, or hyphens."
          defaultValue={defaultValues.username ?? readOnly.username}
          autoComplete="username"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">Use 3–64 letters, numbers, periods, underscores, or hyphens.</p>
      </Field>

      {readOnly.memberGroup != null && (
        <Field label="Member Group" variant={variant}>
          <Input value={readOnly.memberGroup} readOnly disabled className={inputClass} />
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" required variant={variant}>
          <Input
            name="first_name"
            required
            defaultValue={defaultValues.first_name}
            className={inputClass}
          />
        </Field>
        <Field label="Last Name" required variant={variant}>
          <Input
            name="last_name"
            required
            defaultValue={defaultValues.last_name}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Preferred Name" variant={variant}>
        <Input
          name="preferred_name"
          placeholder="Leave blank to use first name"
          defaultValue={defaultValues.preferred_name}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date of Birth" variant={variant}>
          <Input type="date" name="dob" defaultValue={defaultValues.dob} className={inputClass} />
        </Field>
        <Field label="Graduation" variant={variant}>
          <div className="flex gap-2">
            <select
              name="graduation_semester"
              defaultValue={graduation.semester}
              className={selectClass}
            >
              <option value="">Semester</option>
              <option value="Spring">Spring</option>
              <option value="Fall">Fall</option>
            </select>
            <Input
              name="graduation_year"
              placeholder="2026"
              maxLength={4}
              defaultValue={graduation.year}
              className={`${inputClass} w-24`}
            />
          </div>
        </Field>
      </div>

      <Field label="Major" variant={variant}>
        <Input
          name="major"
          placeholder="e.g. Computer Science"
          defaultValue={defaultValues.major}
          className={inputClass}
        />
      </Field>

      {/* Shows in the directory. It matters most for rushees, whose card has
          no pledge class, graduation date or exec title to fill it out, but
          it's on everyone's profile — there's nothing rush-specific about a
          person describing themselves. 600 matches the cap in
          userController.updateProfile, which truncates rather than rejects. */}
      <Field label="About Me" variant={variant}>
        <textarea
          name="about_me"
          rows={4}
          maxLength={600}
          placeholder="A sentence or two about yourself. What you're studying, what you're into, what you're hoping to get out of KTP."
          defaultValue={defaultValues.about_me}
          className={`${inputClass} resize-y`}
        />
      </Field>

      {/* Two addresses on purpose. A UGA address stops working after
          graduation, so the personal one is what still reaches an alumnus —
          and a rushee may not have a UGA address yet. Neither is required. */}
      <div className={`grid grid-cols-1 gap-4 ${isAlumni ? '' : 'sm:grid-cols-2'}`}>
        {!isAlumni && (
        <Field label="UGA Email" variant={variant}>
          <Input
            type="email"
            name="email"
            placeholder="you@uga.edu"
            defaultValue={defaultValues.email}
            className={inputClass}
          />
        </Field>
        )}
        <Field label="Personal Email" variant={variant}>
          <Input
            type="email"
            name="personal_email"
            placeholder="you@gmail.com"
            defaultValue={defaultValues.personal_email}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Phone Number" variant={variant}>
          <Input
            type="tel"
            name="phone"
            placeholder="(555) 000-0000"
            defaultValue={defaultValues.phone}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="LinkedIn URL" variant={variant}>
        <Input
          name="linkedin_url"
          placeholder="https://linkedin.com/in/..."
          defaultValue={defaultValues.linkedin_url}
          maxLength={300}
          onChange={() => linkedinError && setLinkedinError(null)}
          aria-invalid={linkedinError ? 'true' : undefined}
          className={cn(inputClass, linkedinError && 'border-red-500 focus-visible:ring-red-500')}
        />
        {linkedinError ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{linkedinError}</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Paste your profile link, or just your handle. Leave blank to remove it.
          </p>
        )}
      </Field>

      {/* A rushee has no pledge class yet — that's the thing they're rushing
          to get. It reappears automatically once they're given the group. */}
      {!isRushee && (
        <Field label="Pledge Class" variant={variant}>
          <Input
            name="pledge_class"
            placeholder="e.g. Alpha, Beta, Gamma"
            defaultValue={defaultValues.pledge_class}
            className={inputClass}
          />
        </Field>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
          {success}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className={`w-full text-white font-semibold tracking-wider py-3 uppercase ${ACCENT_BUTTON[buttonAccent]}`}
      >
        {loading ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
