export function Card({ children, className = '' }) {
  return (
    <div
      className={[
        'rounded-3xl border border-slate-700/70 bg-slate-950/80 shadow-[0_20px_46px_-15px_rgba(15,23,42,0.90)] backdrop-blur-xl',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
