'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => (await api.get('/admin/stats')).data.data,
    staleTime: 30_000,
  });
}

export function useAdminVendors(status) {
  return useQuery({
    queryKey: ['admin', 'vendors', status || 'all'],
    queryFn: async () =>
      (await api.get('/admin/vendors', { params: status ? { status } : {} })).data.data,
    staleTime: 15_000,
  });
}

export function useSetVendorStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => api.patch(`/admin/vendors/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'vendors'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}