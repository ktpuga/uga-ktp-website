'use client';

import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createReport } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';

const REASONS = ['Harassment or bullying', 'Inappropriate content', 'Spam', 'Impersonation', 'Other'];

const CONTENT_LABEL = {
  user: 'this member',
  message: 'this message',
  group_message: 'this message',
  photo: 'this photo',
};

// Reusable report trigger + dialog — used wherever a user/message/photo can
// be flagged for eboard review. `contentId` is required unless
// contentType === 'user'. `reportedUserId` is the author of the content
// being reported (the caller already knows this from context — a message
// bubble knows its sender, a photo card knows its uploader).
export default function ReportButton({
  contentType,
  contentId,
  reportedUserId,
  className = '',
  iconOnly = true,
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await createReport({ contentType, contentId, reportedUserId, reason, explanation: explanation.trim() });
      setDone(true);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    setOpen(false);
    setDone(false);
    setReason(REASONS[0]);
    setExplanation('');
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="Report"
        className={
          className ||
          `flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 ${
            iconOnly ? 'h-7 w-7 justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/30' : ''
          }`
        }
      >
        <Flag className="h-3.5 w-3.5" />
        {!iconOnly && 'Report'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-5 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-slate-100">Report submitted</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                  Thanks — eboard will review this.
                </p>
                <Button className="mt-4 w-full" onClick={close}>Close</Button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-gray-900 dark:text-slate-100">
                    Report {CONTENT_LABEL[contentType] ?? 'this'}
                  </p>
                  <button type="button" onClick={close} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <Textarea
                  placeholder="Add details (optional)"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <div className="mt-4 flex gap-2">
                  <Button
                    className="flex-1 bg-red-700 hover:bg-red-800"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </Button>
                  <Button variant="outline" onClick={close} disabled={submitting}>Cancel</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
