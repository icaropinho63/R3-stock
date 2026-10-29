/**
 * Regras de negócio puras para o R3-Stock
 * Validação de planos, cálculo de estoque, totais financeiros e geração de CSV
 */

export interface PlanConfig {
  id: string;
  name: string;
  maxProducts: number;
  maxUsers: number;
  price: number;
}

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
}

export type MovementType = 'entry' | 'exit' | 'adjustment';

export interface MovementInput {
  type: MovementType;
  quantity: number;
  currentStock: number;
}

export interface MovementResult {
  allowed: boolean;
  newStock: number;
  error?: string;
}

/**
 * Validação de limite de produtos por plano
 */
export function checkPlanProductLimit(currentCount: number, plan: PlanConfig): { allowed: boolean; message?: string } {
  if (currentCount >= plan.maxProducts) {
    return {
      allowed: false,
      message: `Limite de ${plan.maxProducts} produtos atingido no plano ${plan.name}. Faça upgrade para continuar adicionando produtos.`,
    };
  }
  return { allowed: true };
}

/**
 * Validação de limite de usuários por plano
 */
export function checkPlanUserLimit(currentCount: number, plan: PlanConfig): { allowed: boolean; message?: string } {
  if (currentCount >= plan.maxUsers) {
    return {
      allowed: false,
      message: `Limite de ${plan.maxUsers} usuário(s) atingido no plano ${plan.name}. Faça upgrade para adicionar mais colaboradores.`,
    };
  }
  return { allowed: true };
}

/**
 * Cálculo de movimentação de estoque com proteção contra estoque negativo
 */
export function calculateStockAfterMovement(input: MovementInput): MovementResult {
  const { type, quantity, currentStock } = input;

  if (quantity < 0) {
    return {
      allowed: false,
      newStock: currentStock,
      error: 'A quantidade movimentada não pode ser negativa.',
    };
  }

  if (type === 'entry') {
    return {
      allowed: true,
      newStock: currentStock + quantity,
    };
  }

  if (type === 'exit') {
    if (quantity > currentStock) {
      return {
        allowed: false,
        newStock: currentStock,
        error: `Saldo insuficiente em estoque! Saldo atual: ${currentStock}, Saída solicitada: ${quantity}. Estoque negativo não é permitido.`,
      };
    }
    return {
      allowed: true,
      newStock: currentStock - quantity,
    };
  }

  if (type === 'adjustment') {
    // Para ajuste, a quantidade informada é o novo saldo absoluto
    if (quantity < 0) {
      return {
        allowed: false,
        newStock: currentStock,
        error: 'O novo saldo ajustado não pode ser negativo.',
      };
    }
    return {
      allowed: true,
      newStock: quantity,
    };
  }

  return {
    allowed: false,
    newStock: currentStock,
    error: 'Tipo de movimentação inválido.',
  };
}

/**
 * Cálculos financeiros consolidados do estoque
 */
export function calculateInventoryTotals(products: InventoryProduct[]) {
  let totalItems = 0;
  let totalCostValue = 0;
  let totalSaleValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of products) {
    totalItems += p.quantity;
    totalCostValue += p.quantity * p.costPrice;
    totalSaleValue += p.quantity * p.salePrice;

    if (p.quantity === 0) {
      outOfStockCount++;
      lowStockCount++;
    } else if (p.quantity <= p.minStock) {
      lowStockCount++;
    }
  }

  const potentialProfit = totalSaleValue - totalCostValue;
  const marginPercent = totalSaleValue > 0 ? (potentialProfit / totalSaleValue) * 100 : 0;

  return {
    productCount: products.length,
    totalItems,
    totalCostValue: Number(totalCostValue.toFixed(2)),
    totalSaleValue: Number(totalSaleValue.toFixed(2)),
    potentialProfit: Number(potentialProfit.toFixed(2)),
    marginPercent: Number(marginPercent.toFixed(1)),
    lowStockCount,
    outOfStockCount,
  };
}

/**
 * Geração de CSV seguro com cabeçalhos e formatação BR
 */
export function generateCSVContent<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const header = columns.map(c => `"${c.label}"`).join(';');
  const rows = data.map(row => {
    return columns
      .map(c => {
        const val = row[c.key];
        if (val === null || val === undefined) return '""';
        if (typeof val === 'number') return `"${val.toLocaleString('pt-BR')}"`;
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(';');
  });

  // Retorna com BOM para o Excel abrir com acentuação correta em PT-BR
  return '\uFEFF' + [header, ...rows].join('\r\n');
}
