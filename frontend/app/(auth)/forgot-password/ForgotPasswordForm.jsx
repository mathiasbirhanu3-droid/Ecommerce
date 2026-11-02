// ForgotPasswordForm.jsx (client)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, getApiError } from '@/lib/api';
import { forgotSchema, zodToFieldErrors } from '@/lib/validation/auth';
import TextField from '@/components/ui/TextField';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [pending, setPending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) return setError(zodToFieldErrors(parsed.error).email);
    setError('');
    setPending(true);
    try {
      const res = await api.post('/auth/forgot-password', parsed.data);
      setSent(true);
      setDevLink(res.data?.data?.devResetUrl || ''); // dev-only convenience (Ethereal)
    } catch (err) {
      setFormError(getApiError(err).message);
    } finally {
      setPending(false);
    }
  };

  if (sent) {
    return (
      <div className="mt-8">
        <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-ink">
          If an account exists for <b>{email}</b>, a reset link is on its way. The link expires in 10 minutes.
        </p>
        {devLink && (
          <p className="mt-3 rounded-xl bg-warning/10 px-4 py-3 text-xs text-ink">
            <b>DEV:</b> open your reset link directly →{' '}
            <a href={devLink} className="font-semibold text-accent underline">{devLink}</a>
          </p>
        )}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-accent hover:underline">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      {formError && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{formError}</p>}
      <TextField label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoComplete="email" required />
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-ink py-3.5 font-semibold text-white transition-colors hover:bg-accent disabled:opacity-50">
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
      <p className="text-center text-sm text-ink/60">
        <Link href="/login" className="font-semibold text-accent hover:underline">← Back to sign in</Link>
      </p>
    </form>
  );
}