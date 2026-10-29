import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkPlanProductLimit,
  checkPlanUserLimit,
  calculateStockAfterMovement,
  calculateInventoryTotals,
  generateCSVContent,
  type PlanConfig,
  type InventoryProduct,
} from './inventoryRules';

const freePlan: PlanConfig = {
  id: 'free',
  name: 'Free',
  maxProducts: 50,
  maxUsers: 1,
  price: 0,
};

test('checkPlanProductLimit allows creation below limit', () => {
  const result = checkPlanProductLimit(49, freePlan);
  assert.equal(result.allowed, true);
});

test('checkPlanProductLimit blocks creation when reaching limit', () => {
  const result = checkPlanProductLimit(50, freePlan);
  assert.equal(result.allowed, false);
  assert.match(result.message || '', /Limite de 50 produtos/);
});

test('checkPlanUserLimit blocks additional users on free plan', () => {
  const allowFirst = checkPlanUserLimit(0, freePlan);
  assert.equal(allowFirst.allowed, true);

  const blockSecond = checkPlanUserLimit(1, freePlan);
  assert.equal(blockSecond.allowed, false);
  assert.match(blockSecond.message || '', /Limite de 1 usuário/);
});

test('calculateStockAfterMovement - entry adds stock correctly', () => {
  const result = calculateStockAfterMovement({
    type: 'entry',
    quantity: 15,
    currentStock: 10,
  });
  assert.equal(result.allowed, true);
  assert.equal(result.newStock, 25);
});

test('calculateStockAfterMovement - exit subtracts stock when sufficient', () => {
  const result = calculateStockAfterMovement({
    type: 'exit',
    quantity: 4,
    currentStock: 10,
  });
  assert.equal(result.allowed, true);
  assert.equal(result.newStock, 6);
});

test('calculateStockAfterMovement - prevents negative stock', () => {
  const result = calculateStockAfterMovement({
    type: 'exit',
    quantity: 11,
    currentStock: 10,
  });
  assert.equal(result.allowed, false);
  assert.equal(result.newStock, 10);
  assert.match(result.error || '', /Saldo insuficiente/);
});

test('calculateStockAfterMovement - adjustment overrides stock safely', () => {
  const validAdjustment = calculateStockAfterMovement({
    type: 'adjustment',
    quantity: 32,
    currentStock: 10,
  });
  assert.equal(validAdjustment.allowed, true);
  assert.equal(validAdjustment.newStock, 32);

  const invalidAdjustment = calculateStockAfterMovement({
    type: 'adjustment',
    quantity: -5,
    currentStock: 10,
  });
  assert.equal(invalidAdjustment.allowed, false);
});

test('calculateInventoryTotals calculates accurate financial values and alert thresholds', () => {
  const products: InventoryProduct[] = [
    {
      id: '1',
      name: 'Teclado Mecânico',
      sku: 'TEC-01',
      category: 'Periféricos',
      quantity: 5,
      minStock: 10, // low stock
      costPrice: 120,
      salePrice: 220,
    },
    {
      id: '2',
      name: 'Mouse Gamer',
      sku: 'MOU-01',
      category: 'Periféricos',
      quantity: 0, // out of stock
      minStock: 5,
      costPrice: 50,
      salePrice: 99.9,
    },
    {
      id: '3',
      name: 'Monitor 27"',
      sku: 'MON-27',
      category: 'Monitores',
      quantity: 20,
      minStock: 5, // normal
      costPrice: 800,
      salePrice: 1300,
    },
  ];

  const totals = calculateInventoryTotals(products);
  assert.equal(totals.productCount, 3);
  assert.equal(totals.totalItems, 25);
  // Cost: 5*120 + 0*50 + 20*800 = 600 + 16000 = 16600
  assert.equal(totals.totalCostValue, 16600);
  // Sale: 5*220 + 0*99.9 + 20*1300 = 1100 + 26000 = 27100
  assert.equal(totals.totalSaleValue, 27100);
  assert.equal(totals.potentialProfit, 10500);
  assert.equal(totals.outOfStockCount, 1);
  assert.equal(totals.lowStockCount, 2); // Teclado (5<=10) + Mouse (0<=5)
});

test('generateCSVContent produces valid formatted CSV with semicolon delimiter and quotes', () => {
  const data = [
    { name: 'Produto "X"', sku: 'SKU-1', qty: 10 },
    { name: 'Produto Y', sku: 'SKU-2', qty: 5 },
  ];
  const columns = [
    { key: 'name' as const, label: 'Nome' },
    { key: 'sku' as const, label: 'Código' },
    { key: 'qty' as const, label: 'Qtd' },
  ];
  const csv = generateCSVContent(data, columns);
  assert.ok(csv.startsWith('\uFEFF"Nome";"Código";"Qtd"'));
  assert.ok(csv.includes('"Produto ""X""";"SKU-1";"10"'));
});
