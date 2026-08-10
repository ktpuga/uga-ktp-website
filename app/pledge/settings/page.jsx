import EditProfilePage from '@/components/profile/EditProfilePage';

export const metadata = { title: 'Pledge Portal Settings' };

export default function PledgeSettingsPage() {
  return <EditProfilePage accent="blue" portalLabel="pledge" />;
}
