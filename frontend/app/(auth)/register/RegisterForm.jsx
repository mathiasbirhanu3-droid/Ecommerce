// RegisterForm.jsx (client)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getApiError } from '@/lib/api';
import { registerSchema, zodToFieldErrors, apiFieldErrorsToMap } from '@/lib/validation/auth';
import TextField from '@/components/ui/TextField';

export default function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) return setErrors(zodToFieldErrors(parsed.error));
    setErrors({});
    setPending(true);
    try {
      await register(parsed.data);
      router.push('/');
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
      <TextField label="Full name" name="name" value={values.name} onChange={onChange} error={errors.name} autoComplete="name" required />
      <TextField label="Email" name="email" type="email" value={values.email} onChange={onChange} error={errors.email} autoComplete="email" required />
      <TextField label="Password" name="password" type="password" value={values.password} onChange={onChange} error={errors.password} autoComplete="new-password" placeholder="8+ chars, letter + number" required />
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-ink py-3.5 font-semibold text-white transition-colors hover:bg-accent disabled:opacity-50">
        {pending ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-ink/60">
        Already have an account? <Link href="/login" className="font-semibold text-accent hover:underline">Sign in</Link>
      </p>
    </form>
  );
}