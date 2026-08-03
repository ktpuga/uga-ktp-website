'use client';

import MemberDirectory from '@/components/portal/MemberDirectory';

export default function MemberRushees() {
  return (
    <MemberDirectory
      title="Rushees"
      description="Prospective members who've signed up this rush"
      theme="blue"
      onlyGroup="rush"
    />
  );
}
