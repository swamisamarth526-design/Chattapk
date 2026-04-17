export function Input({
  label,
  error,
  hint,
  className = '',
  wrapperClassName = '',
  type = 'text',
  ...props
}) {
  return (
    <label className={['flex w-full flex-col gap-2', wrapperClassName].join(' ')}>
      {label && <span className="text-sm font-medium text-slate-200">{label}</span>}
      <input
        type={type}
        aria-invalid={Boolean(error)}
        className={[
          'h-11 w-full rounded-xl border bg-slate-900/80 px-4 text-slate-100 outline-none',
          'placeholder:text-slate-500 transition duration-200',
          'focus:border-sky-400 focus:ring-4 focus:ring-sky-500/20',
          error ? 'border-rose-500' : 'border-slate-700',
          className,
        ].join(' ')}
        {...props}
      />
      {error ? (
        <span className="text-sm text-rose-300">{error}</span>
      ) : hint ? (
        <span className="text-sm text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}
