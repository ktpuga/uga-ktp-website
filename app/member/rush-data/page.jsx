'use client';

import RushInterestTable from '@/components/rush/RushInterestTable';

// The pledge committee's copy. Eboard's is /admin/rush-data, rendering this
// same component.
//
// This route is NOT the access boundary and must not be treated as one: every
// member of the /member portal can navigate here by typing the URL. The nav
// entry is hidden for anyone without the grant, and the API answers 403, which
// the component renders. That split is deliberate -- committee membership lives
// in Postgres and never in the JWT, so proxy.ts cannot check it.
export default function MemberRushDataPage() {
  return <RushInterestTable />;
}
