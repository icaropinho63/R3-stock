import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Building2, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Plan } from '../types';
import { R3StockLogo } from './R3StockLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialPlanId?: string;
  plans: Plan[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialPlanId = 'free',
  plans,
}) => {
  const { login, register, loginAsDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || 'Erro ao realizar login.');
        } else {
          onClose();
        }
      } else if (mode === 'register') {
        const res = await register({
          companyName,
          name,
          email,
          password,
          cnpj,
          phone,
          planId: selectedPlanId,
        });
        if (!res.success) {
          setError(res.error || 'Erro ao cadastrar.');
        } else {
          onClose();
        }
      } else if (mode === 'forgot') {
        setForgotSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (type: 'demo' | 'admin') => {
    setLoading(true);
    await loginAsDemo(type);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Fechar janela"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho R3-Stock */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <R3StockLogo size="lg" showText={false} />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {mode === 'login'
              ? 'Acessar o R3-Stock'
              : mode === 'register'
              ? 'Criar Conta no R3-Stock'
              : 'Recuperar Senha'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Entre com suas credenciais ou teste com um clique'
              : mode === 'register'
              ? 'Cadastre sua empresa e comece a gerenciar hoje'
              : 'Informe seu e-mail para receber as instruções de recuperação'}
          </p>
        </div>

        {/* Botões de Acesso Rápido para Demonstração */}
        {mode === 'login' && (
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
            <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>Acesso Rápido para Demonstração:</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('demo')}
                className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors text-center"
              >
                Gestor TechStore
              </button>
              <button
                type="button"
                onClick={() => handleDemo('admin')}
                className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-900 transition-colors text-center"
              >
                Admin Plataforma
              </button>
            </div>
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Tela de Sucesso da Recuperação */}
        {mode === 'forgot' && forgotSent ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">E-mail Enviado!</h3>
            <p className="text-xs text-slate-600 mt-2">
              Se houver uma conta cadastrada com <strong>{email}</strong>, enviamos um link para redefinição de senha.
            </p>
            <button
              onClick={() => {
                setForgotSent(false);
                setMode('login');
              }}
              className="mt-5 text-xs font-bold text-blue-600 hover:underline"
            >
              Voltar para o Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome da Empresa *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Minha Distribuidora Ltda"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seu Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Seleção do Plano no Cadastro */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plano Selecionado
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={e => setSelectedPlanId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.price === 0 ? 'Grátis' : `R$ ${p.price.toFixed(2).replace('.', ',')}/mês`} (Até {p.maxProducts} produtos)
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Corporativo *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="exemplo@empresa.com.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Senha *</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <span>Processando...</span>
              ) : mode === 'login' ? (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : mode === 'register' ? (
                <>
                  <span>Criar Minha Empresa</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <span>Enviar Link de Recuperação</span>
              )}
            </button>
          </form>
        )}

        {/* Rodapé da modal: Alternar modo */}
        <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-600">
          {mode === 'login' ? (
            <p>
              Ainda não tem conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('register');
                }}
                className="font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Cadastre sua empresa grátis
              </button>
            </p>
          ) : (
            <p>
              Já possui cadastro?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Fazer login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
