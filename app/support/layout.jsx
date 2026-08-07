import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'KTP App Support',
  description: 'Support information, troubleshooting guidance, account help, and reporting options for the KTP app.',
  path: '/support',
});

export default function SupportLayout({ children }) {
  return children;
}
