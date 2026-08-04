'use client';

import { useEffect, useState } from 'react';
import AnnouncementsFeed from '@/components/portal/AnnouncementsFeed';
import { getCommittees } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';

// Committees are fetched only to turn an announcement's committee_id into a
// name for the badge. A failure just leaves the badge unnamed rather than
// breaking the page, so this needs no error state.
export default function PledgeAnnouncements() {
  const [committees, setCommittees] = useState([]);

  useEffect(() => {
    getCommittees()
      .then((data) => setCommittees(Array.isArray(data) ? data : []))
      .catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  return (
    <AnnouncementsFeed
      portalLabel="Pledge Portal"
      description="Updates from the chapter and your pledge class"
      committees={committees}
    />
  );
}
