'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const ConfirmContext = createContext(null);

const DEFAULTS = {
  title: 'Are you sure?',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
  variant: 'destructive',
};

// Site-wide replacement for window.confirm() — same call shape (returns a
// Promise<boolean>) but rendered as an in-app modal instead of the browser's
// native dialog. One instance mounted in the root layout; any component
// calls useConfirm() to get the confirm() function.
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setRequest({ message, ...DEFAULTS, ...options });
    });
  }, []);

  const settle = useCallback((result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setRequest(null);
  }, []);

  useEffect(() => {
    if (!request) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') settle(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [request, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => settle(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{request.title}</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{request.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => settle(false)}>
                {request.cancelLabel}
              </Button>
              <Button type="button" variant={request.variant} size="sm" onClick={() => settle(true)}>
                {request.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return confirm;
}
