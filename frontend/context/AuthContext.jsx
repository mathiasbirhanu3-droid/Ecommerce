'use client';

import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getApiError } from '@/lib/api';

const AuthContext = createContext(null);
const ME_KEY = ['auth', 'me'];

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  // FR-AUTH-04: single source of session truth — any component can consume it.
  const { data, isLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        const res = await api.get('/auth/me');
        return res.data.data.user;
      } catch (err) {
        if (getApiError(err).status === 401) return null; // 401 = simply logged out, not an error state
        throw err;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  const setSessionUser = (user) => queryClient.setQueryData(ME_KEY, user);

  const login = async (values) => {
    const res = await api.post('/auth/login', values);
    setSessionUser(res.data.data.user);
    // Step 5 hook (FR-AUTH-08): if localStorage has a guest cart → POST /cart/merge here.
    return res.data.data.user;
  };

  const register = async (values) => {
    const res = await api.post('/auth/register', values); // server starts the session (FR-AUTH-01/02)
    setSessionUser(res.data.data.user);
    return res.data.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Clear ALL cached queries — no stale cart/orders can leak across accounts (bug-guard).
      queryClient.clear();
    }
  };

  const value = {
    user: data ?? null,
    isLoading,
    isAuthenticated: Boolean(data),
    login,
    register,
    logout,
    refreshSession: () => queryClient.invalidateQueries({ queryKey: ME_KEY }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);