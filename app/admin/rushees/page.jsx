'use client';

import RusheesTabs from '@/components/admin/RusheesTabs';

// Rush Signup and Rushee Data, merged into one page with two tabs.
//
// No access check here on purpose: proxy.ts already refuses all of /admin to
// anyone outside the eboard group. The pledge committee reaches the data half
// through /member/rush-data instead, which is gated by the API rather than by
// the route -- see that page for why.
export default function AdminRusheesPage() {
  return <RusheesTabs />;
}
