'use client';

import { usePortalAccent } from '@/components/portal/PortalAccentContext';
import EventsCalendar from '@/components/portal/EventsCalendar';

export default function AdminCalendar() {
  const accent = usePortalAccent();
  return (
    <EventsCalendar
      title="Calendar"
      description="All chapter events and committee meetings"
      accent={accent}
    />
  );
}
