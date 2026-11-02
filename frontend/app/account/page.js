'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api, getApiError } from '@/lib/api';
import { passwordSchema, zodToFieldErrors, apiFieldErrorsToMap } from '@/lib/validation/auth';
import TextField from '@/components/ui/TextField';

const EMPTY_ADDRESS = { fullName: '', phone: '', street: '', city: '', state: '', country: '', postalCode: '' };

export default function AccountPage() {
  const { user, isLoading, refreshSession, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAddress({ ...EMPTY_ADDRESS, ...(user.defaultAddress || {}) });
    }
  }, [user]);

  const run = async (key, fn, successMsg) => {
    setNotice('');
    setFormError('');
    setSaving(key);
    try {
      await fn();
      setNotice(successMsg);
    } catch (err) {
      const apiErr = getApiError(err);
      setErrors(apiFieldErrorsToMap(apiErr.fieldErrors));
      setFormError(apiErr.message);
    } finally {
      setSaving('');
    }
  };

  const saveProfile = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setErrors({ name: 'Name is too short' });
    run('profile', async () => {
      await api.patch('/users/me', { name: name.trim() });
      refreshSession();
    }, 'Profile updated.');
  };

  const saveAddress = (e) => {
    e.preventDefault();
    const required = ['fullName', 'phone', 'street', 'city'];
    const missing = required.find((f) => !address[f]?.trim());
    if (missing) return setErrors({ [missing]: 'This field is required' });
    run('address', async () => {
      await api.patch('/users/me/address', address);
      refreshSession();
    }, 'Address saved.');
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return setErrors({ confirm: 'Passwords do not match' });
    const parsed = passwordSchema.safeParse(pw.newPassword);
    if (!parsed.success) return setErrors({ newPassword: zodToFieldErrors(parsed.error).password });
    run('password', async () => {
      await api.patch('/users/me/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      await logout(); // ADR-27: all sessions died server-side — client cache cleared too
      router.push('/login');
    }, '');
  };

  if (isLoading || !user) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><div className="h-96 animate-pulse rounded-2xl bg-raised" /></div>;
  }

  const field = (section, f, label, opts = {}) => (
    <TextField
      label={label}
      name={f}
      value={section === 'address' ? address[f] : undefined}
      onChange={section === 'address' ? (e) => setAddress((a) => ({ ...a, [f]: e.target.value })) : undefined}
      error={errors[f]}
      {...(section === 'address' ? {} : opts)}
    />
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <h1 className="font-display text-4xl font-bold">
        My account<span className="text-accent">.</span>
      </h1>

      {notice && <p className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">{notice}</p>}
      {formError && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{formError}</p>}

      {/* Profile */}
      <form onSubmit={saveProfile} className="rounded-2xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-xl font-bold">Profile</h2>
        <p className="mb-4 text-xs text-ink/50">Signed in as {user.email} (email cannot be changed in MVP)</p>
        <div className="max-w-sm">{field('profile', 'name', 'Full name', { value: name, onChange: (e) => setName(e.target.value) })}</div>
        <button type="submit" disabled={saving === 'profile'} className="mt-4 rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent disabled:opacity-50">
          {saving === 'profile' ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      {/* Default address */}
      <form onSubmit={saveAddress} className="rounded-2xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-xl font-bold">Default shipping address</h2>
        <p className="mb-4 text-xs text-ink/50">Used to prefill checkout (FR-USER-01)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field('address', 'fullName', 'Full name')}
          {field('address', 'phone', 'Phone')}
          {field('address', 'street', 'Street')}
          {field('address', 'city', 'City')}
          {field('address', 'state', 'State / Region')}
          {field('address', 'country', 'Country')}
          {field('address', 'postalCode', 'Postal code')}
        </div>
        <button type="submit" disabled={saving === 'address'} className="mt-4 rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent disabled:opacity-50">
          {saving === 'address' ? 'Saving…' : 'Save address'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={savePassword} className="rounded-2xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-xl font-bold">Change password</h2>
        <p className="mb-4 text-xs text-ink/50">Changing your password signs out all other sessions (security by design).</p>
        <div className="grid max-w-sm gap-4">
          <TextField label="Current password" name="currentPassword" type="password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} error={errors.currentPassword} autoComplete="current-password" required />
          <TextField label="New password" name="newPassword" type="password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} error={errors.newPassword} autoComplete="new-password" required />
          <TextField label="Confirm new password" name="confirm" type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} error={errors.confirm} autoComplete="new-password" required />
        </div>
        <button type="submit" disabled={saving === 'password'} className="mt-4 rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent disabled:opacity-50">
          {saving === 'password' ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}