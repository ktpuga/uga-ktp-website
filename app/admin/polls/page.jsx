'use client';

import { usePortalAccent } from '@/components/portal/PortalAccentContext';
import PollsPage from '@/components/portal/PollsPage';

export default function AdminPolls() {
  const accent = usePortalAccent();
  return <PollsPage accent={accent} />;
}
