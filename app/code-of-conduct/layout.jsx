import { pageMetadata } from '@/lib/seo';

// client page
// see app/rush/layout.jsx
export const metadata = pageMetadata({
  title: 'Code of Conduct',
  description:
    'The core values, member expectations and confidential reporting process for Kappa Theta Pi, Phi Chapter at the University of Georgia.',
  path: '/code-of-conduct',
});

export default function CodeOfConductLayout({ children }) {
  return children;
}
