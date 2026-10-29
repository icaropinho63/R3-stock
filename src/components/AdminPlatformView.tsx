import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  Package,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Trash2,
  Power,
  PowerOff,
  Filter,
  History,
  X,
  UserPlus,
  Mail,
  Phone,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Briefcase,
  KeyRound,
} from 'lucide-react';
import { Plan, Company, AdminAuditLog } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  validateCompanyDeletionConfirmation,
  formatDeactivationDuration,
  validateNewCompanyData,
  filterCompaniesByStatus,
  CompanyFilterType,
} from '../utils/companyAdmin';

interface AdminMetrics {
  totalCompanies: number;
  totalUsers: number;
  totalProducts: number;
  totalMovements: number;
  mrr: number;
  companies: Company[];
  plans: Plan[];
}

export const AdminPlatformView: React.FC = () => {
  const { token, refreshUserData, loginAsDemo } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Navegação entre abas principais do SaaS Admin
  const [activeTab, setActiveTab] = useState<'manage' | 'create_company'>('manage');

  // Edição de planos globais
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planPrice, setPlanPrice] = useState<number>(0);
  const [planMaxProducts, setPlanMaxProducts] = useState<number>(0);
  const [planMaxUsers, setPlanMaxUsers] = useState<number>(0);
  const [savingPlan, setSavingPlan] = useState(false);

  // Filtros de status de empresas
  const [statusFilter, setStatusFilter] = useState<CompanyFilterType>('all');

  // Modal de exclusão definitiva
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [confirmNameInput, setConfirmNameInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Status changing indicator
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);

  // Logs de auditoria
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // Mensagens de feedback
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ============================================================================
  // Formulário de Cadastro de Empresa (SaaS Master)
  // ============================================================================
  const [formName, setFormName] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPlanId, setFormPlanId] = useState('pro');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formNotes, setFormNotes] = useState('');
  const [formAccessOption, setFormAccessOption] = useState<'company_only' | 'company_and_invite'>('company_and_invite');
  const [isSubmittingCompany, setIsSubmittingCompany] = useState(false);

  // Feedback do convite gerado
  const [createdInviteInfo, setCreatedInviteInfo] = useState<{
    companyName: string;
    email: string;
    inviteUrl: string;
    token: string;
    message: string;
  } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const resetCompanyForm = () => {
    setFormName('');
    setFormResponsible('');
    setFormEmail('');
    setFormCnpj('');
    setFormPhone('');
    setFormPlanId('pro');
    setFormStatus('active');
    setFormNotes('');
    setFormAccessOption('company_and_invite');
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Erro ao buscar logs de auditoria:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchAuditLogs();
  }, [token]);

  const startEditPlan = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setPlanPrice(plan.price);
    setPlanMaxProducts(plan.maxProducts);
    setPlanMaxUsers(plan.maxUsers);
  };

  const savePlanChanges = async (planId: string) => {
    setSavingPlan(true);
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          price: planPrice,
          maxProducts: planMaxProducts,
          maxUsers: planMaxUsers,
        }),
      });

      if (res.ok) {
        setNotice({
          type: 'success',
          message: 'Plano atualizado com sucesso! Novos preços e limites já estão em vigor.',
        });
        setEditingPlanId(null);
        await fetchAdminData();
        await refreshUserData();
      } else {
        const err = await res.json();
        setNotice({ type: 'error', message: err.error || 'Erro ao salvar plano.' });
      }
    } catch {
      setNotice({ type: 'error', message: 'Erro ao salvar plano.' });
    } finally {
      setSavingPlan(false);
    }
  };

  const changeCompanyPlanOrStatus = async (
    companyId: string,
    newPlanId: string,
    newStatus: string
  ) => {
    setStatusChangingId(companyId);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: newPlanId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        setNotice({
          type: 'success',
          message: `Configurações da empresa atualizadas com sucesso.`,
        });
        await fetchAdminData();
        await fetchAuditLogs();
      } else {
        const err = await res.json();
        setNotice({ type: 'error', message: err.error || 'Erro ao atualizar empresa.' });
      }
    } catch {
      setNotice({ type: 'error', message: 'Erro ao atualizar dados da empresa.' });
    } finally {
      setStatusChangingId(null);
    }
  };

  // Alternar entre Ativo e Inativo (Desativação / Reativação)
  const toggleCompanyActiveStatus = async (company: Company) => {
    if (company.id === 'comp-admin-platform') {
      setNotice({ type: 'error', message: 'A conta raiz da plataforma não pode ser desativada.' });
      return;
    }

    const nextStatus = company.status === 'inactive' ? 'active' : 'inactive';
    const actionLabel = nextStatus === 'inactive' ? 'desativar' : 'reativar';

    setStatusChangingId(company.id);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      if (res.ok) {
        setNotice({
          type: 'success',
          message:
            nextStatus === 'inactive'
              ? `Empresa "${company.name}" foi desativada. O acesso dos usuários foi suspenso e os dados permanecem preservados.`
              : `Empresa "${company.name}" foi reativada com sucesso. Acesso dos usuários liberado.`,
        });
        await fetchAdminData();
        await fetchAuditLogs();
      } else {
        const err = await res.json();
        setNotice({
          type: 'error',
          message: err.error || `Erro ao ${actionLabel} empresa.`,
        });
      }
    } catch {
      setNotice({ type: 'error', message: `Erro ao ${actionLabel} empresa.` });
    } finally {
      setStatusChangingId(null);
    }
  };

  // Submissão do cadastro de nova empresa
  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de frontend com regras puras
    const existingList = metrics ? metrics.companies : [];
    const validation = validateNewCompanyData(
      {
        name: formName,
        email: formEmail,
        cnpj: formCnpj,
        phone: formPhone,
        planId: formPlanId,
        status: formStatus,
      },
      existingList
    );

    if (!validation.valid) {
      setNotice({ type: 'error', message: validation.error || 'Dados inválidos.' });
      return;
    }

    setIsSubmittingCompany(true);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formName.trim(),
          responsibleName: formResponsible.trim() || undefined,
          email: formEmail.trim().toLowerCase(),
          cnpj: formCnpj.trim() || undefined,
          phone: formPhone.trim() || undefined,
          planId: formPlanId,
          status: formStatus,
          adminNotes: formNotes.trim() || undefined,
          accessOption: formAccessOption,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNotice({
          type: 'success',
          message: data.message || `Empresa "${formName}" cadastrada com sucesso!`,
        });

        if (data.invite) {
          setCreatedInviteInfo({
            companyName: data.company.name,
            email: data.company.email,
            inviteUrl: data.invite.inviteUrl,
            token: data.invite.token,
            message: data.invite.message,
          });
        }

        resetCompanyForm();
        await fetchAdminData();
        await fetchAuditLogs();
      } else {
        setNotice({
          type: 'error',
          message: data.error || 'Erro ao cadastrar empresa.',
        });
      }
    } catch {
      setNotice({
        type: 'error',
        message: 'Falha de comunicação com o servidor ao cadastrar empresa.',
      });
    } finally {
      setIsSubmittingCompany(false);
    }
  };

  // Confirmar e executar a exclusão definitiva digitando EXCLUIR
  const handleDeleteCompanyConfirm = async () => {
    if (!deletingCompany) return;

    if (!validateCompanyDeletionConfirmation(confirmNameInput)) {
      setNotice({
        type: 'error',
        message: 'Digite a palavra EXCLUIR para confirmar a exclusão definitiva.',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/companies/${deletingCompany.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmedText: confirmNameInput.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNotice({
          type: 'success',
          message: data.message || `Empresa "${deletingCompany.name}" excluída com sucesso.`,
        });
        setDeletingCompany(null);
        setConfirmNameInput('');
        await fetchAdminData();
        await fetchAuditLogs();
      } else {
        setNotice({
          type: 'error',
          message: data.error || 'Erro ao excluir empresa.',
        });
      }
    } catch {
      setNotice({
        type: 'error',
        message: 'Falha de comunicação com o servidor ao excluir empresa.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs">
        Carregando painel de administração da plataforma...
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-white p-8 text-center max-w-lg mx-auto shadow-sm">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Acesso Restrito ao Proprietário da Plataforma</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          O Painel SaaS Owner é exclusivo para o dono da plataforma R3-Stock gerenciar preços, planos globais e todos os clientes cadastrados.
        </p>
        <button
          onClick={async () => {
            await loginAsDemo('admin');
            await fetchAdminData();
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Acessar como Administrador Master (R3-Stock Owner)</span>
        </button>
      </div>
    );
  }

  // Filtragem de empresas
  const filteredCompanies = filterCompaniesByStatus(metrics.companies, statusFilter);

  // Contagens para os filtros
  const counts = {
    all: metrics.companies.length,
    active: metrics.companies.filter(c => c.status === 'active').length,
    inactive: metrics.companies.filter(c => c.status === 'inactive').length,
    past_due: metrics.companies.filter(c => c.status === 'past_due').length,
    canceled: metrics.companies.filter(c => c.status === 'canceled').length,
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-100 p-1.5 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Painel SaaS Owner — R3-Stock
            </h1>
            <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              SaaS Master
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestão global de empresas clientes, faturamento recorrente (MRR), planos, limites e segurança administrativa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowAuditLogs(!showAuditLogs);
              if (!showAuditLogs) fetchAuditLogs();
            }}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              showAuditLogs
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Auditoria ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => {
              fetchAdminData();
              fetchAuditLogs();
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Atualizar Dados</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-semibold flex items-center justify-between shadow-xs ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-700 p-1"
            title="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modal / Banner de Convite Gerado com Sucesso */}
      {createdInviteInfo && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-xs relative">
          <button
            onClick={() => setCreatedInviteInfo(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
              <Mail className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1 pr-6">
              <h3 className="text-sm font-bold text-blue-950">
                Convite Seguro Gerado para o Responsável
              </h3>
              <p className="text-xs text-blue-900/90 leading-relaxed">
                A empresa <strong className="font-extrabold">{createdInviteInfo.companyName}</strong> foi cadastrada. O convite utiliza token único criptografado temporário para o e-mail{' '}
                <strong className="font-extrabold">{createdInviteInfo.email}</strong>, garantindo que o responsável configure sua própria senha com total conformidade de segurança e sem senhas em texto puro.
              </p>

              <div className="rounded-xl border border-blue-200 bg-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <KeyRound className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="font-mono text-xs text-slate-700 truncate select-all">
                    {createdInviteInfo.inviteUrl}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdInviteInfo.inviteUrl);
                    setCopiedInvite(true);
                    setTimeout(() => setCopiedInvite(false), 3000);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors shrink-0 ${
                    copiedInvite
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copiedInvite ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar Link de Convite</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-blue-800/80">
                • {createdInviteInfo.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navegação entre as Abas do SaaS Admin */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'manage'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Gestão de Empresas & Planos</span>
        </button>

        <button
          onClick={() => setActiveTab('create_company')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'create_company'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          <span>Cadastrar Empresa</span>
          <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-extrabold uppercase">
            SaaS Master
          </span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* ABA 1: GESTÃO DE EMPRESAS & PLANOS */}
      {/* ==================================================================== */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Métricas Globais da Plataforma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">MRR (Faturamento Mensal)</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                R$ {metrics.mrr.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Receita recorrente ativa</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Empresas Cadastradas</p>
              <p className="text-2xl font-extrabold text-blue-700 mt-1">
                {metrics.totalCompanies}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {counts.active} ativas • {counts.inactive} inativas
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Usuários na Plataforma</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {metrics.totalUsers}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Operadores e gestores</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Produtos sob Gestão</p>
              <p className="text-2xl font-extrabold text-purple-700 mt-1">
                {metrics.totalProducts}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{metrics.totalMovements} movimentações</p>
            </div>
          </div>

          {/* Painel Expansível de Histórico de Auditoria */}
          {showAuditLogs && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Trilha de Auditoria Administrativa (LGPD & Compliance)
                  </h3>
                </div>
                <button
                  onClick={() => setShowAuditLogs(false)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4">
                {loadingAuditLogs ? (
                  <p className="text-xs text-slate-400 text-center py-4">Carregando logs...</p>
                ) : auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Nenhuma operação administrativa registrada até o momento.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-2 space-y-2">
                    {auditLogs.map(log => {
                      const dateStr = new Date(log.createdAt).toLocaleString('pt-BR');
                      const isDelete = log.action === 'delete_company';
                      const isDeact = log.action === 'deactivate_company';
                      const isRegister = log.action === 'register_company';

                      return (
                        <div key={log.id} className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                  isDelete
                                    ? 'bg-rose-100 text-rose-800'
                                    : isDeact
                                    ? 'bg-amber-100 text-amber-800'
                                    : isRegister
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isDelete
                                  ? 'Exclusão Definitiva'
                                  : isDeact
                                  ? 'Desativação'
                                  : isRegister
                                  ? 'Novo Cadastro'
                                  : 'Reativação'}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">
                                {log.targetCompanyName}
                              </span>
                              <span className="text-slate-400 text-[11px]">
                                • Realizado por: {log.adminEmail} ({log.adminName})
                              </span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {log.details}
                            </p>
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0 self-start sm:self-center">
                            {dateStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Configuração dos Planos & Preços */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Configuração dos Planos & Limites (Backend Enforced)
                </h2>
                <p className="text-xs text-slate-500">
                  Altere os preços das assinaturas e limites de produtos/usuários validados no backend.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.plans.map(p => {
                const isEditing = editingPlanId === p.id;

                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-extrabold text-slate-900 text-sm">{p.name}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                          ID: {p.id}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Preço Mensal (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={planPrice}
                              onChange={e => setPlanPrice(parseFloat(e.target.value) || 0)}
                              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Limite Máximo de Produtos
                            </label>
                            <input
                              type="number"
                              value={planMaxProducts}
                              onChange={e => setPlanMaxProducts(parseInt(e.target.value, 10) || 0)}
                              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Limite Máximo de Usuários
                            </label>
                            <input
                              type="number"
                              value={planMaxUsers}
                              onChange={e => setPlanMaxUsers(parseInt(e.target.value, 10) || 0)}
                              className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 mb-4 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Preço atual:</span>
                            <span className="font-extrabold text-slate-900">
                              {p.price === 0 ? 'R$ 0,00' : `R$ ${p.price.toFixed(2).replace('.', ',')}/mês`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Limite produtos:</span>
                            <span className="font-bold text-slate-900">
                              {p.maxProducts.toLocaleString('pt-BR')} itens
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Limite usuários:</span>
                            <span className="font-bold text-slate-900">{p.maxUsers} usuário(s)</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-200/80 pt-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingPlanId(null)}
                            className="flex-1 rounded-lg border border-slate-300 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => savePlanChanges(p.id)}
                            disabled={savingPlan}
                            className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            {savingPlan ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditPlan(p)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Editar Preço e Limites</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabela de Empresas Tenancy */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Empresas Clientes Cadastradas ({metrics.companies.length})
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tenants isolados no sistema. Gerencie planos, suspensão temporária e exclusão definitiva com segurança.
                </p>
              </div>

              {/* Filtros por status */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Filtrar:
                </span>

                <button
                  onClick={() => setStatusFilter('all')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Todas ({counts.all})
                </button>

                <button
                  onClick={() => setStatusFilter('active')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'
                  }`}
                >
                  Ativas ({counts.active})
                </button>

                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    statusFilter === 'inactive'
                      ? 'bg-slate-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Inativas ({counts.inactive})
                </button>

                <button
                  onClick={() => setStatusFilter('past_due')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    statusFilter === 'past_due'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50'
                  }`}
                >
                  Vencidas ({counts.past_due})
                </button>

                <button
                  onClick={() => setStatusFilter('canceled')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    statusFilter === 'canceled'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50'
                  }`}
                >
                  Canceladas ({counts.canceled})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Empresa</th>
                    <th className="py-2.5 px-3">CNPJ / E-mail</th>
                    <th className="py-2.5 px-3">Plano Ativo</th>
                    <th className="py-2.5 px-3">Limites Contratados</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Alterar Plano</th>
                    <th className="py-2.5 px-4 text-right">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhuma empresa encontrada com o filtro selecionado.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map(comp => {
                      const plan = metrics.plans.find(p => p.id === comp.planId) || metrics.plans[0];
                      const isChanging = statusChangingId === comp.id;
                      const isMasterAccount = comp.id === 'comp-admin-platform';

                      // Estilização do status
                      let statusBadge = (
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Ativo
                        </span>
                      );

                      if (comp.status === 'inactive') {
                        statusBadge = (
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            Inativo
                          </span>
                        );
                      } else if (comp.status === 'past_due') {
                        statusBadge = (
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Vencido
                          </span>
                        );
                      } else if (comp.status === 'canceled') {
                        statusBadge = (
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            Cancelado
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={comp.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            comp.status === 'inactive' ? 'bg-slate-50/40 text-slate-500' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900">{comp.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>ID: {comp.id}</span>
                              {comp.responsibleName && (
                                <>
                                  <span>•</span>
                                  <span>Resp: {comp.responsibleName}</span>
                                </>
                              )}
                              {isMasterAccount && (
                                <span className="font-bold text-blue-700 bg-blue-50 px-1 rounded">
                                  CONTA MASTER
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-700">{comp.cnpj || 'Não informado'}</div>
                            <div className="text-[11px] text-slate-400">{comp.email}</div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-extrabold text-blue-700 uppercase">{plan.name}</span>
                            <div className="text-[11px] text-slate-500">
                              {plan.price === 0 ? 'R$ 0,00' : `R$ ${plan.price.toFixed(2).replace('.', ',')}/mês`}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="text-[11px]">
                              <span className="font-semibold text-slate-700">Produtos:</span> {comp.maxProducts}
                            </div>
                            <div className="text-[11px]">
                              <span className="font-semibold text-slate-700">Usuários:</span> {comp.maxUsers}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">{statusBadge}</td>

                          <td className="py-3 px-3 text-center">
                            <select
                              value={comp.planId}
                              disabled={isChanging || isMasterAccount}
                              onChange={e =>
                                changeCompanyPlanOrStatus(comp.id, e.target.value, comp.status)
                              }
                              className="rounded-lg border border-slate-300 bg-white py-1 px-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-none disabled:opacity-50"
                            >
                              {metrics.plans.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* COLUNA AÇÕES */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {/* Botão de Desativar / Reativar */}
                              <button
                                onClick={() => toggleCompanyActiveStatus(comp)}
                                disabled={isChanging || isMasterAccount}
                                title={
                                  isMasterAccount
                                    ? 'A conta master não pode ser alterada'
                                    : comp.status === 'inactive'
                                    ? 'Reativar empresa'
                                    : 'Desativar empresa temporariamente'
                                }
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors ${
                                  isMasterAccount
                                    ? 'opacity-30 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                                    : comp.status === 'inactive'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                {comp.status === 'inactive' ? (
                                  <>
                                    <Power className="h-3 w-3 text-emerald-600" />
                                    <span>Reativar</span>
                                  </>
                                ) : (
                                  <>
                                    <PowerOff className="h-3 w-3 text-slate-500" />
                                    <span>Desativar</span>
                                  </>
                                )}
                              </button>

                              {/* Botão de Excluir Empresa Definitivamente */}
                              <button
                                onClick={() => {
                                  setDeletingCompany(comp);
                                  setConfirmNameInput('');
                                }}
                                disabled={isMasterAccount}
                                title={
                                  isMasterAccount
                                    ? 'A conta master não pode ser excluída'
                                    : 'Excluir empresa definitivamente'
                                }
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors ${
                                  isMasterAccount
                                    ? 'opacity-30 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                                    : 'border-rose-200/80 bg-rose-50/70 text-rose-600 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300'
                                }`}
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Excluir</span>
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
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 2: CADASTRAR EMPRESA (SaaS Master) */}
      {/* ==================================================================== */}
      {activeTab === 'create_company' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs max-w-4xl mx-auto">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Cadastrar Empresa Cliente
                </h2>
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  Área do SaaS Master
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cadastre novas empresas diretamente pelo painel administrativo, sem necessidade de cadastro público, com aplicação imediata dos limites e planos no banco de dados.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetCompanyForm();
                setActiveTab('manage');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Voltar para Lista
            </button>
          </div>

          <form onSubmit={handleCreateCompanySubmit} className="space-y-6">
            {/* Bloco 1: Dados Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Empresa <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Comercial Distribuidora Ramos Ltda"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Responsável <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Amanda Santos"
                    value={formResponsible}
                    onChange={e => setFormResponsible(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Principal da Empresa <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Ex: contato@empresaramos.com.br"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CNPJ <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formCnpj}
                    onChange={e => setFormCnpj(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="(11) 98765-4321"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 2: Seleção de Plano Inicial */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Plano Inicial Contratado <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {metrics.plans.map(p => {
                  const isSelected = formPlanId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormPlanId(p.id)}
                      className={`text-left rounded-xl p-3.5 border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-extrabold text-xs text-slate-900 uppercase">
                          Plano {p.name}
                        </span>
                        <span className="font-bold text-xs text-blue-700">
                          {p.price === 0 ? 'Grátis' : `R$ ${p.price.toFixed(2).replace('.', ',')}/mês`}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <div>• Até {p.maxProducts.toLocaleString('pt-BR')} produtos</div>
                        <div>• Até {p.maxUsers} usuário(s)</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloco 3: Status Inicial */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Status Inicial da Empresa <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="initialStatus"
                    checked={formStatus === 'active'}
                    onChange={() => setFormStatus('active')}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Ativo (Acesso liberado imediatamente)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="initialStatus"
                    checked={formStatus === 'inactive'}
                    onChange={() => setFormStatus('inactive')}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Inativo (Criar temporariamente suspensa)</span>
                </label>
              </div>
            </div>

            {/* Bloco 4: Criação do Acesso à Empresa */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-900">
                Opção de Acesso à Empresa
              </label>

              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="accessOption"
                    value="company_only"
                    checked={formAccessOption === 'company_only'}
                    onChange={() => setFormAccessOption('company_only')}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Opção A — Cadastrar somente a empresa
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Cria o registro empresarial no banco de dados sem vincular uma conta de usuário inicial. O responsável poderá ser associado posteriormente.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="accessOption"
                    value="company_and_invite"
                    checked={formAccessOption === 'company_and_invite'}
                    onChange={() => setFormAccessOption('company_and_invite')}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      Opção B — Cadastrar empresa e convidar o responsável
                      <span className="rounded bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.2 font-extrabold">
                        Recomendado
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Cria a empresa e gera um convite seguro com token único do Supabase Auth para o e-mail informado, permitindo que o responsável configure sua própria senha e acesse a plataforma com isolamento total.
                    </span>
                  </div>
                </label>
              </div>

              <div className="rounded-lg bg-blue-50/80 p-3 border border-blue-100 text-[11px] text-blue-900/90 leading-relaxed">
                <strong>Segurança Supabase Auth:</strong> O R3-Stock não gera senhas padrão nem envia senhas em texto puro. Em projetos Supabase conectados a provedores de e-mail (SMTP), o convite é disparado diretamente pelo Supabase Auth. Na demonstração ou ambiente de testes, o link seguro gerado com token único é exibido para cópia imediata.
              </div>
            </div>

            {/* Bloco 5: Observações Administrativas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações Administrativas <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Anotações internas sobre o contrato, faturamento corporativo ou regras de suporte..."
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Botões do Formulário */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  resetCompanyForm();
                  setActiveTab('manage');
                }}
                disabled={isSubmittingCompany}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmittingCompany}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                <span>{isSubmittingCompany ? 'Cadastrando Empresa...' : 'Cadastrar Empresa'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* Modal de Confirmação de Exclusão Definitiva */}
      {/* ==================================================================== */}
      {deletingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setDeletingCompany(null);
                setConfirmNameInput('');
              }}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Excluir Empresa Definitivamente
                </h3>
                <p className="text-xs text-slate-500">
                  Ação crítica restrita ao proprietário da plataforma R3-Stock.
                </p>
              </div>
            </div>

            {/* Informações da Empresa Afetada */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Nome da Empresa:</span>
                <span className="font-extrabold text-slate-900">{deletingCompany.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">E-mail associado:</span>
                <span className="font-semibold text-slate-800">{deletingCompany.email}</span>
              </div>
              {deletingCompany.cnpj && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">CNPJ:</span>
                  <span className="font-semibold text-slate-800">{deletingCompany.cnpj}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Plano Contratado:</span>
                <span className="font-extrabold text-blue-700 uppercase">
                  {metrics.plans.find(p => p.id === deletingCompany.planId)?.name || deletingCompany.planId}
                </span>
              </div>

              {/* Novo Campo: Tempo Desativada */}
              <div className="flex justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  Tempo desativada:
                </span>
                <span
                  className={`font-bold ${
                    deletingCompany.status === 'active'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {formatDeactivationDuration(deletingCompany.deactivatedAt, deletingCompany.status)}
                </span>
              </div>
            </div>

            {/* Aviso de Exclusão de Dados e LGPD */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 mb-4 text-xs text-rose-900 leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Aviso sobre dados relacionados e LGPD:
              </p>
              <p className="text-[11px] text-rose-800/90">
                Esta operação removerá definitivamente os produtos, movimentações de estoque, fornecedores e os acessos dos usuários desta empresa. Registros de auditoria e fiscais serão mantidos em conformidade com as exigências legais de retenção de dados da LGPD.
              </p>
            </div>

            {/* Confirmação por digitação da palavra EXCLUIR */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Para confirmar a exclusão definitiva, digite a palavra <span className="text-rose-600 font-mono">EXCLUIR</span> abaixo:
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Digite EXCLUIR para confirmar..."
                value={confirmNameInput}
                onChange={e => setConfirmNameInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-xs focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                A validação aceita maiúsculas ou minúsculas (insensível a maiúsculas e minúsculas).
              </p>
            </div>

            {/* Botões do modal */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeletingCompany(null);
                  setConfirmNameInput('');
                }}
                disabled={isDeleting}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCompanyConfirm}
                disabled={
                  !validateCompanyDeletionConfirmation(confirmNameInput) ||
                  isDeleting
                }
                className={`rounded-xl px-4 py-2 text-xs font-extrabold text-white transition-all shadow-xs flex items-center gap-1.5 ${
                  validateCompanyDeletionConfirmation(confirmNameInput) && !isDeleting
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-rose-300 cursor-not-allowed'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? 'Excluindo...' : 'Excluir definitivamente'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
