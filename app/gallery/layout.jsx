import { pageMetadata } from '@/lib/seo';

// client page
// see app/hackathon/layout.jsx
export const metadata = pageMetadata({
  title: 'Gallery',
  description:
    "Photos from Kappa Theta Pi's Phi Chapter at UGA: formals, tailgates, hackathons and everything else, newest first.",
  path: '/gallery',
});

export default function GalleryLayout({ children }) {
  return children;
}
