export function LoadingSpinner({ size = 'md', label }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
      <div
        className={[
          'animate-spin rounded-full border-slate-700 border-t-sky-400',
          sizes[size] || sizes.md,
        ].join(' ')}
      />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function FullPageSpinner({ label = 'Loading your workspace' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950/95 px-4">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
