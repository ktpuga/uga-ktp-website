'use client';

import InterviewSignup from '@/components/portal/InterviewSignup';

// Replaced /rushee/meetings — see routes/meetings.js in ktp-api for why that
// surface was the wrong shape for rush interviews.
export default function RusheeInterviews() {
  return <InterviewSignup />;
}
