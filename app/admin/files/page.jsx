'use client';

import { usePortalAccent } from '@/components/portal/PortalAccentContext';
import PhotoFiles from '@/components/portal/PhotoFiles';

export default function AdminFiles() {
  const accent = usePortalAccent();
  return (
    <PhotoFiles
      title="Files & Photos"
      description="Browse chapter photos and shared memories"
      accent={accent}
    />
  );
}
