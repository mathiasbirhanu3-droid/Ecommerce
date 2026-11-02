'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAdminStats, useAdminVendors, useSetVendorStatus } from '@/hooks/useAdmin';
import StatusBadge from '@/components/ui/StatusBadge';

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'suspended', label: 'Suspended' },
];

function TwoStepButton({ onConfirm, className, children }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 2500); // auto-disarm — no stuck confirm state
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={className}
    >
      {armed ? 'Confirm?' : children}
    </button>
  );
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('');
  const stats = useAdminStats();
  const vendors = useAdminVendors(tab);
  const setStatus = useSetVendorStatus();

  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') router.replace('/'); // layer-3 guard
  }, [authLoading, user, router]);

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="mx-auto max-w-5xl px-4 py-16"><div className="h-96 animate-pulse rounded-2xl bg-raised" /></div>;
  }

  const cards = [
    { label: 'Users', value: stats.data?.users },
    { label: 'Vendors', value: stats.data?.vendors },
    { label: 'Pending stores', value: stats.data?.vendorsPending },
    { label: 'Active products', value: stats.data?.products },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Admin panel<span className="text-accent">.</span></h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-black/5 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink/40">{c.label}</p>
            <p className="mt-1 font-display text-3xl font-bold">{c.value ?? '—'}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Vendor management</h2>
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tab === t.key ? 'bg-ink text-white' : 'bg-raised hover:bg-raised/70'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {vendors.isLoading ? (
          <div className="mt-6 h-40 animate-pulse rounded-xl bg-raised" />
        ) : (vendors.data?.items?.length ?? 0) === 0 ? (
          <p className="mt-6 rounded-xl bg-raised p-6 text-center text-sm text-ink/50">No vendors in this view.</p>
        ) : (
          <ul className="mt-6 divide-y divide-black/5">
            {vendors.data.items.map((v) => (
              <li key={v._id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold">{v.storeName} <StatusBadge status={v.status} /></p>
                  <p className="text-xs text-ink/50">
                    Owner: {v.owner?.name} ({v.owner?.email}) · applied {new Date(v.createdAt).toLocaleDateString('en-US')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {v.status !== 'approved' && (
                    <TwoStepButton
                      onConfirm={() => setStatus.mutate({ id: v._id, status: 'approved' })}
                      className="rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90">
                      Approve
                    </TwoStepButton>
                  )}
                  {v.status === 'approved' && (
                    <TwoStepButton
                      onConfirm={() => setStatus.mutate({ id: v._id, status: 'suspended' })}
                      className="rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90">
                      Suspend
                    </TwoStepButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-ink/40">Orders, payments (v1.2 manager) and moderation panels arrive in Steps 6–7.</p>
    </div>
  );
}