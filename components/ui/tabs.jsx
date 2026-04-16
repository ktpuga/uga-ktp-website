'use client';

import { createContext, useContext, useState } from 'react';

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value, onValueChange, className = '', children }) {
  const [internal, setInternal] = useState(defaultValue);
  const active = value ?? internal;
  const setActive = onValueChange ?? setInternal;

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={`flex flex-col gap-2 ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children }) {
  return (
    <div className={`inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 p-[3px] ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className = '', children, disabled }) {
  const { active, setActive } = useContext(TabsContext);
  const isActive = active === value;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setActive(value)}
      className={`inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-xl border border-transparent px-2 py-1 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-white text-slate-900 shadow-sm border-slate-200'
          : 'text-slate-600 hover:text-slate-900'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = '', children }) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div className={`flex-1 outline-none ${className}`}>{children}</div>;
}
