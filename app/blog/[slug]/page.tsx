/* app/blog/[slug]/page.tsx --------------------------------------------- */
import { PortableText, type PortableTextReactComponents } from '@portabletext/react';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import type { Metadata } from 'next';
import { groq } from 'next-sanity';
import Link from 'next/link';
import { client } from '../../../sanity/client';
const META_QUERY = groq`
  *[_type=="post" && slug.current == $slug][0]{
    title,
    "description": excerpt,
    publishedAt,
    mainImage,
    author->{ name }
  }
`;
type RouteParams = Promise<{ slug: string }>;   // <-  PROMISE
/* 1.  Builder — no external helper  ------------------------------------ */
const { projectId, dataset } = client.config();
const urlFor = (src: SanityImageSource) =>
  projectId && dataset ? imageUrlBuilder({ projectId, dataset }).image(src) : null;
export async function generateMetadata(
  { params }: { params: RouteParams }
): Promise<Metadata> {
  const { slug } = await params;
  const data = await client.fetch(META_QUERY, { slug });
  const cover =
    data?.mainImage &&
    imageUrlBuilder({ projectId, dataset }).image(data.mainImage).width(1200).height(630).url();

  const base = 'https://ktpgeorgia.com';
  const url = `${base}/blog/${slug}`;

  return {
    title: data?.title || 'Blog',
    description: data?.description || 'Kappa Theta Pi blog post',
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: data?.title,
      description: data?.description,
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: data?.title,
      description: data?.description,
      images: cover ? [cover] : undefined,
    },
  };
}
const ptComponents = {
  /* —– block-level elements —– */
  block: {
    h2: ({ children }) => (
      <h2 className="mt-8 text-2xl font-bold tracking-tight text-indigo-400">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 text-xl font-semibold tracking-tight text-indigo-400">
        {children}
      </h3>
    ),
  },

  /* —– inline marks —– */
  marks: {
    link: ({ children, value }) => (
      <Link
        href={value?.href || '#'}
        target={value?.blank ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="text-indigo-400 underline hover:text-indigo-300"
      >
        {children}
      </Link>
    ),
  },

  /* —– lists —– */
  list: {
    bullet: ({ children }) => <ul className="ml-6 list-disc space-y-2">{children}</ul>,
    number: ({ children }) => <ol className="ml-6 list-decimal space-y-2">{children}</ol>,
  },

  /* —– custom types —– */
  types: {
    image: ({ value }) => {
      const url =
        value &&
        imageUrlBuilder({ projectId, dataset }).image(value).width(800).height(500).url();
      return url ? (
        <img src={url} alt={value.alt || 'Blog image'} className="my-8 rounded-lg" />
      ) : null;
    },
  },
} satisfies Partial<PortableTextReactComponents>;



/* 2.  Query — cover + author (name & image) ----------------------------- */
const POST_QUERY = groq`
  *[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    body,
    publishedAt,
    mainImage,
    author->{ name, image }
  }
`;

export const revalidate = 30;

export default async function PostPage(
  { params }: { params: Promise<{ slug: string }> }   // <- matches Next
) {
  const { slug } = await params;                       // await once
  const post = await client.fetch(POST_QUERY, { slug });
  if (!post) {
    /* optional: Next.js 404 */
    return <h1 className="p-8 text-center text-2xl text-red-500">Post not found</h1>;
  }

  /* 3.  Build image URLs ------------------------------------------------ */
  const coverUrl =
    post.mainImage && urlFor(post.mainImage)?.width(1200).height(600).url();

  const authorImg =
    post.author?.image && urlFor(post.author.image)?.width(96).height(96).url();
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.publishedAt,
    author: { '@type': 'Person', name: post.author?.name },
    image: coverUrl ? [coverUrl] : undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
  };
  /* 4.  Render ---------------------------------------------------------- */
  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-gray-950 via-indigo-950 to-black text-gray-100 overflow-hidden">
      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-indigo-900 bg-black/70 backdrop-blur-md px-4 lg:px-6 shadow-lg">
        <Link href="/" className="flex items-center font-bold text-cyan-400 drop-shadow-neon">
          <span className="text-2xl md:text-3xl tracking-tight bg-gradient-to-tr from-indigo-400 via-cyan-400 to-fuchsia-500 bg-clip-text text-transparent animate-pulse">ΚΘΠ</span>
          <span className="ml-2 hidden text-sm font-semibold text-fuchsia-300 sm:inline">| Blog</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/blog" className="text-sm font-medium transition-colors hover:text-fuchsia-400">
            Back to posts
          </Link>
        </nav>
      </header>

      {/* ---------- MAIN ---------- */}
      <main className="relative flex-1 overflow-hidden">
        {/* Neon grid and glowing blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 animate-pulse [background-image:radial-gradient(#00fff7_1px,transparent_1px)] [background-size:6px_6px] opacity-10" />
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -left-32 top-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-400 opacity-40 blur-[140px] animate-pulse" />
          <div className="absolute -bottom-28 right-0 h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-cyan-500 via-fuchsia-500 to-indigo-500 opacity-30 blur-[120px] animate-pulse" />
        </div>

        {/* Article */}
        <article className="relative z-10 mx-auto max-w-3xl px-6 py-16 md:py-24 bg-black/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-indigo-900">
          <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
          {/* Cover */}
          {coverUrl && (
            <img
              src={coverUrl}
              alt={post.title}
              className="mb-8 w-full rounded-xl object-cover shadow-lg"
            />
          )}

          {/* Title & date */}
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-neon">
            {post.title}
          </h1>
          <p className="mb-8 text-sm text-fuchsia-200">
            {new Date(post.publishedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          {/* Body (PortableText) */}
          {Array.isArray(post.body) && (
            <div className="prose prose-lg prose-invert">
              <PortableText value={post.body} components={ptComponents} />
            </div>
          )}

          {/* Author block */}
          {post.author?.name && (
            <section className="mt-16 flex items-start gap-4 border-t border-indigo-900 pt-8">
              {authorImg && (
                <img
                  src={authorImg}
                  alt={post.author.name}
                  className="h-16 w-16 rounded-full object-cover ring-4 ring-fuchsia-400"
                />
              )}

              <div>
                <p className="text-sm text-cyan-200">
                  <span className="block font-semibold text-fuchsia-300">
                    {post.author.name}
                  </span>
                  <span>Author</span>
                </p>

                {/* ——— Disclaimer ——— */}
                <p className="mt-4 max-w-xl text-xs text-indigo-300">
                  Opinions are the author&apos;s and may not represent KTP Phi Chapter or UGA. Content is informational—not professional advice. External links are for convenience not endorsement unless explicitly mentioned.
                </p>
              </div>
            </section>
          )}
        </article>
      </main>
    </div>
  );
}
