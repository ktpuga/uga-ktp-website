'use client';

import { usePortalAccent } from '@/components/portal/PortalAccentContext';
import AttendancePage from '@/components/portal/AttendancePage';

export default function AdminAttendance() {
  const accent = usePortalAccent();
  return <AttendancePage accent={accent} />;
}
