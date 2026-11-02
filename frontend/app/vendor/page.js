'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useMyVendor, useApplyVendor, useUpdateVendor } from '@/hooks/useVendor';
import { uploadImage } from '@/lib/upload';
import { getApiError } from '@/lib/api';
import { applySchema, settingsSchema, zodToFieldErrors } from '@/lib/validation/vendor';
import { dollarsToCents, centsToDollarInput, formatPrice } from '@/lib/formatPrice';
import TextField from '@/components/ui/TextField';
import StatusBadge from '@/components/ui/StatusBadge';

function ImagePicker({ label, value, kind, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const { url } = await uploadImage(file, kind);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-black/10 bg-raised">
          {value ? <Image src={value} alt={label} width={80} height={80} className="h-20 w-20 object-cover" unoptimized /> : <span className="text-xs text-ink/40">None</span>}
        </div>
        <div>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={busy}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-4 file:py-2 file:text-white hover:file:bg-accent" />
          {busy && <p className="mt-1 text-xs text-ink/50">Uploading…</p>}
          {error && <p role="alert" className="mt-1 text-xs font-medium text-danger">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function ApplyForm() {
  const apply = useApplyVendor();
  const [values, setValues] = useState({ storeName: '', description: '', logo: '', banner: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const parsed = applySchema.safeParse(values);
    if (!parsed.success) return setErrors(zodToFieldErrors(parsed.error));
    setErrors({});
    try {
      await apply.mutateAsync(parsed.data);
    } catch (err) {
      setFormError(getApiError(err).message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <h2 className="font-display text-2xl font-bold">Open your store<span className="text-accent">.</span></h2>
      <p className="text-sm text-ink/60">Apply once — our team reviews every store to keep the marketplace trusted.</p>
      {formError && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{formError}</p>}
      <TextField label="Store name" name="storeName" value={values.storeName}
        onChange={(e) => setValues((v) => ({ ...v, storeName: e.target.value }))} error={errors.storeName} required />
      <TextField label="Short description" name="description" value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} error={errors.description} />
      <ImagePicker label="Logo (optional)" kind="logo" value={values.logo} onChange={(url) => setValues((v) => ({ ...v, logo: url }))} />
      <ImagePicker label="Banner (optional)" kind="banner" value={values.banner} onChange={(url) => setValues((v) => ({ ...v, banner: url }))} />
      <button type="submit" disabled={apply.isPending}
        className="w-full rounded-xl bg-ink py-3.5 font-semibold text-white transition-colors hover:bg-accent disabled:opacity-50">
        {apply.isPending ? 'Submitting…' : 'Apply for a store'}
      </button>
    </form>
  );
}

function SettingsForm({ vendor }) {
  const update = useUpdateVendor();
  const [values, setValues] = useState({
    description: vendor.description || '',
    shippingFee: centsToDollarInput(vendor.shippingFee),
    freeShippingOver: centsToDollarInput(vendor.freeShippingOver),
    logo: vendor.logo || '',
    banner: vendor.banner || '',
  });
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setValues((v) => ({ ...v, description: vendor.description || '', logo: vendor.logo || '', banner: vendor.banner || '' }));
  }, [vendor]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setNotice('');
    setFormError('');
    const parsed = settingsSchema.safeParse(values);
    if (!parsed.success) return setFormError('Check the fields and try again.');

    const shippingFeeCents = dollarsToCents(values.shippingFee) ?? 0;
    const freeOverCents = values.freeShippingOver === '' ? null : dollarsToCents(values.freeShippingOver);
    if (Number.isNaN(shippingFeeCents) || (freeOverCents ?? 0) < 0) {
      return setFormError('Shipping values must be valid numbers.');
    }

    try {
      await update.mutateAsync({
        description: values.description,
        shippingFee: shippingFeeCents,          // ADR-07: cents on the wire, ALWAYS
        freeShippingOver: freeOverCents,
        logo: values.logo,
        banner: values.banner,
      });
      setNotice('Store settings saved.');
    } catch (err) {
      setFormError(getApiError(err).message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-black/5 bg-white p-6">
      <h2 className="font-display text-xl font-bold">Store settings</h2>
      {notice && <p className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">{notice}</p>}
      {formError && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{formError}</p>}
      <TextField label="Description" name="description" value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Flat shipping fee" name="shippingFee" value={values.shippingFee}
          onChange={(e) => setValues((v) => ({ ...v, shippingFee: e.target.value }))} placeholder="5.00" />
        <TextField label="Free shipping over (blank = never)" name="freeShippingOver" value={values.freeShippingOver}
          onChange={(e) => setValues((v) => ({ ...v, freeShippingOver: e.target.value }))} placeholder="50.00" />
      </div>
      <p className="text-xs text-ink/50">Current: {formatPrice(vendor.shippingFee)} flat{vendor.freeShippingOver != null ? ` · free over ${formatPrice(vendor.freeShippingOver)}` : ''}</p>
      <ImagePicker label="Logo" kind="logo" value={values.logo} onChange={(url) => setValues((v) => ({ ...v, logo: url }))} />
      <ImagePicker label="Banner" kind="banner" value={values.banner} onChange={(url) => setValues((v) => ({ ...v, banner: url }))} />
      <button type="submit" disabled={update.isPending}
        className="rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent disabled:opacity-50">
        {update.isPending ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
}

export default function VendorPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: vendor, isLoading } = useMyVendor();

  if (authLoading || isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><div className="h-96 animate-pulse rounded-2xl bg-raised" /></div>;
  }
  if (!user) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-ink/60">Please <Link href="/login?next=/vendor" className="font-semibold text-accent">sign in</Link> to manage your store.</p>
    </div>;
  }

  // Layer-3 cosmetic guard (Edge + Express are the real gates, §5.4)
  if (user.role === 'admin') {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-ink/60">Admins manage stores from the <Link href="/admin" className="font-semibold text-accent">Admin panel</Link>.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Vendor dashboard<span className="text-accent">.</span></h1>

      {!vendor && <div className="rounded-2xl border border-black/5 bg-white p-8"><ApplyForm /></div>}

      {vendor?.status === 'pending' && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-8">
          <StatusBadge status="pending" />
          <h2 className="mt-3 font-display text-2xl font-bold">Awaiting approval</h2>
          <p className="mt-2 text-sm text-ink/60">
            <b>{vendor.storeName}</b> is under review. You&apos;ll get an email the moment it&apos;s approved —
            then you can list products and receive orders.
          </p>
        </div>
      )}

      {vendor?.status === 'suspended' && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-8">
          <StatusBadge status="suspended" />
          <h2 className="mt-3 font-display text-2xl font-bold">Store suspended</h2>
          <p className="mt-2 text-sm text-ink/60">Your products are hidden from the marketplace. Contact support to resolve this.</p>
        </div>
      )}

      {vendor?.status === 'approved' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl bg-raised">
                {vendor.logo
                  ? <Image src={vendor.logo} alt={vendor.storeName} width={56} height={56} className="h-14 w-14 object-cover" unoptimized />
                  : <span className="font-display font-bold">{vendor.storeName[0]}</span>}
              </div>
              <div>
                <p className="font-display text-xl font-bold">{vendor.storeName}</p>
                <StatusBadge status={vendor.status} />
              </div>
            </div>
            <Link href={`/store/${vendor.slug}`} className="rounded-xl bg-raised px-4 py-2 text-sm font-semibold hover:bg-raised/70">
              View public store ↗
            </Link>
          </div>
          <SettingsForm vendor={vendor} />
          <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-ink/50">
            Product manager (list, add, edit with image uploads) arrives in <b>Step 4</b>.
          </div>
        </>
      )}
    </div>
  );
}