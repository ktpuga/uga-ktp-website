const variantClasses = {
  default: 'bg-slate-900 text-white',
  secondary: 'bg-slate-100 text-slate-800',
  destructive: 'bg-red-600 text-white',
  outline: 'border border-slate-300 text-slate-700',
};

export function Badge({ className = '', variant = 'default', children, ...props }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant] ?? variantClasses.default} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
