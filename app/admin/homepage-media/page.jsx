import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import HomepageMediaTabs from '@/components/portal/HomepageMediaTabs';
import { getSlideshowAccessState } from '@/lib/slideshow-auth.cjs';

export const metadata = { title: 'Homepage Media' };

// The slideshow half carried this eboard check when it was its own route, so it
// stays on the merged page. It locks nobody new out of the photo half: proxy.ts
// already refuses all of /admin to anyone outside the eboard group.
export default async function AdminHomepageMediaPage() {
  const session = await auth();
  const groups = session?.user?.groups ?? [];
  const access = getSlideshowAccessState({ session, groups });

  if (!access.allowed) redirect(access.redirectTo);

  return <HomepageMediaTabs />;
}
