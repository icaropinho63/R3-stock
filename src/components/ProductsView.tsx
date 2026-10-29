import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Barcode,
  Sparkles,
  ArrowLeftRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Product, Supplier, Plan, Company } from '../types';
import { generateCSVContent } from '../utils/inventoryRules';

interface ProductsViewProps {
  products: Product[];
  suppliers: Supplier[];
  company: Company | null;
  plan: Plan | null;
  onSaveProduct: (productData: any, isEdit: boolean, id?: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  onOpenMovement: (type: 'entry' | 'exit', product: Product) => void;
  onOpenPlans: () => void;
  isCreateModalOpenInitially?: boolean;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  suppliers,
  company,
  plan,
  onSaveProduct,
  onDeleteProduct,
  onOpenMovement,
  onOpenPlans,
  isCreateModalOpenInitially = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all, low, out, normal

  // Modal de edição / cadastro
  const [isModalOpen, setIsModalOpen] = useState(isCreateModalOpenInitially);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Modal de confirmação de exclusão
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estados do formulário
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Geral');
  const [unit, setUnit] = useState('UN');
  const [quantity, setQuantity] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [costPrice, setCostPrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Importação CSV feedback
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const maxProducts = company?.maxProducts || plan?.maxProducts || 50;
  const isLimitReached = products.length >= maxProducts;

  // Categorias únicas
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Filtros aplicados
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      let matchesStatus = true;
      if (selectedStatus === 'out') {
        matchesStatus = p.quantity === 0;
      } else if (selectedStatus === 'low') {
        matchesStatus = p.quantity > 0 && p.quantity <= p.minStock;
      } else if (selectedStatus === 'normal') {
        matchesStatus = p.quantity > p.minStock;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  const openNewModal = () => {
    if (isLimitReached) {
      onOpenPlans();
      return;
    }
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Date.now().toString().slice(-5)}`);
    setBarcode('');
    setCategory('Geral');
    setUnit('UN');
    setQuantity(0);
    setMinStock(5);
    setCostPrice(0);
    setSalePrice(0);
    setSupplierId('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setBarcode(product.barcode || '');
    setCategory(product.category || 'Geral');
    setUnit(product.unit || 'UN');
    setQuantity(product.quantity);
    setMinStock(product.minStock);
    setCostPrice(product.costPrice);
    setSalePrice(product.salePrice);
    setSupplierId(product.supplierId || '');
    setNotes(product.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('O nome do produto é obrigatório.');
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim(),
      category: category.trim(),
      unit: unit.trim().toUpperCase(),
      quantity: Number(quantity),
      minStock: Number(minStock),
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
      supplierId: supplierId || undefined,
      notes: notes.trim(),
    };

    const res = await onSaveProduct(payload, Boolean(editingProduct), editingProduct?.id);
    setSaving(false);

    if (!res.success) {
      setFormError(res.error || 'Erro ao salvar o produto.');
    } else {
      setIsModalOpen(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    await onDeleteProduct(productToDelete.id);
    setDeleting(false);
    setProductToDelete(null);
  };

  // Exportar produtos para CSV
  const handleExportCSV = () => {
    const columns: { key: keyof Product; label: string }[] = [
      { key: 'name', label: 'Nome do Produto' },
      { key: 'sku', label: 'SKU' },
      { key: 'barcode', label: 'Código de Barras' },
      { key: 'category', label: 'Categoria' },
      { key: 'unit', label: 'Unidade' },
      { key: 'quantity', label: 'Estoque Atual' },
      { key: 'minStock', label: 'Estoque Mínimo' },
      { key: 'costPrice', label: 'Preço de Custo (R$)' },
      { key: 'salePrice', label: 'Preço de Venda (R$)' },
      { key: 'notes', label: 'Observações' },
    ];

    const csvContent = generateCSVContent(products as any, columns);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `r3stock_produtos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Importar CSV simplificado
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        setImportNotice('Arquivo CSV vazio ou sem linhas de dados.');
        return;
      }

      let importedCount = 0;
      // Lê linhas a partir da segunda
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/[;,]/).map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 2 && parts[0]) {
          const prodName = parts[0];
          const prodSku = parts[1] || `SKU-IMP-${Date.now()}-${i}`;
          const prodQty = parseInt(parts[2], 10) || 10;
          const prodCost = parseFloat(parts[3]) || 0;
          const prodSale = parseFloat(parts[4]) || 0;

          await onSaveProduct(
            {
              name: prodName,
              sku: prodSku,
              quantity: prodQty,
              costPrice: prodCost,
              salePrice: prodSale,
              minStock: 5,
              category: 'Importados',
              unit: 'UN',
            },
            false
          );
          importedCount++;
        }
      }

      setImportNotice(`Importação concluída! ${importedCount} produto(s) adicionados com sucesso.`);
      setTimeout(() => setImportNotice(null), 5000);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Cálculo da Margem de Lucro em tempo real no formulário
  const marginPercent = salePrice > 0 ? (((salePrice - costPrice) / salePrice) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-5">
      {/* Aviso de Limite do Plano */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Catálogo de Produtos</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                {products.length} de {maxProducts} produtos cadastrados
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Plano {plan?.name} • Limite gerenciado no backend com Row-Level Security
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isLimitReached && (
            <button
              onClick={onOpenPlans}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-600 transition-colors shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Aumentar Limite (Upgrade)</span>
            </button>
          )}

          <button
            onClick={openNewModal}
            disabled={isLimitReached}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all ${
              isLimitReached
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Notificação de importação */}
      {importNotice && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Barra de Filtros, Pesquisa e Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Barra de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, SKU ou código de barras..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
          />
        </div>

        {/* Filtros por Categoria e Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none shadow-2xs"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:outline-none shadow-2xs"
          >
            <option value="all">Todos os Status</option>
            <option value="normal">Estoque Normal</option>
            <option value="low">Estoque Baixo</option>
            <option value="out">Esgotado (Zerado)</option>
          </select>

          {/* Botões de Importar e Exportar CSV */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Exportar produtos para planilha CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer">
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Importar CSV</span>
              <input type="file" accept=".csv,.txt" onChange={handleImportCSV} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-3">SKU / Cód. Barras</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3 text-center">Estoque Atual</th>
                <th className="py-3 px-3 text-right">Preço de Custo</th>
                <th className="py-3 px-3 text-right">Preço de Venda</th>
                <th className="py-3 px-3 text-center">Margem</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const isOutOfStock = prod.quantity === 0;
                  const isLowStock = prod.quantity > 0 && prod.quantity <= prod.minStock;
                  const margin =
                    prod.salePrice > 0
                      ? (((prod.salePrice - prod.costPrice) / prod.salePrice) * 100).toFixed(0)
                      : '0';

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Nome e Unidade */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">{prod.name}</div>
                        {prod.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{prod.notes}</div>
                        )}
                      </td>

                      {/* SKU e Código de Barras */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        <div>{prod.sku}</div>
                        {prod.barcode && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Barcode className="h-3 w-3" /> {prod.barcode}
                          </div>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {prod.category}
                        </span>
                      </td>

                      {/* Quantidade e Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {(isOutOfStock || isLowStock) && <AlertTriangle className="h-3 w-3" />}
                          {prod.quantity} {prod.unit}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Mín: {prod.minStock}</div>
                      </td>

                      {/* Preço de Custo */}
                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        R$ {prod.costPrice.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Preço de Venda */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        R$ {prod.salePrice.toFixed(2).replace('.', ',')}
                      </td>

                      {/* Margem */}
                      <td className="py-3 px-3 text-center font-bold text-emerald-700 text-xs">
                        {margin}%
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenMovement('entry', prod)}
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Registrar Entrada Rápida"
                          >
                            <Plus className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => onOpenMovement('exit', prod)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Registrar Saída"
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(prod)}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Editar Dados do Produto"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setProductToDelete(prod)}
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Excluir Produto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Modal de Cadastro / Edição de Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h2>
                <p className="text-xs text-slate-500">
                  Preencha os campos para manter seu inventário atualizado
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Teclado Sem Fio Ergonômico"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="TEC-001"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de Barras (EAN)
                  </label>
                  <input
                    type="text"
                    placeholder="7891234567890"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Periféricos, Áudio, etc"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="KG">KG (Quilograma)</option>
                    <option value="L">L (Litro)</option>
                    <option value="M">M (Metro)</option>
                    <option value="PCT">PCT (Pacote)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={e => setMinStock(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quantidade Inicial apenas na criação */}
              {!editingProduct && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade Inicial em Estoque
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Será registrada como a primeira movimentação de entrada.
                  </p>
                </div>
              )}

              {/* Preços e Margem */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço de Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={e => setSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-sm focus:border-blue-600 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Margem Calculada
                  </label>
                  <div className="flex h-10 items-center rounded-xl bg-emerald-50 px-3 border border-emerald-200 text-emerald-800 font-bold text-sm">
                    {marginPercent}% de lucro
                  </div>
                </div>
              </div>

              {/* Fornecedor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fornecedor Vinculado
                </label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none bg-white"
                >
                  <option value="">Nenhum fornecedor vinculado</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactName || 'Sem contato'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações / Localização Física
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Prateleira B3, garantia de 1 ano com nota fiscal"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingProduct ? 'Atualizar Produto' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão Segura */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Produto</h3>
                <p className="text-xs text-slate-500">Confirmação de exclusão permanente</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Você tem certeza de que deseja excluir o produto <strong>{productToDelete.name}</strong> (SKU: {productToDelete.sku})? Essa ação não pode ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir Produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
