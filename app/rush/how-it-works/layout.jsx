import { pageMetadata } from '@/lib/seo';

// client page
// see app/rush/layout.jsx
export const metadata = pageMetadata({
  title: 'How Rush Works',
  description:
    'The four steps to joining Kappa Theta Pi at UGA: attend an info session, meet the members, interview, and receive a bid. Create your rushee account here.',
  path: '/rush/how-it-works',
});

export default function HowItWorksLayout({ children }) {
  return children;
}
