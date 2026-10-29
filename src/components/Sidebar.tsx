import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Truck,
  BarChart3,
  CreditCard,
  ShieldCheck,
  X,
  Sparkles,
  Database,
} from 'lucide-react';

import { R3StockLogo } from './R3StockLogo';

export type ActiveTab = 
  | 'dashboard'
  | 'products'
  | 'movements'
  | 'suppliers'
  | 'reports'
  | 'plans'
  | 'admin';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  currentProductCount: number;
  onOpenPlans: () => void;
  onOpenSupabase: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  currentProductCount,
  onOpenPlans,
  onOpenSupabase,
}) => {
  const { user, company, plan } = useAuth();

  const isPlatformAdmin = 
    user?.role === 'platform_admin' || 
    user?.email === 'admin@r3stock.com.br' || 
    user?.email === 'admin@stockflow.com.br';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'products' as ActiveTab,
      label: 'Produtos',
      icon: Package,
      badge: currentProductCount > 0 ? currentProductCount : null,
    },
    {
      id: 'movements' as ActiveTab,
      label: 'Movimentações',
      icon: ArrowLeftRight,
      badge: null,
    },
    {
      id: 'suppliers' as ActiveTab,
      label: 'Fornecedores',
      icon: Truck,
      badge: null,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Relatórios & CSV',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'plans' as ActiveTab,
      label: 'Planos & Assinatura',
      icon: CreditCard,
      badge: plan?.name,
    },
    {
      id: 'admin' as ActiveTab,
      label: 'Painel SaaS Owner',
      icon: ShieldCheck,
      badge: isPlatformAdmin ? 'Master' : 'Admin',
    },
  ];

  const maxProducts = company?.maxProducts || plan?.maxProducts || 50;
  const usagePercent = Math.min(100, Math.round((currentProductCount / maxProducts) * 100));

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Overlay Backdrop para Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabeçalho da Sidebar em Mobile */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 lg:hidden">
          <R3StockLogo size="sm" showText={true} />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Informações da Empresa (Desktop) */}
        <div className="hidden lg:block p-4 border-b border-slate-100">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Empresa Conectada
            </p>
            <p className="font-bold text-slate-900 text-sm truncate mt-0.5">
              {company?.name || 'Sua Empresa'}
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-slate-500 font-medium">Plano:</span>
              <span className="font-semibold text-blue-700 capitalize">{plan?.name || 'Free'}</span>
            </div>
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3" aria-label="Navegação Principal">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'Admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Card inferior: Limite do plano e Atalho Supabase */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* Card de Uso */}
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
              <span>Uso do Plano {plan?.name}</span>
              <span className="text-blue-700">{usagePercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  usagePercent >= 90 ? 'bg-rose-500' : usagePercent >= 75 ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>{currentProductCount} de {maxProducts} produtos</span>
              <button
                onClick={onOpenPlans}
                className="font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-0.5"
              >
                <Sparkles className="h-3 w-3" /> Upgrade
              </button>
            </div>
          </div>

          {/* Botão de Conexão Supabase / PostgreSQL */}
          <button
            onClick={onOpenSupabase}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Database className="h-3.5 w-3.5 text-emerald-600" />
            <span>Guia SQL Supabase</span>
          </button>
        </div>
      </aside>
    </>
  );
};
