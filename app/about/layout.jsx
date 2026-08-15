import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About Phi Chapter',
  description: 'Learn about Kappa Theta Pi, Phi Chapter at the University of Georgia, our values, and chapter leadership.',
  path: '/about',
});

export default function AboutLayout({ children }) {
  return children;
}
