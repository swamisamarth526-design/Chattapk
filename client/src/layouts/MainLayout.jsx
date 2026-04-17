import { Outlet } from 'react-router-dom';
import { Header } from '../components/Layout/Header';

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,rgba(15,23,42,0.85),rgba(10,14,29,0.98))]">
      <Header />
      <main className="flex-1 overflow-hidden px-3 pb-3 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6">
        <Outlet />
      </main>
    </div>
  );
}
