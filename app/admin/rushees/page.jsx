'use client';

import MemberDirectory from '@/components/portal/MemberDirectory';
import { usePortalAccent } from '@/components/portal/PortalAccentContext';

export default function AdminRushees() {
  const accent = usePortalAccent();
  return (
    <MemberDirectory
      title="Rushees"
      description="Prospective members who've signed up this rush"
      theme={accent}
      onlyGroup="rush"
    />
  );
}
