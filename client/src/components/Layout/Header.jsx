import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Avatar } from '../UI';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { CONNECTION_STATUS } from '../../utils/constants';

const connectionCopy = {
  [CONNECTION_STATUS.CONNECTED]: {
    dot: 'bg-emerald-400',
    label: 'Realtime connected',
  },
  [CONNECTION_STATUS.CONNECTING]: {
    dot: 'bg-amber-400',
    label: 'Realtime reconnecting',
  },
  [CONNECTION_STATUS.DISCONNECTED]: {
    dot: 'bg-slate-500',
    label: 'Realtime offline',
  },
  [CONNECTION_STATUS.ERROR]: {
    dot: 'bg-rose-400',
    label: 'Realtime error',
  },
};

export function Header() {
  const { user, logout, isSubmitting } = useAuth();
  const { connectionStatus } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname.startsWith('/chat');
  const presence = connectionCopy[connectionStatus] || connectionCopy.disconnected;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/chat" className="flex items-center gap-3">
          <img
            src="/favicon.svg"
            alt="ChatX logo"
            className="h-10 w-10 rounded-2xl border border-sky-300/30 bg-sky-500/10 p-1 shadow-lg shadow-sky-500/20"
          />
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">ChatX</p>
            <p className="text-xs text-slate-400">Secure, friendly team messaging</p>
          </div>
        </Link>

        {isChatPage && user ? (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2 sm:flex">
              <span className={['h-2.5 w-2.5 rounded-full', presence.dot].join(' ')} />
              <span className="text-sm text-slate-300">{presence.label}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2">
              <Avatar
                name={user.name}
                size="sm"
                status={
                  connectionStatus === CONNECTION_STATUS.CONNECTED
                    ? 'online'
                    : 'offline'
                }
              />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              loading={isSubmitting}
            >
              Logout
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
