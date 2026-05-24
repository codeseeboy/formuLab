'use client';
// ============================================================
// FormuLab — Auth Hook
// ============================================================

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { AuthUser, Organization, Member, AuthState } from '../lib/types';
import * as authService from '../lib/services/auth.service';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, orgName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    org: null,
    member: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const member = await authService.getUserMembership(user.$id);
        let org: Organization | null = null;
        if (member?.org_id) {
          org = await authService.getOrganization(member.org_id);
        }
        setState({
          user,
          org,
          member,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({ user: null, org: null, member: null, isLoading: false, isAuthenticated: false });
      }
    } catch {
      setState({ user: null, org: null, member: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    await authService.signIn(email, password);
    await refreshUser();
  };

  const register = async (email: string, password: string, name: string, orgName: string) => {
    await authService.signUp(email, password, name, orgName);
    await refreshUser();
  };

  const logout = async () => {
    await authService.signOut();
    setState({ user: null, org: null, member: null, isLoading: false, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
