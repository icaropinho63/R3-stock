import React from 'react';
import {
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowLeftRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Product, StockMovement, Plan, Company } from '../types';
import { calculateInventoryTotals } from '../utils/inventoryRules';

interface DashboardViewProps {
  products: Product[];
  movements: StockMovement[];
  company: Company | null;
  plan: Plan | null;
  onOpenNewProduct: () => void;
  onOpenMovement: (type?: 'entry' | 'exit', product?: Product) => void;
  onNavigateToProducts: () => void;
  onNavigateToMovements: () => void;
  onOpenPlans: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  movements,
  company,
  plan,
  onOpenNewProduct,
  onOpenMovement,
  onNavigateToProducts,
  onNavigateToMovements,
  onOpenPlans,
}) => {
  const totals = calculateInventoryTotals(products);

  // Calcula entradas e saídas do mês atual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalEntriesMonth = 0;
  let totalExitsMonth = 0;

  movements.forEach(m => {
    const d = new Date(m.createdAt);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      if (m.type === 'entry') totalEntriesMonth += m.quantity;
      if (m.type === 'exit') totalExitsMonth += m.quantity;
    }
  });

  // Produtos que precisam de reposição (menor ou igual ao estoque mínimo)
  const criticalProducts = products.filter(p => p.quantity <= p.minStock);

  // Agrupamento por Categoria para o Gráfico
  const categoryMap: Record<string, { count: number; value: number }> = {};
  products.forEach(p => {
    const cat = p.category || 'Geral';
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, value: 0 };
    categoryMap[cat].count += p.quantity;
    categoryMap[cat].value += p.quantity * p.salePrice;
  });

  const categories = Object.keys(categoryMap).map(name => ({
    name,
    count: categoryMap[name].count,
    value: categoryMap[name].value,
  })).sort((a, b) => b.value - a.value);

  const maxCategoryValue = Math.max(...categories.map(c => c.value), 1);

  // Agrupamento das últimas 7 movimentações para histórico recente
  const recentMovements = movements.slice(0, 5);

  const maxProductsAllowed = company?.maxProducts || plan?.maxProducts || 50;
  const isNearLimit = products.length >= maxProductsAllowed * 0.9;

  return (
    <div className="space-y-6">
      {/* Alerta de Limite do Plano, se próximo */}
      {isNearLimit && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                Atenção ao limite de produtos: {products.length} de {maxProductsAllowed} usados no plano {plan?.name}.
              </p>
              <p className="text-xs text-amber-800">
                Faça upgrade para o plano Pro ou Business para continuar cadastrando produtos sem interrupções.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenPlans}
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            Fazer Upgrade Agora
          </button>
        </div>
      )}

      {/* Cabeçalho da Visão Geral */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Visão Geral do Estoque
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Métricas atualizadas em tempo real para a empresa <strong>{company?.name}</strong>.
          </p>
        </div>

        {/* Ações Rápidas */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenMovement('entry')}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all shadow-xs"
          >
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            <span>Nova Entrada</span>
          </button>

          <button
            onClick={() => onOpenMovement('exit')}
            className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-all shadow-xs"
          >
            <ArrowDownRight className="h-4 w-4 text-rose-600" />
            <span>Nova Saída</span>
          </button>

          <button
            onClick={onOpenNewProduct}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Produto</span>
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Quantidade de Produtos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total de Produtos</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{totals.productCount}</span>
              <span className="text-xs text-slate-400 font-medium">SKUs</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {totals.totalItems} unidades físicas totais
            </p>
          </div>
        </div>

        {/* Card 2: Valor Total do Estoque */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Valor em Estoque</span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900">
                R$ {totals.totalCostValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              Venda: R$ {totals.totalSaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Card 3: Entradas no Mês */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Entradas do Mês</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-700">+{totalEntriesMonth}</span>
              <span className="text-xs text-slate-400">unidades</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Compras e reposições
            </p>
          </div>
        </div>

        {/* Card 4: Saídas no Mês */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Saídas do Mês</span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-700">-{totalExitsMonth}</span>
              <span className="text-xs text-slate-400">unidades</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Vendas e retiradas
            </p>
          </div>
        </div>

        {/* Card 5: Estoque Baixo / Alerta */}
        <div className={`rounded-2xl p-5 shadow-xs border ${
          totals.lowStockCount > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Estoque Crítico</span>
            <div className={`rounded-xl p-2 ${
              totals.lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-600'
            }`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-extrabold ${
                totals.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}>
                {totals.lowStockCount}
              </span>
              <span className="text-xs text-slate-400">produtos</span>
            </div>
            <p className="text-[11px] text-amber-800 font-medium mt-1">
              {totals.outOfStockCount} item(ns) zerado(s)
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição de Valor por Categoria */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Distribuição do Estoque por Categoria</h2>
            </div>
            <span className="text-xs text-slate-500">Valor Potencial de Venda</span>
          </div>

          {categories.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhum produto cadastrado para gerar categorias.
            </div>
          ) : (
            <div className="space-y-4">
              {categories.slice(0, 5).map(cat => {
                const percent = Math.round((cat.value / maxCategoryValue) * 100);
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{cat.count} unidades</span>
                        <span className="font-bold text-slate-900">
                          R$ {cat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Indicadores Financeiros do Inventário */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Indicadores de Lucratividade</h2>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Margem Média Projetada</p>
                <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                  {totals.marginPercent}%
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lucro bruto projetado sobre o valor de venda
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Lucro Bruto Potencial</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  R$ {totals.potentialProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Diferença entre receita prevista e custo de aquisição
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={onNavigateToProducts}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>Ver Tabela de Produtos</span>
              <Package className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Inferior: Produtos com Estoque Crítico & Últimas Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos que precisam de reposição */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Reposição Urgente (Estoque Baixo)</h2>
            </div>
            <button
              onClick={onNavigateToProducts}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Ver todos
            </button>
          </div>

          {criticalProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 font-medium">
              Todos os produtos estão com níveis saudáveis de estoque!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {criticalProducts.slice(0, 4).map(prod => (
                <div key={prod.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                    <p className="text-[11px] text-slate-500">
                      SKU: {prod.sku} • Mínimo: {prod.minStock} {prod.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                      prod.quantity === 0
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {prod.quantity} {prod.unit}
                    </span>
                    <button
                      onClick={() => onOpenMovement('entry', prod)}
                      className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      Repor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas Movimentações */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4.5 w-4.5 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">Últimas Movimentações</h2>
            </div>
            <button
              onClick={onNavigateToMovements}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Histórico completo
            </button>
          </div>

          {recentMovements.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhuma movimentação recente registrada.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentMovements.map(mov => {
                const prod = products.find(p => p.id === mov.productId);
                return (
                  <div key={mov.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`rounded-xl p-2 shrink-0 ${
                        mov.type === 'entry'
                          ? 'bg-emerald-50 text-emerald-700'
                          : mov.type === 'exit'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {mov.type === 'entry' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : mov.type === 'exit' ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : (
                          <ArrowLeftRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {prod ? prod.name : 'Produto removido'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {mov.reason} • Por {mov.userName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-extrabold ${
                        mov.type === 'entry' ? 'text-emerald-700' : mov.type === 'exit' ? 'text-rose-700' : 'text-blue-700'
                      }`}>
                        {mov.type === 'entry' ? `+${mov.quantity}` : mov.type === 'exit' ? `-${mov.quantity}` : `=${mov.newStock}`}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Saldo: {mov.newStock}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
