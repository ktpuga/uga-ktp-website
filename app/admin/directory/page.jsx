'use client';

import MemberDirectory from '@/components/portal/MemberDirectory';
import { usePortalAccent } from '@/components/portal/PortalAccentContext';

// Exactly the directory the member and pledge portals render, in the admin
// portal's colour. Deliberately the same component rather than an admin-shaped
// variant: eboard reads it for the same reason everyone else does, and a second
// copy is how the two would drift.
export default function AdminDirectory() {
  const accent = usePortalAccent();
  return (
    <MemberDirectory
      title="Directory"
      description="Browse every member group and this season's rushees"
      theme={accent}
    />
  );
}
