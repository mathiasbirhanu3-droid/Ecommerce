import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-3xl font-bold">
        Welcome back<span className="text-accent">.</span>
      </h1>
      <p className="mt-2 text-sm text-ink/60">Sign in to continue your shopping.</p>
      <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-xl bg-raised" />}>
        <LoginForm />
      </Suspense>
    </>
  );
}