'use client';

import { usePortalAccent } from '@/components/portal/PortalAccentContext';
import MessagesPage from '@/components/portal/MessagesPage';

export default function AdminMessagesPage() {
  const accent = usePortalAccent();
  return <MessagesPage accent={accent} />;
}
