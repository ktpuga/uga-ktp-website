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
import { buildProfilePayload, parseGraduationDate } from '@/lib/profile';
import { updateProfile } from '@/lib/portal-api';
import { saveProfile } from '@/app/complete-profile/actions';

const ACCENT_BUTTON = {
  blue: 'bg-blue-800 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
  amber: 'bg-amber-800 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600',
  red: 'bg-red-800 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
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
  const { update } = useSession();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

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
        await updateProfile(buildProfilePayload(formData));
        result = { success: true };
      } catch (err) {
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
    onSuccess?.();
  }

  const buttonAccent = variant === 'onboarding' ? 'onboarding' : accent;
  const submitLabel = mode === 'create' ? 'Complete Profile' : 'Save Changes';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {readOnly.username != null && (
        <Field label="Username" variant={variant}>
          <Input value={readOnly.username} readOnly disabled className={inputClass} />
        </Field>
      )}

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email" variant={variant}>
          <Input
            type="email"
            name="email"
            defaultValue={defaultValues.email}
            className={inputClass}
          />
        </Field>
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
          className={inputClass}
        />
      </Field>

      <Field label="Pledge Class" variant={variant}>
        <Input
          name="pledge_class"
          placeholder="e.g. Alpha, Beta, Gamma"
          defaultValue={defaultValues.pledge_class}
          className={inputClass}
        />
      </Field>

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
