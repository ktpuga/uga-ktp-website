import { pageMetadata } from '@/lib/seo';

// client page
// see app/rush/layout.jsx
export const metadata = pageMetadata({
  title: 'KTP Hacks',
  description:
    "KTP Hacks is Kappa Theta Pi's annual invite-only hackathon at UGA. Twelve hours, eight projects, powered by GitHub Education, Red Bull and DoorDash.",
  path: '/hackathon',
  image: '/ktpHacks1.jpeg',
});

export default function HackathonLayout({ children }) {
  return children;
}
