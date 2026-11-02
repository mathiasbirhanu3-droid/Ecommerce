import Link from 'next/link';
import UserMenu from './UserMenu';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight">
          VENDORA<span className="text-accent">.</span>
        </Link>

        <form action="/search" role="search" className="hidden w-full max-w-xl md:block">
          <input
            type="search"
            name="q"
            placeholder="Search products…"
            aria-label="Search products"
            className="w-full rounded-xl border border-black/10 bg-raised px-4 py-2 text-sm outline-none focus:border-accent"
          />
        </form>

        <nav aria-label="Main" className="flex items-center gap-4 text-sm font-medium">
          <Link href="/cart" className="hover:text-accent">Cart</Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}