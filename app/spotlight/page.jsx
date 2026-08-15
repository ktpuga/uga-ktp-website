import PublicHeader from '@/components/PublicHeader';
import SpotlightGallery from '@/components/SpotlightGallery';
import Footer from '@/components/ui/footer';
import { pageMetadata } from '@/lib/seo';
import { getHourlySpotlightLinks } from './links';

export const dynamic = 'force-dynamic';

export const metadata = pageMetadata({
  title: 'Spotlight',
  description: 'Celebrate the internships, projects, research, awards, and community achievements of Kappa Theta Pi at UGA.',
  path: '/spotlight',
});

export default function SpotlightPage() {
  const spotlightLinks = getHourlySpotlightLinks(6);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9fc] font-sans text-slate-900">
      <PublicHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[#0f2758] bg-[#14326E] px-4 py-16 text-white sm:px-6 md:py-24">
          <div aria-hidden="true" className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-blue-400/20 blur-[110px]" />
          <div aria-hidden="true" className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-cyan-300/15 blur-[120px]" />
          <div className="relative mx-auto max-w-7xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-200">Phi Chapter Spotlight</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:whitespace-nowrap">Celebrating What Our Members Achieve</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100 md:text-xl">
              A collection of member wins, bold ideas, career milestones, and the work making an impact beyond our chapter.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[110rem] px-4 py-14 sm:px-6 md:py-20">
          <SpotlightGallery links={spotlightLinks} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
