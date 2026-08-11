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

// `error` is the API's message for THIS field, placed here rather than in the
// banner at the top of the form. It lives on Field instead of on each input so
// there is one piece of markup to keep consistent: the alternative is the
// bespoke per-field block that `email` and `linkedin_url` already carry, and
// two of those had already drifted apart in colour class.
//
// Rendered inside the same <div> as the label and input, so a long message
// reflows the field rather than the grid row next to it.
//
// `name` is the API's field key, which is not always an input's `name`.
// Graduation forces the distinction: the API rejects `graduation_date`, but the
// form collects it as two inputs, `graduation_semester` and `graduation_year`.
// Anchoring `data-field` on this wrapper rather than looking up an input by
// name means the scroll-into-view works for every field including that one.
function Field({ label, required, variant, children, error, name }) {
  const labelClass =
    variant === 'onboarding'
      ? 'block text-sm font-medium text-white/80 mb-1'
      : 'block text-sm font-medium text-foreground mb-1';

  return (
    <div data-field={name}>
      <label className={labelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
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

  // An alumnus's UGA address stops working once they graduate, so asking them
  // to keep one on file is asking for a dead inbox — the personal address is
  // the only one that still reaches them. The field is dropped rather than
  // relabelled; the API withholds the same value from the directory
  // (memberModel.ALUMNI_EMAIL) and preserves whatever is already stored on
  // save (userModel.updateProfile), so hiding it here loses nothing.
  //
  // Prefers member_group, the single group the API resolved, over the raw
  // session list, for the reason messagesController spells out: Authentik
  // doesn't remove someone's old group, so the list can still say "active"
  // for an alumnus. /complete-profile renders this form with no defaults at
  // all, which is what the fallback is for.
  const isAlumni = defaultValues.member_group
    ? defaultValues.member_group === 'alumni'
    : groups.includes('alumni') &&
      !groups.some((g) => ['eboard', 'chair', 'active'].includes(g));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [linkedinError, setLinkedinError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  // Errors the API attributed to a specific input, keyed by its `name`. The two
  // states above are the CLIENT-side pre-checks, which run before the request
  // and are a different thing: they save a round trip, this reports what the
  // server actually refused. Both can be showing at once on different fields.
  const [serverFieldError, setServerFieldError] = useState(null);

  // The API names one field per rejection, so at most one of these is ever
  // non-null. Written as a lookup rather than a per-field state so adding a
  // field to the form does not mean adding a piece of error plumbing too.
  const fieldError = (name) =>
    serverFieldError?.field === name ? serverFieldError.message : undefined;

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
    setServerFieldError(null);
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

    // Everyone except alumni must have a UGA address on file — it's the one
    // identity fact the chapter can rely on, and the key an archived account is
    // reclaimed by. Mirrors requiresUgaEmail + isUgaAddress in the API, which
    // is what actually enforces it; this is only here so a typo lands next to
    // the field instead of coming back as a banner.
    //
    // Domain is taken from the last "@" and compared exactly (or as a
    // ".uga.edu" suffix) for the same reason the API does it that way: an
    // endsWith('uga.edu') check would accept "notuga.edu", and a substring
    // check would accept "uga.edu.example.com".
    if (!isAlumni) {
      const raw = String(formData.get('email') ?? '').trim();
      const at = raw.lastIndexOf('@');
      const domain = at === -1 ? '' : raw.slice(at + 1).toLowerCase();
      const isUga = domain === 'uga.edu' || domain.endsWith('.uga.edu');

      if (!raw) {
        setEmailError('Your UGA email is required.');
        setLoading(false);
        return;
      }
      if (!isUga) {
        setEmailError('That isn’t a UGA address — it must end in @uga.edu.');
        setLoading(false);
        return;
      }
    }
    setEmailError(null);

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
        //
        // updateProfile returns { error } rather than throwing, so a rejected
        // field arrives with the API's own message ("Phone number must have
        // between 7 and 15 digits") instead of React's #441 digest. The catch
        // stays for the redirect it has to rethrow, and as a backstop.
        const saved = await updateProfile(buildProfilePayload(formData));
        result = saved?.error ? { error: saved.error, field: saved.field } : { success: true };
      } catch (err) {
        if (isRedirectError(err)) throw err;
        result = { error: err.message ?? 'Failed to save profile. Please try again.' };
      }
    }

    if (result.error) {
      // A named field gets the message beside it. Everything else — a 500, a
      // network failure, an older API that sends no `field` — still needs the
      // banner, because a message with nowhere to go must not silently vanish.
      if (result.field) {
        setServerFieldError({ field: result.field, message: result.error });
        setError(null);
        // The field can be off-screen on a long form, so a message placed next
        // to it is invisible without this and the save looks like it did
        // nothing at all. Optional chaining because an unrecognised field key
        // must not throw — the message is already rendered either way.
        document.querySelector(`[data-field="${CSS.escape(result.field)}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setError(result.error);
      }
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

  // Clearing on change is handled once on the form rather than with an onChange
  // on each input: the message is stale the moment the offending field is
  // edited, and per-input handlers is how `email` and `linkedin_url` each ended
  // up with their own copy of this logic. Only the named field clears it, so
  // editing an unrelated input leaves the message where it is.
  return (
    <form
      onSubmit={handleSubmit}
      onChange={(e) => {
        if (serverFieldError && e.target?.name === serverFieldError.field) {
          setServerFieldError(null);
        }
      }}
      className="space-y-4"
    >
      <ProfilePictureField authentikId={authentikId} variant={variant} />

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
        <Field label="First Name" required variant={variant} name="first_name" error={fieldError('first_name')}>
          <Input
            name="first_name"
            required
            maxLength={100}
            defaultValue={defaultValues.first_name}
            className={inputClass}
          />
        </Field>
        <Field label="Last Name" required variant={variant} name="last_name" error={fieldError('last_name')}>
          <Input
            name="last_name"
            required
            maxLength={100}
            defaultValue={defaultValues.last_name}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Preferred Name" variant={variant} name="preferred_name" error={fieldError('preferred_name')}>
        <Input
          name="preferred_name"
          placeholder="Leave blank to use first name"
          maxLength={100}
          defaultValue={defaultValues.preferred_name}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date of Birth" variant={variant} name="dob" error={fieldError('dob')}>
          <Input type="date" name="dob" defaultValue={defaultValues.dob} className={inputClass} />
        </Field>
        <Field label="Graduation" variant={variant} name="graduation_date" error={fieldError('graduation_date')}>
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

      <Field label="Major" variant={variant} name="major" error={fieldError('major')}>
        <Input
          name="major"
          placeholder="e.g. Computer Science"
          maxLength={120}
          defaultValue={defaultValues.major}
          className={inputClass}
        />
      </Field>

      {/* Shows in the directory. It matters most for rushees, whose card has
          no pledge class, graduation date or exec title to fill it out, but
          it's on everyone's profile — there's nothing rush-specific about a
          person describing themselves. 600 matches the cap in
          userController.updateProfile, which truncates rather than rejects. */}
      <Field label="About Me" variant={variant} name="about_me" error={fieldError('about_me')}>
        <textarea
          name="about_me"
          rows={4}
          maxLength={600}
          placeholder="A sentence or two about yourself. What you're studying, what you're into, what you're hoping to get out of KTP."
          defaultValue={defaultValues.about_me}
          className={`${inputClass} resize-y`}
        />
      </Field>

      {/* Two addresses on purpose, and the split is now asymmetric: the UGA
          one is REQUIRED for everyone except alumni, the personal one never is.

          Rushees are not an exception. An earlier version of this form left
          both optional partly because "a rushee may not have a UGA address
          yet" — that isn't true here; every rushee already has one by the time
          they sign up. Don't reintroduce that reasoning to loosen the rule.

          The personal address survives for the alumni case alone: a UGA
          address stops working after graduation, so it's the only one that
          still reaches an alumnus.

          Alumni get only the personal one: see isAlumni above. Their row may
          still hold a UGA address, and omitting the input here means the save
          doesn't send one — which is exactly why the API preserves it rather
          than taking NULL from the payload. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!isAlumni && (
          <Field label="UGA Email" required variant={variant} name="email" error={fieldError('email')}>
            <Input
              type="email"
              name="email"
              required
              placeholder="you@uga.edu"
              defaultValue={defaultValues.email}
              onChange={() => emailError && setEmailError(null)}
              aria-invalid={emailError ? 'true' : undefined}
              className={cn(inputClass, emailError && 'border-red-500 focus-visible:ring-red-500')}
            />
            {emailError ? (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{emailError}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Must be your @uga.edu address.</p>
            )}
          </Field>
        )}
        <Field label={isAlumni ? 'Email' : 'Personal Email'} variant={variant} name="personal_email" error={fieldError('personal_email')}>
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
        <Field label="Phone Number" variant={variant} name="phone" error={fieldError('phone')}>
          <Input
            type="tel"
            name="phone"
            placeholder="(555) 000-0000"
            maxLength={25}
            defaultValue={defaultValues.phone}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="LinkedIn URL" variant={variant} name="linkedin_url" error={fieldError('linkedin_url')}>
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
        <Field label="Pledge Class" variant={variant} name="pledge_class" error={fieldError('pledge_class')}>
          <Input
            name="pledge_class"
            placeholder="e.g. Alpha, Beta, Gamma"
            maxLength={50}
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
