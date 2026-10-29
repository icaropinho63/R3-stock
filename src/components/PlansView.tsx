import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  CreditCard,
  Zap,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Layers,
  X,
} from 'lucide-react';
import { Plan, Company } from '../types';
import { useAuth } from '../context/AuthContext';

interface PlansViewProps {
  plans: Plan[];
  company: Company | null;
  currentProductCount: number;
  onUpgradeSuccess: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({
  plans,
  company,
  currentProductCount,
  onUpgradeSuccess,
}) => {
  const { token, setCompanyPlanLocally } = useAuth();
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan | null>(null);
  const [mpModalOpen, setMpModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mpResponse, setMpResponse] = useState<any>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const currentPlanId = company?.planId || 'free';
  const currentPlan = plans.find(p => p.id === currentPlanId) || plans[0];

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === currentPlanId) return;

    setSelectedPlanForCheckout(plan);
    setLoading(true);
    setMpModalOpen(true);
    setMpResponse(null);

    try {
      const res = await fetch('/api/payments/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();
      setMpResponse(data);
    } catch (err: any) {
      setMpResponse({
        mode: 'error',
        message: 'Erro ao conectar à API de pagamentos.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplySimulatedUpgrade = async (planId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/companies/upgrade-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCompanyPlanLocally(data.plan, data.company);
        setActionNotice(`Plano atualizado para ${data.plan.name} com sucesso!`);
        setMpModalOpen(false);
        onUpgradeSuccess();
      }
    } catch {
      setActionNotice('Erro ao atualizar plano.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Planos & Assinaturas R3-Stock
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Gerencie o plano da sua empresa com limites escaláveis e integração oficial Mercado Pago.
        </p>
      </div>

      {actionNotice && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Card do Plano Atual */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-blue-700 tracking-wider">
                  Assinatura Atual
                </span>
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  Plano {currentPlan?.name}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {currentPlan?.price === 0 ? 'Plano Gratuito' : `R$ ${currentPlan?.price.toFixed(2).replace('.', ',')} por mês`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600 font-medium">
            <div>
              <span className="block text-slate-400 text-[11px]">Capacidade do Plano</span>
              <span className="font-bold text-slate-900">
                {currentProductCount} / {company?.maxProducts || currentPlan?.maxProducts} produtos
              </span>
            </div>
            <div>
              <span className="block text-slate-400 text-[11px]">Usuários Permitidos</span>
              <span className="font-bold text-slate-900">
                Até {company?.maxUsers || currentPlan?.maxUsers} colaborador(es)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Planos Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map(p => {
          const isCurrent = p.id === currentPlanId;
          const isPro = p.id === 'pro';

          return (
            <div
              key={p.id}
              className={`flex flex-col justify-between rounded-2xl bg-white p-6 shadow-xs transition-all relative ${
                isCurrent
                  ? 'border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
                  : isPro
                  ? 'border-2 border-blue-600 shadow-lg shadow-blue-500/10'
                  : 'border border-slate-200'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                  Seu Plano Ativo
                </div>
              )}

              {isPro && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                  Recomendado
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-extrabold text-slate-900">{p.name}</h3>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {p.maxProducts.toLocaleString('pt-BR')} produtos
                  </span>
                </div>

                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {p.price === 0 ? 'R$ 0' : `R$ ${p.price.toFixed(2).replace('.', ',')}`}
                  </span>
                  <span className="ml-1 text-xs text-slate-400 font-medium">/mês</span>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Incluso no Plano:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Até <strong>{p.maxProducts.toLocaleString('pt-BR')}</strong> produtos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Até <strong>{p.maxUsers}</strong> usuário(s) ativos</span>
                    </li>
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 border border-emerald-200 cursor-default"
                  >
                    Plano Ativo
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(p)}
                    className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all shadow-xs ${
                      isPro
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                        : p.id === 'business'
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    {p.price === 0 ? 'Mudar para Free' : `Assinar ${p.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Checkout / Mercado Pago */}
      {mpModalOpen && selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setMpModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assinatura do Plano {selectedPlanForCheckout.name}
                </h3>
                <p className="text-xs text-slate-500">Checkout Seguro via Mercado Pago</p>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Gerando preferência de pagamento no Mercado Pago...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500">Plano escolhido:</span>
                    <span className="font-bold text-slate-900">{selectedPlanForCheckout.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500">Valor mensal:</span>
                    <span className="font-extrabold text-blue-700">
                      R$ {selectedPlanForCheckout.price.toFixed(2).replace('.', ',')}/mês
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Novo limite de produtos:</span>
                    <span className="font-bold text-slate-900">
                      {selectedPlanForCheckout.maxProducts.toLocaleString('pt-BR')} produtos
                    </span>
                  </div>
                </div>

                {/* Status da Integração Mercado Pago */}
                {mpResponse?.mode === 'production_api' ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                      Link de pagamento oficial do Mercado Pago gerado com sucesso!
                    </div>
                    <a
                      href={mpResponse.initPoint || mpResponse.sandboxInitPoint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-xs font-bold text-white shadow-md hover:bg-sky-600"
                    >
                      <span>Abrir Checkout Mercado Pago</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                      <p className="font-bold flex items-center gap-1.5 mb-1">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Integração Mercado Pago Pronta:</span>
                      </p>
                      <p className="text-[11px] text-amber-800">
                        O backend do R3-Stock possui os endpoints prontos com webhooks. Para receber cobranças reais em produção, configure <code>MERCADO_PAGO_ACCESS_TOKEN</code> no arquivo <code>.env</code>.
                      </p>
                    </div>

                    <button
                      onClick={() => handleApplySimulatedUpgrade(selectedPlanForCheckout.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Ativar Plano {selectedPlanForCheckout.name} para Demonstração</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
