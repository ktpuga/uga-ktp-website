'use client';

import { usePortalAccent } from '@/components/portal/PortalAccentContext';
import EditProfilePage from '@/components/profile/EditProfilePage';

// Split out of page.jsx so that file can stay a server component and keep its
// `export const metadata` — Next.js rejects exporting metadata from a module
// marked 'use client', and the accent hook requires one.
export default function AdminSettingsClient() {
  const accent = usePortalAccent();
  return <EditProfilePage accent={accent} portalLabel="admin" />;
}
