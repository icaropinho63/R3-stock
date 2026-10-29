import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Company, Plan } from '../types';

interface RegisterData {
  companyName: string;
  name: string;
  email: string;
  password: string;
  cnpj?: string;
  phone?: string;
  planId?: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  plan: Plan | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  loginAsDemo: (type: 'demo' | 'admin') => Promise<void>;
  setCompanyPlanLocally: (plan: Plan, company: Company) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('r3stock_token') || localStorage.getItem('stockflow_token')
  );
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setCompany(data.company);
        setPlan(data.plan);
      } else {
        // Token inválido, limpa sessão
        logout();
      }
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Falha ao autenticar.' };
      }

      setToken(data.token);
      localStorage.setItem('r3stock_token', data.token);
      setUser(data.user);
      setCompany(data.company);
      setPlan(data.plan);
      return { success: true };
    } catch {
      return { success: false, error: 'Erro de conexão com o servidor.' };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Erro ao realizar cadastro.' };
      }

      setToken(resData.token);
      localStorage.setItem('r3stock_token', resData.token);
      setUser(resData.user);
      setCompany(resData.company);
      setPlan(resData.plan);
      return { success: true };
    } catch {
      return { success: false, error: 'Erro ao conectar ao servidor.' };
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    setPlan(null);
    setToken(null);
    localStorage.removeItem('r3stock_token');
    localStorage.removeItem('stockflow_token');
  };

  const refreshUserData = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  const loginAsDemo = async (type: 'demo' | 'admin') => {
    if (type === 'admin') {
      const res = await login('admin@r3stock.com.br', 'admin123');
      if (!res.success) {
        await login('admin@stockflow.com.br', 'admin123');
      }
    } else {
      const res = await login('demo@r3stock.com.br', 'demo123');
      if (!res.success) {
        await login('demo@stockflow.com.br', 'demo123');
      }
    }
  };

  const setCompanyPlanLocally = (newPlan: Plan, newCompany: Company) => {
    setPlan(newPlan);
    setCompany(newCompany);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        plan,
        token,
        loading,
        login,
        register,
        logout,
        refreshUserData,
        loginAsDemo,
        setCompanyPlanLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
