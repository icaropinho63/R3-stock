import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  AlertTriangle,
  DollarSign,
  Package,
  ArrowLeftRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, StockMovement, Supplier } from '../types';
import { calculateInventoryTotals, generateCSVContent } from '../utils/inventoryRules';

interface ReportsViewProps {
  products: Product[];
  movements: StockMovement[];
  suppliers: Supplier[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  movements,
  suppliers,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'low_stock' | 'movements' | 'financial'>('current');

  const totals = calculateInventoryTotals(products);
  const lowStockProducts = products.filter(p => p.quantity <= p.minStock);

  // Exportar relatório da aba ativa
  const exportActiveReport = () => {
    const today = new Date().toISOString().split('T')[0];

    if (activeTab === 'current') {
      const data = products.map(p => {
        const sup = suppliers.find(s => s.id === p.supplierId);
        return {
          name: p.name,
          sku: p.sku,
          barcode: p.barcode || '',
          category: p.category,
          quantity: p.quantity,
          unit: p.unit,
          minStock: p.minStock,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          totalCost: (p.quantity * p.costPrice).toFixed(2),
          totalSale: (p.quantity * p.salePrice).toFixed(2),
          supplier: sup ? sup.name : 'Nenhum',
        };
      });

      const cols = [
        { key: 'name' as const, label: 'Produto' },
        { key: 'sku' as const, label: 'SKU' },
        { key: 'barcode' as const, label: 'Cód. Barras' },
        { key: 'category' as const, label: 'Categoria' },
        { key: 'quantity' as const, label: 'Saldo Atual' },
        { key: 'unit' as const, label: 'Unidade' },
        { key: 'minStock' as const, label: 'Estoque Mínimo' },
        { key: 'costPrice' as const, label: 'Custo Unitário (R$)' },
        { key: 'salePrice' as const, label: 'Venda Unitário (R$)' },
        { key: 'totalCost' as const, label: 'Valor Custo Total (R$)' },
        { key: 'totalSale' as const, label: 'Valor Venda Total (R$)' },
        { key: 'supplier' as const, label: 'Fornecedor' },
      ];

      downloadCSV(generateCSVContent(data, cols), `relatorio_posicao_estoque_${today}.csv`);
    } else if (activeTab === 'low_stock') {
      const data = lowStockProducts.map(p => ({
        name: p.name,
        sku: p.sku,
        category: p.category,
        quantity: p.quantity,
        unit: p.unit,
        minStock: p.minStock,
        shortage: p.minStock - p.quantity,
        status: p.quantity === 0 ? 'ZERADO (FALTA CRÍTICA)' : 'ABAIXO DO MÍNIMO',
      }));

      const cols = [
        { key: 'name' as const, label: 'Produto' },
        { key: 'sku' as const, label: 'SKU' },
        { key: 'category' as const, label: 'Categoria' },
        { key: 'quantity' as const, label: 'Saldo Atual' },
        { key: 'unit' as const, label: 'Unidade' },
        { key: 'minStock' as const, label: 'Estoque Mínimo' },
        { key: 'shortage' as const, label: 'Déficit para Mínimo' },
        { key: 'status' as const, label: 'Gravidade' },
      ];

      downloadCSV(generateCSVContent(data, cols), `relatorio_produtos_em_falta_${today}.csv`);
    } else if (activeTab === 'movements') {
      const data = movements.map(m => {
        const prod = products.find(p => p.id === m.productId);
        return {
          date: new Date(m.createdAt).toLocaleString('pt-BR'),
          product: prod ? prod.name : 'Excluído',
          sku: prod ? prod.sku : '-',
          type: m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Saída' : 'Ajuste',
          quantity: m.quantity,
          previousStock: m.previousStock,
          newStock: m.newStock,
          reason: m.reason,
          user: m.userName,
        };
      });

      const cols = [
        { key: 'date' as const, label: 'Data/Hora' },
        { key: 'product' as const, label: 'Produto' },
        { key: 'sku' as const, label: 'SKU' },
        { key: 'type' as const, label: 'Tipo' },
        { key: 'quantity' as const, label: 'Quantidade' },
        { key: 'previousStock' as const, label: 'Anterior' },
        { key: 'newStock' as const, label: 'Novo Saldo' },
        { key: 'reason' as const, label: 'Motivo' },
        { key: 'user' as const, label: 'Responsável' },
      ];

      downloadCSV(generateCSVContent(data, cols), `relatorio_movimentacoes_${today}.csv`);
    } else if (activeTab === 'financial') {
      const categorySummary: Record<string, { count: number; cost: number; sale: number }> = {};
      products.forEach(p => {
        const cat = p.category || 'Geral';
        if (!categorySummary[cat]) categorySummary[cat] = { count: 0, cost: 0, sale: 0 };
        categorySummary[cat].count += p.quantity;
        categorySummary[cat].cost += p.quantity * p.costPrice;
        categorySummary[cat].sale += p.quantity * p.salePrice;
      });

      const data = Object.keys(categorySummary).map(cat => {
        const cost = categorySummary[cat].cost;
        const sale = categorySummary[cat].sale;
        const profit = sale - cost;
        const margin = sale > 0 ? ((profit / sale) * 100).toFixed(1) : '0';
        return {
          category: cat,
          quantity: categorySummary[cat].count,
          cost: cost.toFixed(2),
          sale: sale.toFixed(2),
          profit: profit.toFixed(2),
          margin: `${margin}%`,
        };
      });

      const cols = [
        { key: 'category' as const, label: 'Categoria' },
        { key: 'quantity' as const, label: 'Quantidade Total' },
        { key: 'cost' as const, label: 'Custo Total (R$)' },
        { key: 'sale' as const, label: 'Receita Prevista (R$)' },
        { key: 'profit' as const, label: 'Lucro Previsto (R$)' },
        { key: 'margin' as const, label: 'Margem Média' },
      ];

      downloadCSV(generateCSVContent(data, cols), `relatorio_financeiro_estoque_${today}.csv`);
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Relatórios & Indicadores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Análises gerenciais de saldo, ruptura de estoque, movimentações e valuation financeiro.
          </p>
        </div>

        <button
          onClick={exportActiveReport}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Exportar Relatório em CSV</span>
        </button>
      </div>

      {/* Abas dos Relatórios */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'current'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Posição Atual do Estoque</span>
        </button>

        <button
          onClick={() => setActiveTab('low_stock')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'low_stock'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Produtos em Falta ({lowStockProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'movements'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>Histórico de Movimentações</span>
        </button>

        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'financial'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Avaliação Financeira</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Posição de Estoque */}
      {activeTab === 'current' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Inventário Geral ({products.length} itens cadastrados)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Total Físico: {totals.totalItems} unidades
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Item</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-center">Saldo</th>
                  <th className="py-2.5 px-3 text-right">Custo Total</th>
                  <th className="py-2.5 px-3 text-right">Venda Total</th>
                  <th className="py-2.5 px-4">Fornecedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {products.map(p => {
                  const sup = suppliers.find(s => s.id === p.supplierId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{p.sku}</td>
                      <td className="py-2.5 px-3">{p.category}</td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {p.quantity} {p.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        R$ {(p.quantity * p.costPrice).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        R$ {(p.quantity * p.salePrice).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{sup ? sup.name : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: Produtos em Falta */}
      {activeTab === 'low_stock' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-amber-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">
              Produtos com Estoque Crítico ou Esgotado
            </span>
            <span className="text-xs font-semibold text-amber-700">
              Necessitam reposição imediata
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Produto</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-center">Saldo Atual</th>
                  <th className="py-2.5 px-3 text-center">Estoque Mínimo</th>
                  <th className="py-2.5 px-3 text-center">Déficit</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-emerald-600 font-medium">
                      Nenhum produto em nível crítico! Todos com estoque seguro.
                    </td>
                  </tr>
                ) : (
                  lowStockProducts.map(p => {
                    const isZero = p.quantity === 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{p.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.sku}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                          {p.quantity} {p.unit}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500">
                          {p.minStock} {p.unit}
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-rose-600">
                          -{p.minStock - p.quantity} {p.unit}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                              isZero
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isZero ? 'Esgotado' : 'Estoque Baixo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 3: Movimentações */}
      {activeTab === 'movements' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <span className="text-xs font-bold text-slate-800">
              Extrato Geral de Movimentações ({movements.length} registros)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Data</th>
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3 text-center">Operação</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-center">Novo Saldo</th>
                  <th className="py-2.5 px-4">Motivo</th>
                  <th className="py-2.5 px-4">Usuário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {movements.map(m => {
                  const prod = products.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                        {new Date(m.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {prod ? prod.name : 'Excluído'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="capitalize text-slate-700 font-medium">
                          {m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Saída' : 'Ajuste'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {m.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {m.newStock}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{m.reason}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-medium">{m.userName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 4: Financeiro */}
      {activeTab === 'financial' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Capital Investido (Custo)</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                R$ {totals.totalCostValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Base de custo de aquisição</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Receita Bruta Potencial</p>
              <p className="text-2xl font-extrabold text-blue-700 mt-1">
                R$ {totals.totalSaleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Preço de venda tabelado</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Lucro Bruto Projetado</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                R$ {totals.potentialProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                Margem média: {totals.marginPercent}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
