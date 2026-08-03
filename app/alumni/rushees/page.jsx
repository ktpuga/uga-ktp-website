'use client';

import MemberDirectory from '@/components/portal/MemberDirectory';

export default function AlumniRushees() {
  return (
    <MemberDirectory
      title="Rushees"
      description="Prospective members who've signed up this rush"
      theme="amber"
      onlyGroup="rush"
    />
  );
}
