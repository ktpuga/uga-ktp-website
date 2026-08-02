'use client';

import { usePortalAccent } from '@/components/portal/PortalAccentContext';
import CommitteesPage from '@/components/portal/CommitteesPage';

export default function AdminCommittees() {
  const accent = usePortalAccent();
  return <CommitteesPage accent={accent} />;
}
