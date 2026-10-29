import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  User,
  Package,
  Edit2,
  Trash2,
  X,
  FileText,
} from 'lucide-react';
import { Supplier, Product } from '../types';

interface SuppliersViewProps {
  suppliers: Supplier[];
  products: Product[];
  onSaveSupplier: (supplierData: any, isEdit: boolean, id?: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteSupplier: (supplierId: string) => Promise<{ success: boolean; error?: string }>;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  products,
  onSaveSupplier,
  onDeleteSupplier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredSuppliers = suppliers.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.contactName.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.phone.includes(term)
    );
  });

  const openNewModal = () => {
    setEditingSupplier(null);
    setName('');
    setContactName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setContactName(supplier.contactName);
    setPhone(supplier.phone);
    setEmail(supplier.email);
    setNotes(supplier.notes);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('O nome do fornecedor é obrigatório.');
      return;
    }

    setSaving(true);
    const res = await onSaveSupplier(
      {
        name: name.trim(),
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
      },
      Boolean(editingSupplier),
      editingSupplier?.id
    );
    setSaving(false);

    if (!res.success) {
      setError(res.error || 'Erro ao salvar o fornecedor.');
    } else {
      setIsModalOpen(false);
    }
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    setDeleting(true);
    await onDeleteSupplier(supplierToDelete.id);
    setDeleting(false);
    setSupplierToDelete(null);
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Gestão de Fornecedores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre distribuidores, contatos diretos e vincule aos produtos do catálogo.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar fornecedor por nome, contato ou e-mail..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
        />
      </div>

      {/* Grid de Cards de Fornecedores */}
      {filteredSuppliers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 text-xs">
          Nenhum fornecedor cadastrado ou encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => {
            const linkedProducts = products.filter(p => p.supplierId === supplier.id);

            return (
              <div
                key={supplier.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-200 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {supplier.name}
                        </h3>
                        {supplier.contactName && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3 text-slate-400" /> {supplier.contactName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(supplier)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setSupplierToDelete(supplier)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Informações de Contato */}
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    {supplier.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{supplier.phone}</span>
                      </p>
                    )}
                    {supplier.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{supplier.email}</span>
                      </p>
                    )}
                    {supplier.notes && (
                      <p className="flex items-start gap-2 text-slate-500 text-[11px] pt-1">
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{supplier.notes}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Produtos Vinculados */}
                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-slate-400" /> Produtos fornecidos:
                  </span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                    {linkedProducts.length} item(ns)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Fornecedor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
                </h2>
                <p className="text-xs text-slate-500">Dados cadastrais e contato comercial</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razão Social / Nome Fantasia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Distribuidora Brasil Tech Ltda"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Representante / Contato
                </label>
                <input
                  type="text"
                  placeholder="Ex: Roberto Costa"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Comercial
                  </label>
                  <input
                    type="email"
                    placeholder="pedidos@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações / Condições Comerciais
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Prazo de 7 dias, desconto de 5% no boleto faturado..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingSupplier ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Excluir Fornecedor</h3>
            <p className="text-xs text-slate-600 mt-2">
              Deseja remover <strong>{supplierToDelete.name}</strong>? Os produtos associados não serão apagados, apenas desvinculados deste fornecedor.
            </p>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setSupplierToDelete(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
