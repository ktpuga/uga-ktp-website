import EditProfilePage from '@/components/profile/EditProfilePage';

export const metadata = { title: 'Settings — Alumni Portal' };

export default function AlumniSettingsPage() {
  return <EditProfilePage accent="amber" portalLabel="alumni" />;
}
