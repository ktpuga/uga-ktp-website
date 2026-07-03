import EditProfilePage from '@/components/profile/EditProfilePage';

export const metadata = { title: 'Settings — Admin Portal' };

export default function AdminSettingsPage() {
  return <EditProfilePage accent="red" portalLabel="admin" />;
}
