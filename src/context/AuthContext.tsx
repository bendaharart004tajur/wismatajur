'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Pengurus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { loginAction } from '@/app/actions/auth-actions';

// The user object in the context should not have the password.
type UserInContext = Omit<Pengurus, 'password'>;

interface AuthContextType {
  user: UserInContext | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInContext | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('rt-user');
      if (storedUser) {
        const parsedUser: UserInContext = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
        console.error("Could not parse user from localStorage", error);
        localStorage.removeItem('rt-user');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/login')) {
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    const result = await loginAction(email, password);
    
    if (result.success && result.user) {
      setUser(result.user);
      try {
        localStorage.setItem('rt-user', JSON.stringify(result.user));
      } catch (error) {
        console.error("Could not save user to localStorage", error);
      }
      router.push('/dashboard');
      return true;
    }

    toast({
        title: "Login Gagal",
        description: result.message || "Email atau password salah.",
        variant: "destructive",
    });
    return false;
  };

  const logout = () => {
    setUser(null);
     try {
        localStorage.removeItem('rt-user');
      } catch (error) {
        console.error("Could not remove user from localStorage", error);
      }
    router.push('/login');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
