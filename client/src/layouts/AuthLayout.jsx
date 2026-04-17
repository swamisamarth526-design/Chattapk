import { Outlet } from 'react-router-dom';

const highlights = [
  'Clean routing and protected chat navigation',
  'Responsive sidebar plus message panel',
  'Reusable inputs, buttons, cards, and avatars',
];

export function AuthLayout() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.1),_transparent_28%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:px-8">
        <section className="hidden lg:flex lg:flex-col lg:justify-between lg:gap-10">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-slate-700/70 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 shadow-lg shadow-slate-950/20">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              ChatX workspace
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-white">
              A calm, modern base for your chat experience.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Use this frontend as the starting point for auth, protected routes,
              and a clean conversation layout that feels polished from day one.
            </p>
          </div>

          <div className="grid gap-4">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200"
              >
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <main className="flex items-center justify-center">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
