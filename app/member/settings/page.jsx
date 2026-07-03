import EditProfilePage from '@/components/profile/EditProfilePage';

export const metadata = { title: 'Settings — Member Portal' };

export default function MemberSettingsPage() {
  return <EditProfilePage accent="blue" portalLabel="member" />;
}
