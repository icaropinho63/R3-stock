/**
 * Regras de negócio puras para a gestão administrativa de empresas no R3-Stock
 * Validação de cadastro, exclusão, controle de status, permissões, cálculo de tempo e retenção LGPD
 */

import { Company } from '../types';

export type CompanyFilterType = 'all' | 'active' | 'inactive' | 'past_due' | 'canceled';

/**
 * Valida a palavra de confirmação digitada para exclusão definitiva.
 * Deve ser estritamente 'EXCLUIR' (insensível a maiúsculas/minúsculas e tolerante a espaços nas pontas).
 */
export function validateCompanyDeletionConfirmation(typedText: string): boolean {
  if (!typedText) return false;
  return typedText.trim().toUpperCase() === 'EXCLUIR';
}

/**
 * Formata o tempo decorrido desde a desativação da empresa de forma legível em português.
 * - Se empresa ativa: "Empresa ativa"
 * - Se sem data de desativação: "Data de desativação indisponível"
 * - Caso contrário: "Desativada há X dias" / "Desativada há X meses e Y dias" / "Desativada há X anos e Y meses"
 */
export function formatDeactivationDuration(
  deactivatedAt: string | null | undefined,
  status: string,
  nowInput?: Date
): string {
  if (status === 'active') {
    return 'Empresa ativa';
  }

  if (!deactivatedAt) {
    return 'Data de desativação indisponível';
  }

  const deactDate = new Date(deactivatedAt);
  if (isNaN(deactDate.getTime())) {
    return 'Data de desativação indisponível';
  }

  const now = nowInput || new Date();
  const diffMs = now.getTime() - deactDate.getTime();

  if (diffMs < 0) {
    return 'Desativada recentemente';
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (totalDays === 0) {
    if (diffHours <= 1) {
      return 'Desativada hoje (menos de 1 hora)';
    }
    return `Desativada hoje (há ${diffHours} horas)`;
  }

  const years = Math.floor(totalDays / 365);
  const remainingDaysAfterYears = totalDays % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);
  const remainingDays = remainingDaysAfterYears % 30;

  if (years >= 1) {
    const yearLabel = years === 1 ? '1 ano' : `${years} anos`;
    if (months > 0) {
      const monthLabel = months === 1 ? '1 mês' : `${months} meses`;
      return `Desativada há ${yearLabel} e ${monthLabel}`;
    }
    return `Desativada há ${yearLabel}`;
  }

  if (months >= 1) {
    const monthLabel = months === 1 ? '1 mês' : `${months} meses`;
    if (remainingDays > 0) {
      const dayLabel = remainingDays === 1 ? '1 dia' : `${remainingDays} dias`;
      return `Desativada há ${monthLabel} e ${dayLabel}`;
    }
    return `Desativada há ${monthLabel}`;
  }

  return `Desativada há ${totalDays} ${totalDays === 1 ? 'dia' : 'dias'}`;
}

export interface NewCompanyFormInput {
  name: string;
  responsibleName?: string;
  email: string;
  cnpj?: string;
  phone?: string;
  planId: string;
  status: 'active' | 'inactive';
  adminNotes?: string;
  accessOption?: 'company_only' | 'company_and_invite';
}

/**
 * Validação dos campos de cadastro de nova empresa e prevenção de duplicações indevidas
 */
export function validateNewCompanyData(
  input: Partial<NewCompanyFormInput>,
  existingCompanies: { email: string; cnpj?: string; name?: string }[] = []
): { valid: boolean; error?: string } {
  if (!input.name || input.name.trim().length < 2) {
    return { valid: false, error: 'O nome da empresa é obrigatório (mínimo de 2 caracteres).' };
  }

  if (!input.email || !input.email.trim()) {
    return { valid: false, error: 'O e-mail principal da empresa é obrigatório.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!emailRegex.test(normalizedEmail)) {
    return { valid: false, error: 'O e-mail informado possui formato inválido.' };
  }

  // Prevenção de duplicidade por e-mail
  const emailExists = existingCompanies.some(
    c => c.email && c.email.trim().toLowerCase() === normalizedEmail
  );
  if (emailExists) {
    return { valid: false, error: `Já existe uma empresa cadastrada com o e-mail "${input.email.trim()}".` };
  }

  // Se CNPJ foi informado, valida tamanho mínimo e duplicidade
  if (input.cnpj && input.cnpj.trim()) {
    const cleanCnpj = input.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14 && cleanCnpj.length > 0) {
      return { valid: false, error: 'CNPJ deve conter 14 dígitos numéricos (ou ser deixado em branco).' };
    }

    const cnpjExists = existingCompanies.some(c => {
      if (!c.cnpj) return false;
      return c.cnpj.replace(/\D/g, '') === cleanCnpj;
    });

    if (cnpjExists) {
      return { valid: false, error: `Já existe uma empresa cadastrada com o CNPJ "${input.cnpj.trim()}".` };
    }
  }

  const validPlans = ['free', 'pro', 'business'];
  if (input.planId && !validPlans.includes(input.planId)) {
    return { valid: false, error: `Plano "${input.planId}" inválido. Escolha Free, Pro ou Business.` };
  }

  const validStatuses = ['active', 'inactive'];
  if (input.status && !validStatuses.includes(input.status)) {
    return { valid: false, error: `Status inicial "${input.status}" inválido. Escolha Ativo ou Inativo.` };
  }

  return { valid: true };
}

/**
 * Verifica se uma empresa pode sofrer alteração de status
 * Impede que a conta master da plataforma seja desativada
 */
export function canChangeCompanyStatus(
  targetCompanyId: string,
  newStatus: string
): { allowed: boolean; reason?: string } {
  if (targetCompanyId === 'comp-admin-platform') {
    return {
      allowed: false,
      reason: 'A conta raiz da plataforma não pode ser desativada ou alterada.',
    };
  }

  const validStatuses = ['active', 'inactive', 'past_due', 'canceled'];
  if (!validStatuses.includes(newStatus)) {
    return {
      allowed: false,
      reason: `Status "${newStatus}" inválido. Permitidos: ${validStatuses.join(', ')}`,
    };
  }

  return { allowed: true };
}

/**
 * Verifica se a exclusão da empresa é permitida
 */
export function canDeleteCompany(
  targetCompanyId: string,
  userRole: string
): { allowed: boolean; reason?: string } {
  if (userRole !== 'platform_admin') {
    return {
      allowed: false,
      reason: 'Apenas o proprietário autorizado da plataforma possui permissão para excluir empresas.',
    };
  }

  if (targetCompanyId === 'comp-admin-platform') {
    return {
      allowed: false,
      reason: 'A empresa do administrador mestre não pode ser excluída.',
    };
  }

  return { allowed: true };
}

/**
 * Validação de acesso ao tenant para usuários regulares e administradores
 * Bloqueia usuários comuns caso a empresa esteja 'inactive'
 */
export function canUserAccessTenant(
  companyStatus: string,
  userRole: string
): { allowed: boolean; reason?: string } {
  // Administradores da plataforma têm acesso irrestrito
  if (userRole === 'platform_admin') {
    return { allowed: true };
  }

  if (companyStatus === 'inactive') {
    return {
      allowed: false,
      reason: 'Esta empresa foi desativada temporariamente pela administração da plataforma. Entre em contato com o suporte.',
    };
  }

  return { allowed: true };
}

/**
 * Filtra lista de empresas pelo status selecionado
 */
export function filterCompaniesByStatus(
  companies: Company[],
  filter: CompanyFilterType
): Company[] {
  if (filter === 'all') return companies;
  return companies.filter(c => c.status === filter);
}

/**
 * Gera sumário de auditoria para exclusão em conformidade com LGPD
 */
export function generateAuditDeletionSummary(data: {
  companyName: string;
  companyId: string;
  adminEmail: string;
  counts: {
    products: number;
    movements: number;
    suppliers: number;
    users: number;
  };
}): string {
  return `Exclusão definitiva solicitada por ${data.adminEmail} para empresa "${data.companyName}" (ID: ${data.companyId}). Registros purgados: ${data.counts.products} produtos, ${data.counts.movements} movimentações, ${data.counts.suppliers} fornecedores, ${data.counts.users} usuários. Registros financeiros e de auditoria preservados conforme obrigações da LGPD e retenção legal.`;
}
