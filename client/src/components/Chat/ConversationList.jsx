import { Button, LoadingSpinner } from '../UI';
import { UserSearch } from '../UserSearch';
import { ConversationListItem } from './ConversationListItem';

export function ConversationList({
  conversations = [],
  selectedConversationId,
  onSelectConversation,
  isLoading = false,
  error = '',
  onRetry,
  discoverUsers = [],
  searchValue = '',
  onSearchChange,
  isSearchingUsers = false,
  discoverError = '',
  onSelectUser,
  creatingConversationId = '',
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/70">
      <div className="border-b border-slate-800/80 p-4">
        <p className="text-lg font-semibold text-white">Conversations</p>
        <p className="mt-1 text-sm text-slate-400">
          Recent chats, plus a quick way to start a new one.
        </p>
      </div>

      <div className="border-b border-slate-800/80 p-4">
        <UserSearch
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          users={discoverUsers}
          isLoading={isSearchingUsers}
          error={discoverError}
          onSelectUser={onSelectUser}
          creatingConversationId={creatingConversationId}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Recent chats
          </p>
          <span className="rounded-full border border-slate-800 px-2 py-1 text-xs text-slate-400">
            {conversations.length}
          </span>
        </div>

        {error ? (
          <div className="px-4 pb-3">
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-3 text-sm text-rose-200">
              <div className="flex items-center justify-between gap-3">
                <span>{error}</span>
                {onRetry ? (
                  <Button variant="secondary" size="sm" onClick={onRetry}>
                    Retry
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner label="Loading conversations" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-4">
                <p className="text-base font-medium text-white">
                  No conversations yet
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Pick someone from the discover section above to start chatting.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <ConversationListItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversationId === conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  unreadCount={conversation.unreadCount}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
