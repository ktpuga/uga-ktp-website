import { pageMetadata } from '@/lib/seo';

// client page
// see app/rush/layout.jsx
export const metadata = pageMetadata({
  title: 'Our Members',
  description:
    'Meet Phi Chapter: the executive board, cabinet, active members and alumni of Kappa Theta Pi at the University of Georgia.',
  path: '/members-list',
});

export default function MembersListLayout({ children }) {
  return children;
}
