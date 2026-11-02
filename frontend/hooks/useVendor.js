'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getApiError } from '@/lib/api';

const VENDOR_KEY = ['vendor', 'me'];

/** 404 → null (no store yet) — drives the apply/awaiting/active states. */
export function useMyVendor() {
  return useQuery({
    queryKey: VENDOR_KEY,
    queryFn: async () => {
      try {
        const res = await api.get('/vendors/me');
        return res.data.data.vendor;
      } catch (err) {
        if (getApiError(err).status === 404) return null;
        throw err;
      }
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function useApplyVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.post('/vendors/apply', body)).data.data.vendor,
    onSuccess: (vendor) => qc.setQueryData(VENDOR_KEY, vendor),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.patch('/vendors/me', body)).data.data.vendor,
    onSuccess: (vendor) => qc.setQueryData(VENDOR_KEY, vendor),
  });
}