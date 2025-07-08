/* app/blog/page.tsx ----------------------------------------------------- */
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { ArrowRight } from 'lucide-react';
import { groq, type SanityDocument } from 'next-sanity';
import Link from 'next/link';

import { client } from '../../sanity/client';

/* ---------- 1. Build an image URL (no external helper) ---------- */
const { projectId, dataset } = client.config();
const urlFor = (src: SanityImageSource) =>
  projectId && dataset ? imageUrlBuilder({ projectId, dataset }).image(src) : null;

/* ---------- 2. Query now fetches image + author ----------------- */
const POSTS_QUERY = groq`
  *[_type == "post" && defined(slug.current)]
    | order(publishedAt desc)[0...12]
  {
    _id,
    title,
    slug,
    publishedAt,
    mainImage,               
    author->{name}
  }
`;

export const revalidate = 30; // ISR every 30 s
export const dynamic = 'force-dynamic'
export default async function BlogIndex() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY);

  /* -------------- unchanged “empty” fallback -------------------- */
  if (!posts.length) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center p-8 text-center">
        <h1 className="mb-4 text-3xl font-semibold">Blog</h1>
        <p className="text-gray-500">Seems like something broke! Check back soon!</p>
      </main>
    );
  }

  /* -------------- RETURN (dark theme, now with image & author) -- */
  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-gray-950 via-indigo-950 to-black text-gray-100 overflow-hidden">
      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-indigo-900 bg-black/70 backdrop-blur-md px-4 lg:px-6 shadow-lg">
        <Link href="/" className="flex items-center font-bold text-cyan-400 drop-shadow-neon">
          <span className="text-2xl md:text-3xl tracking-tight bg-gradient-to-tr from-indigo-400 via-cyan-400 to-fuchsia-500 bg-clip-text text-transparent animate-pulse">ΚΘΠ</span>
          <span className="ml-2 hidden text-sm font-semibold text-fuchsia-300 sm:inline">| Blog</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {[
            ['About', '/#about'],
            ['Contact', '/#contact'],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium transition-colors hover:text-fuchsia-400"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* ---------- MAIN (starfield + blobs) ---------- */}
      <main className="relative flex-1 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 animate-pulse [background-image:radial-gradient(#00fff7_1px,transparent_1px)] [background-size:6px_6px] opacity-10" />
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -left-32 top-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-400 opacity-40 blur-[140px] animate-pulse" />
          <div className="absolute -bottom-28 right-0 h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-cyan-500 via-fuchsia-500 to-indigo-500 opacity-30 blur-[120px] animate-pulse" />
        </div>

        {/* ---------- CONTENT ---------- */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 py-16 md:py-24">
          <h1 className="mb-12 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl drop-shadow-neon">
            Recent Blog&apos;s
          </h1>

          <div className="grid gap-8 sm:grid-cols-2">
            {posts.map((post) => {
              const cover =
                post.mainImage && urlFor(post.mainImage)?.width(800).height(450).url();

              return (
                <article
                  key={post._id}
                  className="group overflow-hidden rounded-2xl bg-black/60 backdrop-blur-lg border-2 border-indigo-900 hover:border-fuchsia-500 shadow-2xl transition-all duration-300"
                >
                  <Link href={`/blog/${post.slug.current}`} prefetch className="block h-full">
                    {/* Cover Image */}
                    {cover && (
                      <img
                        src={cover}
                        alt={post.title}
                        className="h-48 w-full object-cover transition-transform group-hover:scale-105 rounded-t-2xl"
                      />
                    )}

                    <div className="p-6">
                      <h2 className="text-2xl font-semibold group-hover:underline text-cyan-200">
                        {post.title}
                      </h2>

                      {/* Date & Author */}
                      <p className="mt-2 text-sm text-fuchsia-200">
                        {new Date(post.publishedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {post.author?.name && (
                          <>
                            {' '}
                            • <span className="text-indigo-300">{post.author.name}</span>
                          </>
                        )}
                      </p>

                      <span className="mt-4 inline-flex items-center text-cyan-400 group-hover:text-fuchsia-300">
                        Read more <ArrowRight className="ml-1 h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
