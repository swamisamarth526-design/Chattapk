const variants = {
  primary:
    'bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-lg shadow-sky-500/20',
  secondary:
    'border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800',
  subtle: 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80',
  ghost: 'text-slate-200 hover:bg-slate-800',
  danger: 'bg-rose-500 text-white hover:bg-rose-400 shadow-lg shadow-rose-500/20',
};

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition duration-200 ease-out',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className,
      ].join(' ')}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      <span>{children}</span>
    </button>
  );
}
