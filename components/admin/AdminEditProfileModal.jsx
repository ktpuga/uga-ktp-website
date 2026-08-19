'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Trash2, Upload } from 'lucide-react';
import { buildProfilePayload, parseGraduationDate } from '@/lib/profile';
import {
  adminUpdateUserProfile,
  adminUpdateUsername,
  adminRemoveProfilePicture,
  adminUploadProfilePicture,
  adminUpdateTraits,
} from '@/lib/portal-api';
import { memberDisplayName } from '@/lib/portal-format';
import { PROFILE_LIMITS } from '@/lib/text-limits';
import { LinksField, LinksHiddenInput, useProfileLinks } from '@/components/profile/LinksField';
import TraitsField, { useTraitRows } from '@/components/profile/TraitsField';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { isRedirectError } from '@/lib/is-redirect-error';

// Eboard editing another member's profile.
//
// Deliberately NOT a reuse of profile/ProfileForm. That component reads the
// SESSION to decide which fields to show — isRushee and isAlumni are about
// whoever is logged in, which here is the eboard member, not the person being
// edited. Pointing it at someone else would show the wrong field set and post
// to the wrong route. The two forms share what actually matters instead:
// buildProfilePayload, so both send byte-identical bodies, and the API's
// services/profileFields.js, so both are validated by the same rules.
//
// Every field is shown, including UGA Email for alumni (which members don't
// see on their own form). This is the surface for fixing bad data, and the
// directory masks an alumnus's UGA address on read regardless.

// `error` and `name` work the same way as in components/profile/ProfileForm.jsx
// — see the note there. Both forms post to the same normalizer in the API
// (services/profileFields.js), so they get the same field key back and must
// present it the same way; eboard editing someone else's profile hits exactly
// the rejections a member hits editing their own.
function Field({ label, children, hint, error, name }) {
  return (
    <div data-field={name}>
      <label className="mb-1 block text-xs font-medium text-foreground">{label}</label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-[11px] text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function AdminEditProfileModal({ user, onClose, onSaved }) {
  const confirm = useConfirm();
  const formRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // The API's per-field rejection, placed next to the input it names. See the
  // Field comment above.
  const [serverFieldError, setServerFieldError] = useState(null);
  const fieldError = (name) =>
    serverFieldError?.field === name ? serverFieldError.message : undefined;

  // Username is its own save with its own error, mirroring the API's split:
  // it's the only field that writes to Authentik, and "that name is taken"
  // must not surface as a failure of an unrelated bio edit.
  const [username, setUsername] = useState(user.username ?? '');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  const [usernameSaved, setUsernameSaved] = useState(false);

  // Tracked locally because the card's <img> is keyed off the asset id, and a
  // replacement lands at the same URL — without a version bump the browser
  // serves the cached old picture and the upload looks like it did nothing.
  const [hasPicture, setHasPicture] = useState(Boolean(user.profile_picture_asset_id));
  // Same hook the member's own form uses. See LinksField.jsx: sharing it is
  // what stops this modal from silently clearing links it never rendered.
  const linkRows = useProfileLinks(user.links);
  const traitRows = useTraitRows(user.traits);
  const [traitsError, setTraitsError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const graduation = parseGraduationDate(user.graduation_date);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setServerFieldError(null);
    setTraitsError(null);

    // Same builder the member's own form uses, so the two payloads can't drift.
    const payload = buildProfilePayload(new FormData(formRef.current));

    try {
      // Traits FIRST, deliberately. They are a separate endpoint, so this is
      // two writes behind one button and one of them can fail alone. Doing the
      // riskier, smaller one first means a rejected trait leaves the profile
      // untouched and the modal open on the offending row — whereas saving the
      // profile first would report an error on a form whose other changes had
      // already been committed, which reads as "nothing saved" and invites a
      // second submit.
      const traitResult = await adminUpdateTraits(user.authentik_id, traitRows.submittable);
      if (traitResult?.error) {
        setTraitsError(traitResult.error);
        formRef.current
          ?.querySelector('[data-field="traits"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const result = await adminUpdateUserProfile(user.authentik_id, payload);
      if (result?.error) {
        // Beside the field when the API named one, in the banner otherwise —
        // an error with nowhere to go must never be swallowed.
        if (result.field) {
          setServerFieldError({ field: result.field, message: result.error });
          formRef.current
            ?.querySelector(`[data-field="${CSS.escape(result.field)}"]`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setError(result.error);
        }
        return;
      }
      // The profile response comes from adminUpdateProfile, which does not
      // touch traits — so fold the saved traits back in, or the row behind this
      // modal re-renders with the old ones and the save looks half-applied.
      onSaved({ ...result, traits: traitResult.traits });
      onClose();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveUsername() {
    const next = username.trim();
    if (!next || next === user.username) return;

    setUsernameSaving(true);
    setUsernameError(null);
    setUsernameSaved(false);
    try {
      const result = await adminUpdateUsername(user.authentik_id, next);
      if (result?.error) {
        setUsernameError(result.error);
        return;
      }
      setUsernameSaved(true);
      onSaved({ ...user, username: result.username });
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setUsernameError(err.message ?? 'Failed to change username');
    } finally {
      setUsernameSaving(false);
    }
  }

  // Uploads on file select, with no separate save step — matching the member's
  // own picture field, which behaves the same way.
  async function handleUploadPicture(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await adminUploadProfilePicture(user.authentik_id, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setHasPicture(true);
      onSaved({ ...user, profile_picture_asset_id: result.profile_picture_asset_id });
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to upload profile picture');
    } finally {
      setUploading(false);
      // Cleared so re-picking the same file fires change again.
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleRemovePicture() {
    const ok = await confirm(
      `Remove ${memberDisplayName(user)}'s profile picture? Their card will fall back to their initials. They are not notified.`,
      { title: 'Remove profile picture', confirmLabel: 'Remove' }
    );
    if (!ok) return;

    try {
      const result = await adminRemoveProfilePicture(user.authentik_id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setHasPicture(false);
      onSaved({ ...user, profile_picture_asset_id: null });
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to remove profile picture');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${memberDisplayName(user)}'s profile`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              Edit {memberDisplayName(user)}&apos;s profile
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              You are editing someone else&apos;s profile. They are not notified, and the change is
              recorded in the activity log.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cleared once here rather than per input: the message is stale as
            soon as the offending field is edited, and only that field clears
            it, so editing something else leaves it in place. */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onChange={(e) => {
            if (serverFieldError && e.target?.name === serverFieldError.field) {
              setServerFieldError(null);
            }
          }}
          className="space-y-4 px-5 py-4"
        >
          {/* Username saves on its own — see the state comment above. */}
          <Field
            label="Username"
            hint="Shown as @name across the portal. Saved separately, and written to Authentik first."
          >
            <div className="flex items-center gap-2">
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError(null);
                  setUsernameSaved(false);
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveUsername}
                disabled={usernameSaving || !username.trim() || username.trim() === user.username}
              >
                {usernameSaving ? 'Saving…' : 'Save name'}
              </Button>
            </div>
            {usernameError && <p className="mt-1 text-xs text-red-600">{usernameError}</p>}
            {usernameSaved && <p className="mt-1 text-xs text-green-700">Username updated.</p>}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First Name" name="first_name" error={fieldError('first_name')}>
              <Input name="first_name" required maxLength={100} defaultValue={user.first_name ?? ''} />
            </Field>
            <Field label="Last Name" name="last_name" error={fieldError('last_name')}>
              <Input name="last_name" required maxLength={100} defaultValue={user.last_name ?? ''} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Preferred Name" name="preferred_name" error={fieldError('preferred_name')}>
              <Input name="preferred_name" maxLength={100} defaultValue={user.preferred_name ?? ''} />
            </Field>
            <Field label="Date of Birth" name="dob" error={fieldError('dob')}>
              <Input type="date" name="dob" defaultValue={(user.dob ?? '').split('T')[0]} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Major(s)" name="major" error={fieldError('major')}>
              <Input name="major" maxLength={120} defaultValue={user.major ?? ''} />
            </Field>
            <Field label="Graduation" name="graduation_date" error={fieldError('graduation_date')}>
              <div className="flex gap-2">
                <select
                  name="graduation_semester"
                  defaultValue={graduation.semester}
                  className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="">Semester</option>
                  <option value="Spring">Spring</option>
                  <option value="Fall">Fall</option>
                </select>
                <Input
                  name="graduation_year"
                  maxLength={4}
                  placeholder="2026"
                  defaultValue={graduation.year}
                  className="w-24"
                />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              name="email"
              error={fieldError('email')}
              label="UGA Email"
              hint={
                user.member_group === 'alumni'
                  ? "Hidden from alumni on their own form and in the directory, but editable here."
                  : undefined
              }
            >
              <Input type="email" name="email" defaultValue={user.email ?? ''} />
            </Field>
            <Field label="Personal Email" name="personal_email" error={fieldError('personal_email')}>
              <Input type="email" name="personal_email" defaultValue={user.personal_email ?? ''} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone Number" name="phone" error={fieldError('phone')}>
              <Input type="tel" name="phone" maxLength={25} defaultValue={user.phone ?? ''} />
            </Field>
            <Field label="Pledge Class" name="pledge_class" error={fieldError('pledge_class')}>
              <Input name="pledge_class" maxLength={50} defaultValue={user.pledge_class ?? ''} />
            </Field>
          </div>

          <Field label="LinkedIn URL" hint="Rejected if it isn't a real LinkedIn profile link. Leave blank to remove." name="linkedin_url" error={fieldError('linkedin_url')}>
            <Input name="linkedin_url" maxLength={300} defaultValue={user.linkedin_url ?? ''} />
          </Field>

          <Field label="About Me" hint="Truncated to 600 characters." name="about_me" error={fieldError('about_me')}>
            <textarea
              name="about_me"
              rows={4}
              maxLength={600}
              defaultValue={user.about_me ?? ''}
              className="flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>

          {/* Rush interest form. Rushee-only on the member's own form; shown to
              eboard for EVERYONE here, and that is not a courtesy — it is the
              same rule the links field below spells out.

              This modal builds its payload with buildProfilePayload and the
              admin write is a whole-row UPDATE, so a field this modal does not
              render is a column this modal NULLs. Gate these on
              `user.member_group === 'rush'` and eboard correcting a typo in a
              new pledge's surname silently erases the GPA the pledge committee
              chose them on.

              (The member form gets away with hiding them because its route
              honours which keys the request carried, and buildProfilePayload
              omits the group entirely when the inputs are absent. The admin
              route deliberately does not work that way — see
              userModel.adminUpdateProfile.) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Minor(s) & Certificates" name="minors" error={fieldError('minors')}>
              <Input
                name="minors"
                maxLength={PROFILE_LIMITS.MINORS}
                defaultValue={user.minors ?? ''}
              />
            </Field>
            <Field
              label="GPA"
              hint="Up to two decimal places."
              name="gpa"
              error={fieldError('gpa')}
            >
              {/* Text, not number — see the member form for why a number input
                  silently eats a value it cannot parse. */}
              <Input
                name="gpa"
                type="text"
                inputMode="decimal"
                maxLength={4}
                defaultValue={user.gpa ?? ''}
              />
            </Field>
            <Field
              label="How they heard about KTP"
              name="heard_from"
              error={fieldError('heard_from')}
            >
              <Input
                name="heard_from"
                maxLength={PROFILE_LIMITS.HEARD_FROM}
                defaultValue={user.heard_from ?? ''}
              />
            </Field>
          </div>

          {/* Alumni-only on the member's own form; shown to eboard for everyone,
              because this modal exists to correct what somebody typed into the
              wrong box and hiding a populated field would make a bad value
              uncorrectable from here. */}
          <Field
            label="What they're doing now"
            hint="Alumni fill this in themselves. Free text: a job, grad school, anything."
            name="doing_now"
            error={fieldError('doing_now')}
          >
            <Input
              name="doing_now"
              maxLength={PROFILE_LIMITS.DOING_NOW}
              defaultValue={user.doing_now ?? ''}
            />
          </Field>

          {/* Not optional to render, and not merely a courtesy. This modal
              builds its payload with buildProfilePayload, exactly like the
              member's form, and the profile write is a whole-row upsert — so a
              modal WITHOUT this field sends `links: []` and wipes the member's
              links every time eboard fixes a typo in their major. Same shape as
              the preserveEmail trap. The shared component is the guard. */}
          <LinksField
            links={linkRows.links}
            inputClass=""
            error={fieldError('links')}
            onAdd={linkRows.add}
            onRemove={linkRows.remove}
            onEdit={linkRows.edit}
          />
          <LinksHiddenInput submittable={linkRows.submittable} />

          {/* Traits save through their own endpoint, NOT the profile payload —
              that is what makes "eboard-only" true of the API rather than just
              of this form. They are submitted alongside the profile save below
              so it still feels like one Save button. */}
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
            <p className="mb-1 text-sm font-medium text-foreground">Traits</p>
            <TraitsField
              rows={traitRows.rows}
              error={traitsError}
              onAdd={traitRows.add}
              onRemove={traitRows.remove}
              onEdit={traitRows.edit}
              disabled={saving}
            />
          </div>

          {/* Upload replaces immediately on select, like the member's own
              picture field. Same 25MB limit and same server-side re-encode to
              JPEG — the admin route reuses the member route's multer config. */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">Profile picture</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {uploading
                  ? 'Uploading…'
                  : hasPicture
                    ? 'Upload a replacement, or remove it to fall back to their initials.'
                    : 'No picture set, so their card shows initials.'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,image/gif,image/tiff"
                onChange={handleUploadPicture}
                className="hidden"
                id={`admin-pfp-${user.authentik_id}`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={13} className="mr-1.5" />
                {hasPicture ? 'Replace' : 'Upload'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRemovePicture}
                disabled={uploading || !hasPicture}
                className="text-red-600"
              >
                <Trash2 size={13} className="mr-1.5" />
                Remove
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
