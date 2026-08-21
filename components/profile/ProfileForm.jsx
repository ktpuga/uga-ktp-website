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
import PronounsField from '@/components/profile/PronounsField';
import { updateProfile, uploadProfilePicture } from '@/lib/portal-api';
import { saveProfile } from '@/app/complete-profile/actions';
import { isRedirectError } from '@/lib/is-redirect-error';
import { linkedinHref } from '@/lib/portal-format';
import { PROFILE_LIMITS } from '@/lib/text-limits';
import { LinksField, LinksHiddenInput, useProfileLinks } from './LinksField';
import { profilePictureSrc, announceProfilePictureChange } from '@/lib/avatar';
import { cn } from '@/lib/utils';

function ProfilePictureField({ authentikId, assetId, variant }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  // The Immich asset id, seeded from the saved profile and replaced by whatever
  // the upload returns. This used to be a counter starting at 0, which changed
  // the URL only after an upload in this session: the member saw their own new
  // photo, and every other surface in the portal kept the old one. Keying on
  // the real id means the URL is the same for everyone looking at this member
  // and changes for all of them at once. See lib/avatar.js.
  const [currentAssetId, setCurrentAssetId] = useState(assetId ?? null);

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
        // Fall back to a timestamp only if the API ever stops returning the id.
        // Repainting with a stale URL would show the member the picture they
        // just replaced and read as a failed upload, which is worse than
        // spending one uncached fetch.
        const nextId = result?.profile_picture_asset_id ?? String(Date.now());
        setCurrentAssetId(nextId);
        announceProfilePictureChange(nextId);
      }
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to upload photo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const labelClass = variant === 'onboarding' ? 'text-white/75' : 'text-foreground';

  return (
    <div className={cn('flex items-center gap-4', variant === 'onboarding' && 'rounded-2xl border border-white/10 bg-black/10 p-4')}>
      <Avatar className={cn('h-16 w-16', variant === 'onboarding' && 'ring-2 ring-[#d4af37]/70 ring-offset-2 ring-offset-[#14326E]')}>
        {authentikId && (
          <AvatarImage
            src={profilePictureSrc(authentikId, currentAssetId)}
            alt="Profile picture"
          />
        )}
        <AvatarFallback>
          <User className="h-6 w-6 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      <div>
        <label className={`inline-block cursor-pointer text-sm font-semibold underline decoration-white/30 underline-offset-4 transition-colors hover:text-[#f0d060] hover:decoration-[#f0d060] ${labelClass}`}>
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
  onboarding: 'border border-[#f0d060] bg-[#d4af37] text-[#1a1a1a] hover:bg-[#f0d060]',
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
      ? 'mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-white/70'
      : 'block text-sm font-medium text-foreground mb-1';

  return (
    <div data-field={name}>
      <label className={labelClass}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className={cn('mt-1.5 text-xs font-medium text-red-600 dark:text-red-400', variant === 'onboarding' && 'text-red-200')}>{error}</p>
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

  // Shared with AdminEditProfileModal. See components/profile/LinksField.jsx
  // for why: both forms feed the same whole-row payload builder, so a form that
  // forgets this field erases the member's links on an unrelated save.
  const linkRows = useProfileLinks(defaultValues.links);

  const inputClass =
    variant === 'onboarding'
      ? 'rounded-xl border-white/15 bg-slate-950/30 px-4 text-white placeholder:text-white/35 shadow-inner shadow-black/10 focus-visible:border-[#d4af37]/80 focus-visible:bg-slate-950/45 focus-visible:ring-4 focus-visible:ring-[#d4af37]/15'
      : '';

  // ⚠ The `[&>option]` rules are load-bearing, not decoration.
  //
  // `inputClass` sets `text-white`, which is right for the closed select sitting
  // on the onboarding form's dark background. But the OPEN dropdown is drawn by
  // the operating system on its own light popup, and the options inherit that
  // white text -- so the choices were white on white and effectively invisible.
  //
  // Colour AND background are both set on purpose. A browser that honours
  // neither renders its own readable default; one that honours only `color`
  // still gives dark text on a light popup. Setting a DARK option background
  // instead would look tidier here and fail the other way: ignored background
  // plus honoured colour puts white text back on a white popup.
  const selectClass =
    variant === 'onboarding'
      ? `${inputClass} h-10 flex-1 border py-2 text-sm [&>option]:bg-white [&>option]:text-slate-900`
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
    // Gated on the field actually being rendered — see the JSX below. The
    // builder no longer asks for a UGA address (enrollment collects it), and a
    // required-field check on an input that does not exist would block every
    // first save with a message pointing at nothing.
    if (!isAlumni && mode === 'edit') {
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
        setEmailError('That isn’t a UGA address. It must end in @uga.edu.');
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
      className={cn('space-y-5', variant === 'onboarding' && 'space-y-6')}
    >
      <ProfilePictureField
        authentikId={authentikId}
        assetId={defaultValues.profile_picture_asset_id}
        variant={variant}
      />

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

      {/* Beside Preferred Name on purpose: both answer "what do I call you",
          and they are the two fields somebody scanning the form for that will
          look for together. */}
      <Field label="Pronouns" variant={variant} name="pronouns" error={fieldError('pronouns')}>
        <PronounsField
          defaultValue={defaultValues.pronouns}
          selectClass={selectClass}
          inputClass={inputClass}
        />
      </Field>

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

      {/* "Your Major(s)" is how the interest form has always asked it, and the
          answers have always been prose ("Computer Science and Finance"). The
          label changed; the column did not. A plural array would mean touching
          every directory card, the public roster and the decision-night slide
          to render a list where they render a string, for no answer the box
          cannot already hold. */}
      <Field label="Major(s)" variant={variant} name="major" error={fieldError('major')}>
        <Input
          name="major"
          placeholder="e.g. Computer Science, or Finance and MIS"
          maxLength={120}
          defaultValue={defaultValues.major}
          className={inputClass}
        />
      </Field>

      {/* ── Rush interest form ──
          The questions the chapter used to collect in Google Forms, asked here
          instead so a rushee fills them in while building their profile rather
          than in a second place that nobody links back to the account.

          RUSHEE-ONLY, and gated the same way Pledge Class below is: on
          `isRushee`, which is rush-and-nothing-else. The columns are on every
          user and the API validates them for everyone -- only the form is
          gated, matching `doing_now` and `about_me`.

          ⚠ WHAT NOT TO DO HERE. These three inputs disappearing is load-bearing
          for a rushee who becomes a pledge: `buildProfilePayload` keys off
          `formData.has('gpa')` and OMITS all three when they are not rendered,
          which tells the API to leave the stored values alone. Render them for
          everyone "so the payload is consistent" and a pledge's next profile
          save writes three nulls over the pledge committee's own record.
          See lib/profile.js. */}
      {isRushee && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Minor(s) and Certificates"
              variant={variant}
              name="minors"
              error={fieldError('minors')}
            >
              <Input
                name="minors"
                placeholder="e.g. Spanish minor, New Media Certificate"
                maxLength={PROFILE_LIMITS.MINORS}
                defaultValue={defaultValues.minors}
                className={inputClass}
              />
            </Field>
            {/* type="text" with inputMode="decimal", not type="number".
                A number input silently discards a value it cannot parse on some
                browsers, so a rushee who typed "3.8/4.0" would watch the box
                empty itself with no message -- and it renders spinner arrows on
                a field where stepping by 1 is meaningless. The API's rule is
                the real one either way; pattern only brings the phone keypad up
                with a decimal point on it. */}
            <Field label="GPA" variant={variant} name="gpa" error={fieldError('gpa')}>
              <Input
                name="gpa"
                type="text"
                inputMode="decimal"
                placeholder="3.75"
                maxLength={4}
                defaultValue={defaultValues.gpa}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Up to two decimal places. Use your high school GPA if you have not finished a
                semester at UGA yet.
              </p>
            </Field>
          </div>

          <Field
            label="How did you hear about KTP?"
            variant={variant}
            name="heard_from"
            error={fieldError('heard_from')}
          >
            <Input
              name="heard_from"
              placeholder="e.g. Instagram, a current member, the involvement fair"
              maxLength={PROFILE_LIMITS.HEARD_FROM}
              defaultValue={defaultValues.heard_from}
              className={inputClass}
            />
          </Field>
        </>
      )}

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

      {/* Alumni only, and only the FORM is gated — the column is on every user
          and the API validates it for everyone. A column gated to one group has
          to be migrated the day somebody changes group, which happens here
          every spring; `about_me` set that precedent deliberately.

          Free text rather than a company/title pair because it has to cover
          "Law school at Emory" and "Taking a year off" as comfortably as it
          covers a job, and a structured pair forces those into a box built for
          something else. */}
      {isAlumni && (
        <Field
          label="What you're doing now"
          variant={variant}
          name="doing_now"
          error={fieldError('doing_now')}
        >
          <Input
            name="doing_now"
            placeholder="e.g. SWE at Google, or Law school at Emory"
            maxLength={PROFILE_LIMITS.DOING_NOW}
            defaultValue={defaultValues.doing_now}
            className={inputClass}
          />
        </Field>
      )}

      <LinksField
        links={linkRows.links}
        variant={variant}
        inputClass={inputClass}
        error={fieldError('links')}
        onAdd={linkRows.add}
        onRemove={linkRows.remove}
        onEdit={linkRows.edit}
      />
      <LinksHiddenInput submittable={linkRows.submittable} />

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
          than taking NULL from the payload.

          THE BUILDER DOESN'T ASK FOR IT AT ALL (mode === 'create'). The
          Authentik enrollment prompt collects the UGA address now and
          POST /users/sync seeds it onto the row at first login, so by the time
          anyone reaches this form the address is already on file — asking again
          is asking someone to retype something we have. The edit form keeps the
          field so it stays correctable.

          Omitting the input is what makes buildProfilePayload drop the key
          (it uses formData.has for this one field), and an absent key is what
          tells the API to defer to the stored address instead of demanding one.
          Re-adding the input here without understanding that chain will 400
          every first save. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!isAlumni && mode === 'edit' && (
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
        <p className={cn('rounded-xl border px-4 py-3 text-sm', variant === 'onboarding' ? 'border-red-300/35 bg-red-500/15 text-red-50' : 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400')}>
          {error}
        </p>
      )}

      {success && (
        <p className={cn('rounded-xl border px-4 py-3 text-sm', variant === 'onboarding' ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-50' : 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400')}>
          {success}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className={cn('w-full py-3.5 font-semibold uppercase tracking-wider shadow-lg transition-all disabled:hover:translate-y-0', variant === 'onboarding' ? 'text-[#1a1a1a] hover:-translate-y-0.5' : 'text-white', ACCENT_BUTTON[buttonAccent])}
      >
        {loading ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
