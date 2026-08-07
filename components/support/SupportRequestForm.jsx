'use client';

import { useState } from 'react';
import { Mail, Send } from 'lucide-react';

function fieldClassName() {
  return 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#2a5cca] focus:ring-2 focus:ring-[#2a5cca]/20';
}

export default function SupportRequestForm({ supportEmail }) {
  const [status, setStatus] = useState('');
  const isConfigured = Boolean(supportEmail) && !supportEmail.includes('[');

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);

    if (!isConfigured) {
      setStatus('The support email has not been configured yet. Please use the published support contact once it is available.');
      return;
    }

    const subject = encodeURIComponent(`[KTP support] ${values.get('issue') || 'App support request'}`);
    const body = encodeURIComponent([
      `Name: ${values.get('name') || ''}`,
      `Email: ${values.get('email') || ''}`,
      `Device model: ${values.get('device') || 'Not provided'}`,
      `iOS version: ${values.get('iosVersion') || 'Not provided'}`,
      `App version: ${values.get('appVersion') || 'Not provided'}`,
      '',
      'Issue description:',
      values.get('description') || '',
    ].join('\n'));

    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    setStatus('Your email app should open with the support request filled in.');
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="support-form-note">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="support-name" className="text-sm font-semibold text-slate-900">Name</label>
          <input id="support-name" name="name" type="text" autoComplete="name" required className={fieldClassName()} />
        </div>
        <div>
          <label htmlFor="support-email" className="text-sm font-semibold text-slate-900">Email</label>
          <input id="support-email" name="email" type="email" autoComplete="email" required className={fieldClassName()} />
        </div>
        <div>
          <label htmlFor="support-device" className="text-sm font-semibold text-slate-900">Device model</label>
          <input id="support-device" name="device" type="text" autoComplete="off" placeholder="For example, iPhone 15" className={fieldClassName()} />
        </div>
        <div>
          <label htmlFor="support-ios" className="text-sm font-semibold text-slate-900">iOS version</label>
          <input id="support-ios" name="iosVersion" type="text" autoComplete="off" placeholder="For example, iOS 18" className={fieldClassName()} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="support-app-version" className="text-sm font-semibold text-slate-900">App version</label>
          <input id="support-app-version" name="appVersion" type="text" autoComplete="off" placeholder="Shown in the app or App Store listing" className={fieldClassName()} />
        </div>
      </div>

      <div>
        <label htmlFor="support-issue" className="text-sm font-semibold text-slate-900">Issue type</label>
        <input id="support-issue" name="issue" type="text" required placeholder="For example, cannot sign in" className={fieldClassName()} />
      </div>

      <div>
        <label htmlFor="support-description" className="text-sm font-semibold text-slate-900">Issue description</label>
        <textarea id="support-description" name="description" rows="6" required placeholder="Tell us what happened, what you expected, and the steps that reproduce it." className={`${fieldClassName()} resize-y`} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p id="support-form-note" className="text-xs leading-5 text-slate-500">
          Do not include passwords, payment card numbers, authentication codes, or other highly sensitive information.
        </p>
        <button type="submit" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#052039] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103b60] focus:outline-none focus:ring-2 focus:ring-[#2a5cca] focus:ring-offset-2">
          <Send size={15} aria-hidden="true" />
          Email support
        </button>
      </div>

      {status && (
        <p role="status" className="flex items-start gap-2 border-l-2 border-[#f2c14e] pl-3 text-sm leading-6 text-slate-700">
          <Mail size={16} className="mt-1 shrink-0 text-[#8a6200]" aria-hidden="true" />
          {status}
        </p>
      )}
    </form>
  );
}
