'use client';

import AttendancePage from '@/components/portal/AttendancePage';

// No accent prop — AttendancePage reads the portal accent from context, which
// is what makes the admin portal's per-user red/blue preference work here.
export default function AdminAttendance() {
  return <AttendancePage />;
}
