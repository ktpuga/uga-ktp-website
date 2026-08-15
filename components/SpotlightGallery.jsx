import { Sparkles } from 'lucide-react';

function LinkedInPostCard({ link, index }) {
  return (
    <article className="h-[42rem] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
      <iframe
        src={link}
        title={`Embedded LinkedIn spotlight post ${index + 1}`}
        className="h-full w-full bg-white"
        loading="lazy"
        allowFullScreen
      />
    </article>
  );
}

export default function SpotlightGallery({ links }) {
  if (!links.length) {
    return (
      <div className="rounded-[2rem] border border-blue-100 bg-white px-6 py-16 text-center shadow-sm sm:px-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#14326E]">
          <Sparkles size={30} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-[#14326E]">Chapter stories are coming soon</h2>
        <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600">
          We are gathering member wins, projects, internships, research, and community achievements to share here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 min-[1700px]:grid-cols-4">
      {links.map((link, index) => <LinkedInPostCard key={link} link={link} index={index} />)}
    </div>
  );
}
