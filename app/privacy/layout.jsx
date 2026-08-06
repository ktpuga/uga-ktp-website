import { pageMetadata } from '@/lib/seo';

// client page
// see app/rush/layout.jsx
export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description:
    'How Kappa Theta Pi at UGA collects, uses and stores data in the KTP Life app and the ugaktp.com member portal.',
  path: '/privacy',
});

export default function PrivacyLayout({ children }) {
  return children;
}
