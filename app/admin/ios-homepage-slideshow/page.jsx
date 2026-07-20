import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import IosHomepageSlideshowManager from '@/components/portal/IosHomepageSlideshowManager';
import { getSlideshowAccessState } from '@/lib/slideshow-auth.cjs';

export const metadata = { title: 'Homepage Slideshow — Admin Portal' };

export default async function AdminSlideshowPage() {
  const session = await auth();
  const groups = session?.user?.groups ?? [];
  const access = getSlideshowAccessState({ session, groups });

  if (!access.allowed) redirect(access.redirectTo);

  return <IosHomepageSlideshowManager />;
}
