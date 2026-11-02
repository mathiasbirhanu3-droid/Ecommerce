'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const initials = (name = '') =>
  name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

export default function UserMenu() {
  const { user, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (isLoading) return <span className="inline-block h-9 w-9 animate-pulse rounded-full bg-raised" />;

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="hidden hover:text-accent sm:block">Sign in</Link>
        <Link href="/register" className="rounded-xl bg-ink px-4 py-2 text-white transition-colors hover:bg-accent">
          Sign up
        </Link>
      </div>
    );
  }

  const onLogout = async () => {
    setOpen(false);
    await logout(); // queryClient.clear() inside — no cross-account data leaks
    router.push('/');
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-white transition-colors hover:bg-accent"
      >
        {initials(user.name)}
      </button>

      {open && (
        <>
          <button aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-black/5 bg-white p-2 shadow-lg">
            <p className="truncate px-3 py-2 text-sm font-semibold">{user.name}</p>
            <p className="px-3 pb-2 text-xs uppercase tracking-wide text-ink/40">{user.role}</p>
            <Link role="menuitem" href="/account" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-raised">
              My account
            </Link>
            {(user.role === 'vendor' || user.role === 'admin') && (
              <Link role="menuitem" href="/vendor" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-raised">
                Vendor dashboard
              </Link>
            )}
            {user.role === 'admin' && (
              <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-raised">
                Admin panel
              </Link>
            )}
            <button role="menuitem" onClick={onLogout} className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger/10">
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}