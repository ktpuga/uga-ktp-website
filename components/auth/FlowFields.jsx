'use client';

// Shared presentation for the flow-driven auth forms, plus a GENERIC renderer
// for Authentik's `ak-stage-prompt`.
//
// WHY THE PROMPT RENDERER IS GENERIC. The enrollment prompt's fields — UGA
// email, username, password, confirm password — are configured in Authentik,
// not here. Rendering whatever the challenge describes means the Authentik
// config stays the single source of truth: adding or reordering a prompt there
// changes this form with no deploy, and the two can never disagree about what
// signup asks for. Hardcoding the four would be a second copy of a list that
// already exists, and the copy would rot the first time someone edits the
// stage.

export const inputClass =
  'w-full rounded-xl border border-white/15 bg-slate-950/30 px-4 py-3 text-white placeholder:text-white/35 ' +
  'shadow-inner shadow-black/10 transition-colors focus:border-[#d4af37]/80 focus:bg-slate-950/45 focus:outline-none focus:ring-4 focus:ring-[#d4af37]/15';

export const buttonClass =
  'w-full rounded-xl border border-[#f0d060] bg-[#d4af37] px-4 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-[#1a1a1a] ' +
  'shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#f0d060] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0';

export function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-red-200">{message}</p>;
}

// Authentik prompt types that map onto a plain text-ish input, with the HTML
// input type to use for each. Anything not listed falls through to `text`
// rather than being dropped — an unrendered required field is an unsubmittable
// form, which is worse than a plain box.
const INPUT_TYPES = {
  text: 'text',
  username: 'text',
  email: 'email',
  password: 'password',
  number: 'number',
  date: 'date',
  'date-time': 'datetime-local',
  tel: 'tel',
};

// Autocomplete hints, which matter more here than usual: this form is where a
// password manager should offer to save a new credential, and it only does
// that reliably when the two password fields are marked as new-password.
function autoCompleteFor(field) {
  if (field.type === 'password') return 'new-password';
  if (field.type === 'username') return 'username';
  if (field.type === 'email') return 'email';
  return undefined;
}

export function PromptFields({ fields = [], errors = {} }) {
  // The challenge carries `order`; trust it rather than array position, since
  // that is the field eboard actually edits in the Authentik UI.
  const ordered = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return ordered.map((field) => {
    const key = field.field_key;

    // Structural, not input. `static` is copy the stage wants shown.
    if (field.type === 'static') {
      return (
        <p key={key} className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm leading-relaxed text-white/70">
          {field.initial_value || field.label}
        </p>
      );
    }
    if (field.type === 'separator') {
      return <hr key={key} className="border-white/10" />;
    }
    // Carried through untouched. Dropping it loses flow state.
    if (field.type === 'hidden') {
      return <input key={key} type="hidden" name={key} defaultValue={field.initial_value ?? ''} />;
    }

    if (field.type === 'checkbox') {
      return (
        <div key={key}>
          <label className="flex items-center gap-2.5 text-sm text-white/80">
            <input className="h-4 w-4 rounded border-white/30 bg-slate-950/30 text-[#d4af37] focus:ring-[#d4af37]/40" type="checkbox" name={key} defaultChecked={Boolean(field.initial_value)} />
            {field.label}
          </label>
          <FieldError message={errors[key]} />
        </div>
      );
    }

    if (field.type === 'text_area') {
      return (
        <div key={key}>
          <label htmlFor={key} className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
            {field.label}
          </label>
          <textarea
            id={key}
            name={key}
            rows={3}
            required={field.required}
            placeholder={field.placeholder}
            defaultValue={field.initial_value ?? ''}
            className={inputClass}
          />
          {field.sub_text && <p className="mt-1.5 text-xs leading-relaxed text-white/50">{field.sub_text}</p>}
          <FieldError message={errors[key]} />
        </div>
      );
    }

    return (
      <div key={key}>
        <label htmlFor={key} className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
          {field.label}
          {field.required && <span className="text-white/40"> *</span>}
        </label>
        <input
          id={key}
          name={key}
          type={INPUT_TYPES[field.type] ?? 'text'}
          autoComplete={autoCompleteFor(field)}
          required={field.required}
          placeholder={field.placeholder}
          defaultValue={field.initial_value ?? ''}
          className={inputClass}
        />
        {/* Rendered as TEXT, not HTML. Authentik allows markup in sub_text and
            it is admin-authored, but this page is unauthenticated and there is
            no reason to open an injection path for a help line. */}
        {field.sub_text && <p className="mt-1.5 text-xs leading-relaxed text-white/50">{field.sub_text}</p>}
        <FieldError message={errors[key]} />
      </div>
    );
  });
}
