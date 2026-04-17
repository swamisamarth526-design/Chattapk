import { getAvatarBg, getInitials } from '../../utils/helpers';

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ src, name, size = 'md', status, className = '' }) {
  const initials = getInitials(name);

  return (
    <div className={['relative inline-flex shrink-0', className].join(' ')}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={[
            'rounded-full object-cover ring-2 ring-slate-900',
            sizes[size] || sizes.md,
          ].join(' ')}
        />
      ) : (
        <div
          className={[
            'flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-slate-900',
            sizes[size] || sizes.md,
          ].join(' ')}
          style={{ backgroundColor: getAvatarBg(name || 'guest') }}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={[
            'absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-slate-950',
            status === 'online' ? 'bg-emerald-400' : 'bg-slate-400',
          ].join(' ')}
        />
      )}
    </div>
  );
}
