'use client';

import RushInterestTable from '@/components/rush/RushInterestTable';

// Eboard's copy. The pledge committee's copy is /member/rush-data, rendering
// this same component -- proxy.ts hard-gates /admin to the eboard group, so a
// committee member on `active` cannot reach this route at all, and an
// eboard-only account is redirected away from /member. Two routes, one
// component; see components/rush/RushInterestTable.jsx.
export default function AdminRushDataPage() {
  return <RushInterestTable />;
}
