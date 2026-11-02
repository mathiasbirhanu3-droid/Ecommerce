// ResetPasswordForm.jsx (client)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getApiError } from '@/lib/api';
import { resetSchema, zodToFieldErrors, apiFieldErrorsToMap } from '@/lib/validation/auth';
import TextField from '@/components/ui/TextField';

export default function ResetPasswordForm({ token }) {
  const router = useRouter();
  const [values, setValues] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const parsed = resetSchema.safeParse(values);
    if (!parsed.success) return setErrors(zodToFieldErrors(parsed.error));
    setErrors({});
    setPending(true);
    try {
      await api.patch(`/auth/reset-password/${token}`, { password: parsed.data.password });
      router.push('/login'); // old sessions are already dead via passwordChangedAt (ADR-27)
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
      {formError && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{formError}</p>}
      <TextField label="New password" name="password" type="password" value={values.password} onChange={onChange} error={errors.password} autoComplete="new-password" required />
      <TextField label="Confirm password" name="confirm" type="password" value={values.confirm} onChange={onChange} error={errors.confirm} autoComplete="new-password" required />
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-ink py-3.5 font-semibold text-white transition-colors hover:bg-accent disabled:opacity-50">
        {pending ? 'Saving…' : 'Reset password'}
      </button>
    </form>
  );
}