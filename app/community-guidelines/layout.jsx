import { pageMetadata } from '@/lib/seo';

// client page
// see app/rush/layout.jsx
export const metadata = pageMetadata({
  title: 'Community Guidelines',
  description:
    'Community guidelines for members of Kappa Theta Pi, Phi Chapter at the University of Georgia, covering conduct in chapter spaces and the member portal.',
  path: '/community-guidelines',
});

export default function CommunityGuidelinesLayout({ children }) {
  return children;
}
