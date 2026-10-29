import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  BarChart2,
  Layers,
  ChevronDown,
  Sparkles,
  Users,
  Package,
  TrendingUp,
} from 'lucide-react';
import { Plan } from '../types';
import { R3StockLogo } from './R3StockLogo';

interface LandingPageProps {
  onStartFree: (planId?: string) => void;
  onLogin: () => void;
  onDemoLogin: (type: 'demo' | 'admin') => void;
  plans: Plan[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartFree,
  onLogin,
  onDemoLogin,
  plans,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const defaultFaqs = [
    {
      q: 'Como funciona o período gratuito do R3-Stock?',
      a: 'O plano FREE é 100% gratuito para sempre! Você pode cadastrar até 50 produtos, gerenciar entradas e saídas, emitir relatórios básicos e usar todas as ferramentas essenciais sem informar cartão de crédito.',
    },
    {
      q: 'Como é feita a integração com o Supabase e PostgreSQL?',
      a: 'O R3-Stock foi arquitetado para PostgreSQL com suporte nativo ao Supabase Auth e políticas de Row Level Security (RLS). Cada empresa tem isolamento completo de seus dados. Você pode rodar com a persistência integrada ou conectar seu próprio projeto Supabase em instantes com nosso script SQL pronto.',
    },
    {
      q: 'Como funcionam os pagamentos via Mercado Pago?',
      a: 'As assinaturas dos planos Pro e Business contam com checkout transparente e seguro do Mercado Pago, com suporte a Cartão de Crédito, PIX e Boleto, além de webhooks para renovação e cancelamento automáticos.',
    },
    {
      q: 'O sistema impede estoque negativo?',
      a: 'Sim! Nosso motor de regras de negócio valida todas as saídas no backend. Se uma saída solicitada for superior ao saldo em estoque, a operação é bloqueada automaticamente com aviso em tela.',
    },
    {
      q: 'Posso exportar e importar dados via CSV?',
      a: 'Com certeza! Você pode exportar relatórios completos de posição de estoque, movimentações e indicadores financeiros para o Excel e sistemas externos no formato CSV com padrão brasileiro.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* Navbar Superior */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <R3StockLogo size="md" />
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">
              Funcionalidades
            </a>
            <a href="#precos" className="hover:text-blue-600 transition-colors">
              Preços & Planos
            </a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">
              Perguntas Frequentes
            </a>
            <a href="#seguranca" className="hover:text-blue-600 transition-colors">
              Segurança RLS
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onDemoLogin('demo')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>Ver Demo Rápida</span>
            </button>

            <button
              onClick={onLogin}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Entrar
            </button>

            <button
              onClick={() => onStartFree('free')}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors"
            >
              <span>Começar Grátis</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 mb-6 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>SaaS de Controle de Estoque com Planos Flexíveis</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
              Controle seu estoque com precisão profissional e{' '}
              <span className="text-blue-600">zero surpresas</span>.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              O <strong>R3-Stock</strong> simplifica a gestão de produtos, controle de entradas e saídas,
              prevenção de estoque negativo e relacionamento com fornecedores para empresas em crescimento.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onStartFree('free')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-md shadow-blue-500/30 hover:bg-blue-700 transition-all cursor-pointer"
              >
                <span>Criar Conta Gratuita</span>
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={() => onDemoLogin('demo')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                <span>Acessar Painel de Demonstração</span>
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Plano Free sem cartão
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Isolamento Multi-Empresa
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Bloqueio de Estoque Negativo
              </span>
            </div>
          </div>

          {/* Mockup Preview do Dashboard */}
          <div className="mt-14 rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-5 shadow-2xl shadow-blue-900/10">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-400"></div>
                <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
                <span className="ml-2 text-xs font-mono text-slate-400">painel.r3stock.com.br/dashboard</span>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Visão Geral em Tempo Real
              </span>
            </div>

            {/* Simulação visual do Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-semibold text-slate-500">Total de Produtos</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">248</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +12% esse mês
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-semibold text-slate-500">Valor em Estoque</p>
                <p className="text-2xl font-extrabold text-blue-700 mt-1">R$ 64.820</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1">Preço de Custo Total</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-semibold text-slate-500">Entradas / Mês</p>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">420 un</p>
                <p className="text-[10px] text-emerald-600 font-medium mt-1">Compras e reposições</p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5">
                <p className="text-[11px] font-semibold text-rose-600">Estoque Crítico</p>
                <p className="text-2xl font-extrabold text-rose-700 mt-1">3 itens</p>
                <p className="text-[10px] text-rose-600 font-bold mt-1">Abaixo do estoque mínimo</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-600 font-medium">
                Interface responsiva, ágil e projetada para operadores de estoque, administradores e gerentes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Funcionalidades */}
      <section id="funcionalidades" className="py-20 bg-white border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Recursos Completos</h2>
            <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Tudo o que sua empresa precisa para gerir o inventário
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 mb-5">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Catálogo Detalhado de Produtos</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Cadastro de SKU, código de barras, categoria, unidade de medida, preço de custo, preço de venda e cálculo instantâneo da margem de lucro.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-5">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Proteção Anti-Estoque Negativo</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Bloqueio estrito no backend para evitar que vendas ou baixas manuais deixem o saldo negativo, mantendo a integridade fiscal e contábil.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-5">
                <BarChart2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Histórico de Movimentações</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Auditoria completa com registro da data, hora, usuário responsável, tipo (entrada, saída ou balanço) e justificativa da movimentação.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 mb-5">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Gestão de Fornecedores</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Vincule fornecedores a cada produto, registre prazos, contatos e telefones para agilizar cotações e compras de reposição.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 mb-5">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Relatórios & Exportação CSV</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Exporte inventário, produtos em falta, valor patrimonial e movimentações para planilhas Excel em formato brasileiro com 1 clique.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-300 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-5">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Segurança Multi-Tenant & RLS</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Políticas de Row Level Security (RLS) no PostgreSQL/Supabase garantem que cada empresa tenha acesso estrito apenas aos seus dados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabela de Preços e Planos */}
      <section id="precos" className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Planos Transparentes</h2>
            <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Escolha o plano ideal para a sua empresa
            </p>
            <p className="mt-3 text-slate-600 text-sm">
              Comece no plano gratuito e faça upgrade conforme o crescimento do seu estoque.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map(p => {
              const isPro = p.id === 'pro';
              const isBusiness = p.id === 'business';

              return (
                <div
                  key={p.id}
                  className={`relative flex flex-col justify-between rounded-2xl bg-white p-7 shadow-sm transition-all ${
                    isPro
                      ? 'border-2 border-blue-600 shadow-xl shadow-blue-500/10 scale-105 z-10'
                      : 'border border-slate-200'
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider shadow-sm">
                      Mais Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {p.maxProducts.toLocaleString('pt-BR')} produtos
                      </span>
                    </div>

                    <div className="mt-5 flex items-baseline">
                      <span className="text-4xl font-extrabold text-slate-900">
                        {p.price === 0 ? 'R$ 0' : `R$ ${p.price.toFixed(2).replace('.', ',')}`}
                      </span>
                      <span className="ml-1 text-xs text-slate-500 font-medium">/mês</span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Ideal para {p.id === 'free' ? 'pequenos comércios iniciando' : p.id === 'pro' ? 'empresas em expansão ativa' : 'grandes operações e distribuidores'}.
                    </p>

                    <div className="mt-6 border-t border-slate-100 pt-6">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                        O que está incluso:
                      </p>
                      <ul className="space-y-3 text-xs text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Até <strong>{p.maxProducts.toLocaleString('pt-BR')} produtos</strong></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Até <strong>{p.maxUsers} usuário(s)</strong></span>
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

                  <div className="mt-8">
                    <button
                      onClick={() => onStartFree(p.id)}
                      className={`w-full rounded-xl py-3 text-sm font-bold transition-all shadow-xs ${
                        isPro
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                          : isBusiness
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {p.price === 0 ? 'Começar Grátis' : `Assinar ${p.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Dúvidas Frequentes</h2>
            <p className="text-3xl font-extrabold text-slate-900">Perguntas Frequentes</p>
          </div>

          <div className="space-y-4">
            {defaultFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-br from-blue-700 to-indigo-800 py-16 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Pronto para transformar a gestão do seu estoque?
          </h2>
          <p className="mt-4 text-blue-100 text-base max-w-xl mx-auto">
            Crie sua conta em menos de 1 minuto e comece a controlar produtos, entradas e saídas agora mesmo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onStartFree('free')}
              className="w-full sm:w-auto rounded-xl bg-white px-8 py-3.5 text-base font-bold text-blue-800 shadow-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Criar Conta Gratuita
            </button>
            <button
              onClick={() => onDemoLogin('demo')}
              className="w-full sm:w-auto rounded-xl border border-blue-400 bg-blue-600/30 px-6 py-3.5 text-base font-bold text-white hover:bg-blue-600/50 transition-colors cursor-pointer"
            >
              Testar com Dados de Exemplo
            </button>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-slate-200 bg-white py-10 text-slate-500 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <R3StockLogo size="sm" showText={true} />
            <span className="text-slate-400 hidden sm:inline">• SaaS de Gestão de Estoque</span>
          </div>
          <p>© {new Date().getFullYear()} R3-Stock Brasil. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
