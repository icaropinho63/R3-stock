import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { Product, StockMovement } from '../types';
import { calculateStockAfterMovement } from '../utils/inventoryRules';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialType?: 'entry' | 'exit' | 'adjustment';
  initialProduct?: Product | null;
  onRegisterMovement: (data: {
    productId: string;
    type: 'entry' | 'exit' | 'adjustment';
    quantity: number;
    reason: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  products,
  initialType = 'entry',
  initialProduct = null,
  onRegisterMovement,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || (products.length > 0 ? products[0].id : '')
  );
  const [type, setType] = useState<'entry' | 'exit' | 'adjustment'>(initialType);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('Compra / Reposição de Fornecedor');
  const [notes, setNotes] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
    } else if (products.length > 0 && (!selectedProductId || !products.some(p => p.id === selectedProductId))) {
      setSelectedProductId(products[0].id);
    }

    if (initialType) {
      setType(initialType);
      if (initialType === 'entry') setReason('Compra / Reposição de Fornecedor');
      else if (initialType === 'exit') setReason('Venda a Cliente / Pedido');
      else setReason('Ajuste de Balanço de Inventário');
    }
  }, [initialProduct, initialType, isOpen, products, selectedProductId]);

  if (!isOpen) return null;

  const currentProduct = products.find(p => p.id === selectedProductId);
  const currentStock = currentProduct ? currentProduct.quantity : 0;

  // Validação dinâmica com a regra de negócio
  const calculation = calculateStockAfterMovement({
    type,
    quantity: Number(quantity),
    currentStock,
  });

  const handleTypeChange = (newType: 'entry' | 'exit' | 'adjustment') => {
    setType(newType);
    setError(null);
    if (newType === 'entry') setReason('Compra / Reposição de Fornecedor');
    else if (newType === 'exit') setReason('Venda a Cliente / Pedido');
    else setReason('Ajuste de Balanço de Inventário');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProductId) {
      setError('Por favor, selecione um produto.');
      return;
    }

    if (!calculation.allowed) {
      setError(calculation.error || 'Movimentação não permitida.');
      return;
    }

    setLoading(true);
    const res = await onRegisterMovement({
      productId: selectedProductId,
      type,
      quantity: Number(quantity),
      reason,
      notes,
    });
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Erro ao registrar movimentação.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className={`rounded-xl p-2.5 ${
              type === 'entry'
                ? 'bg-emerald-100 text-emerald-700'
                : type === 'exit'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {type === 'entry' ? (
              <ArrowUpRight className="h-6 w-6" />
            ) : type === 'exit' ? (
              <ArrowDownRight className="h-6 w-6" />
            ) : (
              <ArrowLeftRight className="h-6 w-6" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Registrar Movimentação de Estoque
            </h2>
            <p className="text-xs text-slate-500">
              Atualização com proteção contra estoque negativo e auditoria
            </p>
          </div>
        </div>

        {/* Tipo de Movimentação */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <button
            type="button"
            onClick={() => handleTypeChange('entry')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all ${
              type === 'entry'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Entrada</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('exit')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all ${
              type === 'exit'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowDownRight className="h-4 w-4" />
            <span>Saída</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('adjustment')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition-all ${
              type === 'adjustment'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Ajuste</span>
          </button>
        </div>

        {/* Mensagem de Erro / Bloqueio */}
        {(error || !calculation.allowed) && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error || calculation.error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selecionar Produto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Produto *
            </label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm focus:border-blue-600 focus:outline-none bg-white font-medium"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku}) — Saldo Atual: {p.quantity} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Quantidade e Simulação do Saldo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {type === 'adjustment' ? 'Novo Saldo Real Contado *' : 'Quantidade *'}
              </label>
              <input
                type="number"
                min={type === 'adjustment' ? '0' : '1'}
                required
                value={quantity}
                onChange={e => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none font-bold"
              />
            </div>

            {/* Prévia do Resultado */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Saldo Resultante
              </label>
              <div
                className={`flex h-10 items-center justify-between rounded-xl px-3 border text-xs font-bold ${
                  !calculation.allowed
                    ? 'border-rose-300 bg-rose-50 text-rose-800'
                    : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <span>{currentStock} →</span>
                <span className="text-sm">
                  {calculation.allowed ? `${calculation.newStock} ${currentProduct?.unit || 'UN'}` : 'INVÁLIDO'}
                </span>
              </div>
            </div>
          </div>

          {/* Motivo da Operação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo / Justificativa *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Pedido #1234, NF de Compra #450, etc"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Adicionais (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Informações adicionais para a auditoria..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !calculation.allowed}
              className={`rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all ${
                type === 'entry'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : type === 'exit'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {loading ? 'Processando...' : 'Confirmar Movimentação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
