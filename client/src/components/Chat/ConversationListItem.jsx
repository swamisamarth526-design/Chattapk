import { Avatar } from '../UI';
import { formatDate, truncate } from '../../utils/helpers';

export function ConversationListItem({
  conversation,
  isSelected,
  onClick,
  unreadCount = 0,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group w-full rounded-2xl border px-4 py-3 text-left transition duration-200',
        isSelected
          ? 'border-sky-400/50 bg-sky-500/10 shadow-lg shadow-sky-500/10'
          : 'border-transparent bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={conversation.avatar}
          name={conversation.title}
          size="md"
          status={conversation.status}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {conversation.title}
              </p>
              <p className="truncate text-xs text-slate-500">
                {conversation.subtitle}
              </p>
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {formatDate(conversation.updatedAt)}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="truncate text-sm text-slate-300">
              {truncate(conversation.lastMessage, 62)}
            </p>
            {unreadCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-xs font-semibold text-slate-950">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
