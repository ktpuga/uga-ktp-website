import EditProfilePage from '@/components/profile/EditProfilePage';

export const metadata = { title: 'Member Portal Settings' };

export default function MemberSettingsPage() {
  return <EditProfilePage accent="blue" portalLabel="member" />;
}
