import { useEffect, useRef, useState } from 'react';
import { Button, Avatar, LoadingSpinner } from '../UI';
import { MessageItem } from './MessageItem';

const TYPING_IDLE_DELAY = 1200;

function TypingIndicator({ typingNames }) {
  if (typingNames.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-1 text-sm text-slate-400">
      <span className="inline-flex gap-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400 [animation-delay:120ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400 [animation-delay:240ms]" />
      </span>
      <span>
        {typingNames.join(', ')}
        {typingNames.length > 1 ? ' are typing...' : ' is typing...'}
      </span>
    </div>
  );
}

export function ChatPanel({
  conversation,
  currentUserId,
  isLoading = false,
  isSending = false,
  error = '',
  typingNames = [],
  onRetry,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onBack,
  mobileOnly = false,
}) {
  const [messageText, setMessageText] = useState('');
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasAnnouncedTypingRef = useRef(false);
  const typingStartRef = useRef(onTypingStart);
  const typingStopRef = useRef(onTypingStop);

  useEffect(() => {
    typingStartRef.current = onTypingStart;
    typingStopRef.current = onTypingStop;
  }, [onTypingStart, onTypingStop]);

  const notifyTypingStart = () => {
    typingStartRef.current?.();
  };

  const notifyTypingStop = () => {
    typingStopRef.current?.();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, typingNames]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (hasAnnouncedTypingRef.current) {
        notifyTypingStop();
        hasAnnouncedTypingRef.current = false;
      }
    };
  }, []);

  const scheduleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (hasAnnouncedTypingRef.current) {
        notifyTypingStop();
        hasAnnouncedTypingRef.current = false;
      }
    }, TYPING_IDLE_DELAY);
  };

  const handleDraftChange = (event) => {
    const nextValue = event.target.value;
    const hasContent = Boolean(nextValue.trim());

    setMessageText(nextValue);

    if (!hasContent) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (hasAnnouncedTypingRef.current) {
        notifyTypingStop();
        hasAnnouncedTypingRef.current = false;
      }

      return;
    }

    if (!hasAnnouncedTypingRef.current) {
      notifyTypingStart();
      hasAnnouncedTypingRef.current = true;
    }

    scheduleTypingStop();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = messageText.trim();

    if (!text || isSending) {
      return;
    }

    try {
      await onSendMessage(text);
      setMessageText('');

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (hasAnnouncedTypingRef.current) {
        notifyTypingStop();
        hasAnnouncedTypingRef.current = false;
      }
    } catch {
      // Keep the draft so the user can retry after an error.
    }
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit(event);
    }
  };

  if (!conversation) {
    return (
      <section className="chat-panel flex min-h-[420px] flex-1 items-center justify-center px-6 py-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 rounded-3xl border border-slate-700 bg-slate-900 px-5 py-4">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
              Inbox
            </p>
          </div>
          <h2 className="text-2xl font-semibold text-white">Select a conversation</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Pick a thread from the sidebar to read messages or start a new chat
            from the discover section.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-panel flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          {mobileOnly && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 md:hidden"
            >
              Back
            </button>
          ) : null}

          <Avatar
            src={conversation.avatar}
            name={conversation.title}
            size="md"
            status={conversation.status}
          />

          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg">
              {conversation.title}
            </h2>
            <p className="text-sm text-slate-400">
              {conversation.statusLabel}
              {conversation.subtitle ? ` | ${conversation.subtitle}` : ''}
            </p>
          </div>
        </div>

        <div className="hidden rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400 sm:block">
          Last updated {new Date(conversation.updatedAt).toLocaleDateString()}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        {error && !isLoading ? (
          <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              {onRetry ? (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner label="Loading messages" />
          </div>
        ) : conversation.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm space-y-4 text-center">
              <p className="text-lg font-medium text-white">No messages yet</p>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Send the first message to kick off this conversation.
              </p>
              <div className="flex justify-center">
                <TypingIndicator typingNames={typingNames} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.senderId === currentUserId}
              />
            ))}
            <TypingIndicator typingNames={typingNames} />
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-4 sm:px-5"
      >
        <div className="flex items-end gap-3">
          <label className="flex-1">
            <span className="sr-only">Message</span>
            <textarea
              value={messageText}
              onChange={handleDraftChange}
              onKeyDown={handleComposerKeyDown}
              placeholder="Write a message..."
              rows={1}
              disabled={isSending}
              className="min-h-[48px] w-full resize-none rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-70"
            />
            <span className="mt-2 block text-xs text-slate-500">
              Press Enter to send. Use Shift+Enter for a new line.
            </span>
          </label>
          <Button
            type="submit"
            size="md"
            className="px-5"
            disabled={!messageText.trim() || isLoading}
            loading={isSending}
          >
            Send
          </Button>
        </div>
      </form>
    </section>
  );
}
