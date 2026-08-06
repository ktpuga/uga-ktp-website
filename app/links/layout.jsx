import { pageMetadata } from '@/lib/seo';

// client page
// see app/rush/layout.jsx
export const metadata = pageMetadata({
  title: 'Links',
  description:
    'Every Kappa Theta Pi at UGA link in one place: rush, Instagram, the member portal, KTP Hacks and sponsorship information.',
  path: '/links',
});

export default function LinksLayout({ children }) {
  return children;
}
