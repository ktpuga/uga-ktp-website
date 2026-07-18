'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MessageSquare } from 'lucide-react';
import ReportButton from './ReportButton';
import BlockButton from './BlockButton';

const MENU_ITEM_CLASS =
  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800';

// Wraps a name/avatar (whatever's passed as children) with a click-to-open
// popover offering Message privately / Report / Block — for places that
// show another member without already having a full profile view to open,
// namely group chat message senders and the group chat member list. Not
// needed in the Directory (has its own profile modal) or DM threads
// (already has a Block button in the conversation header).
export default function ProfileActionsMenu({ userId, children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isSelf = session?.user?.authentik_id === userId;
  const portalRoot = '/' + (pathname.split('/')[1] || 'member');

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (isSelf || !userId) return <>{children}</>;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="text-left"
      >
        {children}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <Link href={`${portalRoot}/messages?with=${userId}`} className={MENU_ITEM_CLASS} onClick={() => setOpen(false)}>
            <MessageSquare className="h-3.5 w-3.5" /> Message privately
          </Link>
          <ReportButton contentType="user" reportedUserId={userId} iconOnly={false} className={MENU_ITEM_CLASS} />
          <BlockButton
            userId={userId}
            variant="ghost"
            size="sm"
            className="w-full justify-start rounded-none px-3 py-2 font-normal"
          />
        </div>
      )}
    </div>
  );
}
