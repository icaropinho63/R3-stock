import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Package,
} from 'lucide-react';
import { StockMovement, Product } from '../types';
import { generateCSVContent } from '../utils/inventoryRules';

interface MovementsViewProps {
  movements: StockMovement[];
  products: Product[];
  onOpenMovementModal: (type?: 'entry' | 'exit' | 'adjustment') => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  movements,
  products,
  onOpenMovementModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const prod = products.find(p => p.id === m.productId);
      const prodName = prod ? prod.name.toLowerCase() : '';
      const prodSku = prod ? prod.sku.toLowerCase() : '';
      const reason = m.reason.toLowerCase();
      const user = m.userName.toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        prodName.includes(term) ||
        prodSku.includes(term) ||
        reason.includes(term) ||
        user.includes(term);

      const matchesType = filterType === 'all' || m.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [movements, products, searchTerm, filterType]);

  const handleExportCSV = () => {
    const exportData = filteredMovements.map(m => {
      const prod = products.find(p => p.id === m.productId);
      return {
        date: new Date(m.createdAt).toLocaleString('pt-BR'),
        productName: prod ? prod.name : 'Item excluído',
        sku: prod ? prod.sku : '-',
        type: m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Saída' : 'Ajuste',
        quantity: m.quantity,
        previousStock: m.previousStock,
        newStock: m.newStock,
        reason: m.reason,
        userName: m.userName,
        notes: m.notes || '',
      };
    });

    const columns = [
      { key: 'date' as const, label: 'Data e Hora' },
      { key: 'productName' as const, label: 'Produto' },
      { key: 'sku' as const, label: 'SKU' },
      { key: 'type' as const, label: 'Tipo' },
      { key: 'quantity' as const, label: 'Quantidade' },
      { key: 'previousStock' as const, label: 'Saldo Anterior' },
      { key: 'newStock' as const, label: 'Novo Saldo' },
      { key: 'reason' as const, label: 'Motivo / Referência' },
      { key: 'userName' as const, label: 'Operador Responsável' },
      { key: 'notes' as const, label: 'Observações' },
    ];

    const csvContent = generateCSVContent(exportData as any, columns as any);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `r3stock_movimentacoes_${new Date().toISOString().split('T')[0]}.csv`);
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
            Movimentações de Estoque & Auditoria
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registro histórico de todas as entradas, saídas e ajustes realizados com identificação de usuário.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenMovementModal('entry')}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all shadow-xs"
          >
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            <span>Entrada</span>
          </button>

          <button
            onClick={() => onOpenMovementModal('exit')}
            className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-all shadow-xs"
          >
            <ArrowDownRight className="h-4 w-4 text-rose-600" />
            <span>Saída</span>
          </button>

          <button
            onClick={() => onOpenMovementModal('adjustment')}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-all"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Novo Ajuste</span>
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por produto, SKU, motivo ou usuário..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none shadow-2xs"
          >
            <option value="all">Todos os Tipos</option>
            <option value="entry">Apenas Entradas</option>
            <option value="exit">Apenas Saídas</option>
            <option value="adjustment">Apenas Ajustes</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Tabela de Movimentações */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Data e Hora</th>
                <th className="py-3 px-3">Produto</th>
                <th className="py-3 px-3 text-center">Tipo</th>
                <th className="py-3 px-3 text-center">Movimentado</th>
                <th className="py-3 px-3 text-center">Saldo Anterior</th>
                <th className="py-3 px-3 text-center">Novo Saldo</th>
                <th className="py-3 px-3">Motivo / Justificativa</th>
                <th className="py-3 px-4">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhuma movimentação de estoque encontrada.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(mov => {
                  const prod = products.find(p => p.id === mov.productId);
                  const isEntry = mov.type === 'entry';
                  const isExit = mov.type === 'exit';

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Data */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(mov.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Produto */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-xs truncate max-w-xs">
                          {prod ? prod.name : 'Produto removido'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {prod?.sku}
                        </div>
                      </td>

                      {/* Tipo com Badge */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isEntry
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isExit
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isEntry ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : isExit ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : (
                            <ArrowLeftRight className="h-3 w-3" />
                          )}
                          {isEntry ? 'Entrada' : isExit ? 'Saída' : 'Ajuste'}
                        </span>
                      </td>

                      {/* Quantidade Movimentada */}
                      <td className="py-3 px-3 text-center font-extrabold text-xs">
                        <span
                          className={
                            isEntry ? 'text-emerald-700' : isExit ? 'text-rose-700' : 'text-blue-700'
                          }
                        >
                          {isEntry ? `+${mov.quantity}` : isExit ? `-${mov.quantity}` : `=${mov.newStock}`}
                        </span>
                      </td>

                      {/* Saldo Anterior */}
                      <td className="py-3 px-3 text-center text-slate-500 font-medium">
                        {mov.previousStock}
                      </td>

                      {/* Novo Saldo */}
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {mov.newStock}
                      </td>

                      {/* Motivo */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 text-xs">{mov.reason}</div>
                        {mov.notes && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{mov.notes}</div>
                        )}
                      </td>

                      {/* Usuário Responsável */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs">
                          <User className="h-3 w-3 text-slate-400" />
                          <span>{mov.userName}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
