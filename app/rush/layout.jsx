import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Rush',
  description:
    "Rush Kappa Theta Pi, UGA's first professional technology fraternity. Two weeks of info sessions, game night, Shark Tank and speed dating. See the full event timeline and how to sign up.",
  path: '/rush',
});

export default function RushLayout({ children }) {
  return children;
}
