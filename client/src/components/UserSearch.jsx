import { Avatar, Input, LoadingSpinner } from './UI';

export function UserSearch({
  searchValue,
  onSearchChange,
  users = [],
  isLoading = false,
  error = '',
  onSelectUser,
  creatingConversationId = '',
}) {
  const hasQuery = searchValue.trim().length >= 2;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-white">Start a new chat</p>
        <p className="mt-1 text-sm text-slate-400">
          Search by name or email, or pick someone from the suggested list.
        </p>
      </div>

      <Input
        type="search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        maxLength={100}
        autoComplete="off"
        placeholder="Search users by name or email"
        aria-label="Search users"
        hint={
          hasQuery
            ? 'Showing people matching your search.'
            : 'Suggested users appear below.'
        }
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {hasQuery ? 'Search results' : 'Discover users'}
          </p>
          {isLoading ? (
            <span className="text-xs text-slate-500">Searching...</span>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" label="Finding people" />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-3 py-4 text-sm text-slate-400">
            {hasQuery
              ? 'No users matched your search.'
              : 'No users available to start a chat yet.'}
          </div>
        ) : (
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {users.map((user) => {
              const isCreating = creatingConversationId === user.id;

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onSelectUser(user)}
                  disabled={isCreating}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 px-3 py-3 text-left transition hover:border-slate-700 hover:bg-slate-900/70 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="sm"
                      status={user.status}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">
                    {isCreating ? 'Opening...' : user.statusLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
