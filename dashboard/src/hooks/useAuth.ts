import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.loadFromStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: store.login,
    logout: store.logout,
    setUser: store.setUser,
    isAdmin: store.user?.role === 'ADMIN',
  };
}
