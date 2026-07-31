import EditProfilePage from '@/components/profile/EditProfilePage';

export const metadata = { title: 'Settings — Pledge Portal' };

export default function PledgeSettingsPage() {
  return <EditProfilePage accent="blue" portalLabel="pledge" />;
}
