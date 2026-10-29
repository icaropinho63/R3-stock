import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, 
  Sparkles, 
  Database, 
  LogOut, 
  User as UserIcon, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { R3StockLogo } from './R3StockLogo';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenPlans: () => void;
  onOpenSupabaseStatus: () => void;
  currentProductCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenPlans,
  onOpenSupabaseStatus,
  currentProductCount,
}) => {
  const { user, company, plan, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const maxProducts = company?.maxProducts || plan?.maxProducts || 50;
  const usagePercent = Math.min(100, Math.round((currentProductCount / maxProducts) * 100));

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Esquerda: Botão Menu Mobile & Logo R3-Stock */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Alternar menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <R3StockLogo size="md" showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-slate-900 text-lg sm:text-xl">
                R3<span className="text-blue-600">-Stock</span>
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                SaaS Gestão
              </span>
            </div>
            {company && (
              <p className="text-xs text-slate-500 font-medium truncate max-w-[160px] sm:max-w-[240px]">
                {company.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Direita: Indicador de Plano, Supabase Status, Usuário */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Status Supabase / Banco */}
        <button
          onClick={onOpenSupabaseStatus}
          className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          title="Verificar status do Supabase e script PostgreSQL"
        >
          <Database className="h-3.5 w-3.5 text-emerald-600" />
          <span>PostgreSQL / Supabase</span>
        </button>

        {/* Badge do Plano Atual */}
        {plan && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPlans}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-xs ${
                plan.id === 'business'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200'
                  : plan.id === 'pro'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Plano {plan.name}</span>
            </button>

            {/* Barra de Limite de Produtos */}
            <div 
              onClick={onOpenPlans} 
              className="hidden lg:flex flex-col cursor-pointer border border-slate-200 rounded-lg px-2.5 py-1 hover:border-blue-300 transition-colors bg-white"
            >
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium gap-3">
                <span>Produtos:</span>
                <span className="font-semibold text-slate-700">{currentProductCount} / {maxProducts}</span>
              </div>
              <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div 
                  className={`h-full transition-all rounded-full ${
                    usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Perfil e Menu do Usuário */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 sm:px-3 sm:py-1.5 hover:bg-slate-50 transition-colors"
            aria-expanded={dropdownOpen}
            aria-label="Menu do perfil do usuário"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[110px]">
                {user?.name || 'Usuário'}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">
                {user?.role === 'platform_admin' ? 'Super Admin' : user?.role === 'owner' ? 'Proprietário' : 'Colaborador'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div 
              className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="border-b border-slate-100 px-4 py-2">
                <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                {user?.role === 'platform_admin' && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                    <ShieldCheck className="h-3 w-3" /> Painel SaaS Master
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenPlans();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Gerenciar Assinatura & Planos</span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenSupabaseStatus();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Database className="h-4 w-4 text-emerald-600" />
                <span>Status do Banco & Supabase</span>
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
