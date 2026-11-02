'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getApiError } from '@/lib/api';
import { loginSchema, zodToFieldErrors, apiFieldErrorsToMap } from '@/lib/validation/auth';
import TextField from '@/components/ui/TextField';

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) return setErrors(zodToFieldErrors(parsed.error));
    setErrors({});
    setPending(true);
    try {
      await login(parsed.data);
      router.push(next); // ?next=/checkout returns the user exactly where the Edge gate stopped them
      router.refresh();
    } catch (err) {
      const apiErr = getApiError(err);
      setErrors(apiFieldErrorsToMap(apiErr.fieldErrors));
      setFormError(apiErr.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      {formError && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {formError}
        </p>
      )}
      <TextField label="Email" name="email" type="email" value={values.email} onChange={onChange} error={errors.email} autoComplete="email" required />
      <TextField label="Password" name="password" type="password" value={values.password} onChange={onChange} error={errors.password} autoComplete="current-password" required />
      <div className="text-right text-sm">
        <Link href="/forgot-password" className="font-medium text-accent hover:underline">Forgot password?</Link>
      </div>
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-ink py-3.5 font-semibold text-white transition-colors hover:bg-accent disabled:opacity-50">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-ink/60">
        New to Vendora?{' '}
        <Link href={`/register${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}