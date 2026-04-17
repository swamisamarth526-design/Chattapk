import { Avatar } from '../UI';
import { formatTime } from '../../utils/helpers';

const deliveryStyles = {
  sent: 'text-slate-500',
  delivered: 'text-sky-400',
  read: 'text-emerald-400',
};

export function MessageItem({ message, isOwnMessage }) {
  return (
    <div className={['flex gap-3', isOwnMessage ? 'justify-end' : 'justify-start'].join(' ')}>
      {!isOwnMessage ? (
        <Avatar
          src={message.senderAvatar}
          name={message.senderName}
          size="sm"
          className="mt-1"
        />
      ) : null}

      <div
        className={[
          'max-w-[85%] sm:max-w-[70%]',
          isOwnMessage ? 'items-end' : 'items-start',
        ].join(' ')}
      >
        <div
          className={[
            'rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg',
            isOwnMessage
              ? 'rounded-br-md bg-sky-500 text-slate-950 shadow-sky-500/15'
              : 'rounded-bl-md border border-slate-700 bg-slate-900/85 text-slate-100',
          ].join(' ')}
        >
          {message.text}
        </div>
        <div
          className={[
            'mt-1 flex items-center gap-2 px-1 text-xs',
            isOwnMessage ? 'justify-end' : 'justify-start',
          ].join(' ')}
        >
          <time className="text-slate-500">{formatTime(message.createdAt)}</time>
          {isOwnMessage ? (
            <span className={deliveryStyles[message.delivery] || 'text-slate-500'}>
              {message.delivery === 'read'
                ? 'Read'
                : message.delivery === 'delivered'
                  ? 'Delivered'
                  : 'Sent'}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
