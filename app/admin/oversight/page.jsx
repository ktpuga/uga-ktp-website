'use client';

import OversightTabs from '@/components/admin/OversightTabs';

// Reports and Activity Log, merged into one page with two tabs. proxy.ts
// already refuses all of /admin to anyone outside the eboard group, so there is
// no access check here.
export default function AdminOversightPage() {
  return <OversightTabs />;
}
