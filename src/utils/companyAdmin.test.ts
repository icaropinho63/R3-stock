import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCompanyDeletionConfirmation,
  formatDeactivationDuration,
  validateNewCompanyData,
  canChangeCompanyStatus,
  canDeleteCompany,
  canUserAccessTenant,
  filterCompaniesByStatus,
  generateAuditDeletionSummary,
} from './companyAdmin';
import { Company } from '../types';

test('validateCompanyDeletionConfirmation checks for the word EXCLUIR case-insensitively with trim', () => {
  assert.equal(validateCompanyDeletionConfirmation('EXCLUIR'), true);
  assert.equal(validateCompanyDeletionConfirmation('excluir'), true);
  assert.equal(validateCompanyDeletionConfirmation('Excluir'), true);
  assert.equal(validateCompanyDeletionConfirmation('  EXCLUIR  '), true);
  assert.equal(validateCompanyDeletionConfirmation('  excluir '), true);

  // Deve rejeitar palavras incorretas, nomes de empresa ou strings vazias
  assert.equal(validateCompanyDeletionConfirmation('TechStore Brasil Ltda'), false);
  assert.equal(validateCompanyDeletionConfirmation('deletar'), false);
  assert.equal(validateCompanyDeletionConfirmation('SIM'), false);
  assert.equal(validateCompanyDeletionConfirmation(''), false);
  assert.equal(validateCompanyDeletionConfirmation('   '), false);
});

test('formatDeactivationDuration formats duration accurately in Portuguese', () => {
  const baseNow = new Date('2026-10-29T12:00:00Z');

  // Empresa ativa
  assert.equal(formatDeactivationDuration('2026-10-20T12:00:00Z', 'active', baseNow), 'Empresa ativa');

  // Sem data de desativação
  assert.equal(formatDeactivationDuration(null, 'inactive', baseNow), 'Data de desativação indisponível');
  assert.equal(formatDeactivationDuration(undefined, 'inactive', baseNow), 'Data de desativação indisponível');
  assert.equal(formatDeactivationDuration('data-invalida', 'inactive', baseNow), 'Data de desativação indisponível');

  // Desativada hoje (menos de 1 hora)
  const halfHourAgo = new Date(baseNow.getTime() - 30 * 60 * 1000).toISOString();
  assert.equal(formatDeactivationDuration(halfHourAgo, 'inactive', baseNow), 'Desativada hoje (menos de 1 hora)');

  // Desativada há 1 dia
  const oneDayAgo = new Date(baseNow.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(formatDeactivationDuration(oneDayAgo, 'inactive', baseNow), 'Desativada há 1 dia');

  // Desativada há 3 dias
  const threeDaysAgo = new Date(baseNow.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(formatDeactivationDuration(threeDaysAgo, 'inactive', baseNow), 'Desativada há 3 dias');

  // Desativada há 2 meses e 5 dias (65 dias)
  const sixtyFiveDaysAgo = new Date(baseNow.getTime() - 65 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(formatDeactivationDuration(sixtyFiveDaysAgo, 'inactive', baseNow), 'Desativada há 2 meses e 5 dias');

  // Desativada há 1 ano e 2 meses (~425 dias)
  const oneYearTwoMonthsAgo = new Date(baseNow.getTime() - (365 + 60) * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(formatDeactivationDuration(oneYearTwoMonthsAgo, 'inactive', baseNow), 'Desativada há 1 ano e 2 meses');
});

test('validateNewCompanyData validates required fields, email format and duplicates', () => {
  const existing = [
    { email: 'empresa1@teste.com', cnpj: '12.345.678/0001-90', name: 'Empresa 1' },
    { email: 'empresa2@teste.com', cnpj: '98.765.432/0001-10', name: 'Empresa 2' },
  ];

  // Caso válido completo
  const validRes = validateNewCompanyData(
    {
      name: 'Nova Distribuidora LTDA',
      responsibleName: 'Juliana Costa',
      email: 'contato@novadistribuidora.com',
      cnpj: '11.222.333/0001-44',
      phone: '(11) 99887-6655',
      planId: 'pro',
      status: 'active',
    },
    existing
  );
  assert.equal(validRes.valid, true);

  // Caso válido com campos opcionais omitidos
  const minimalValid = validateNewCompanyData(
    {
      name: 'Comércio Simples',
      email: 'simples@loja.com.br',
    },
    existing
  );
  assert.equal(minimalValid.valid, true);

  // Erro: Nome em branco
  const emptyName = validateNewCompanyData({ name: '', email: 'teste@teste.com' }, existing);
  assert.equal(emptyName.valid, false);
  assert.match(emptyName.error || '', /nome da empresa é obrigatório/i);

  // Erro: E-mail em branco ou inválido
  const invalidEmail = validateNewCompanyData({ name: 'Empresa Teste', email: 'email-invalido' }, existing);
  assert.equal(invalidEmail.valid, false);
  assert.match(invalidEmail.error || '', /e-mail.*inválido/i);

  // Erro: E-mail duplicado
  const dupEmail = validateNewCompanyData({ name: 'Outra', email: 'empresa1@teste.com' }, existing);
  assert.equal(dupEmail.valid, false);
  assert.match(dupEmail.error || '', /já existe uma empresa cadastrada com o e-mail/i);

  // Erro: CNPJ com tamanho incorreto
  const badCnpj = validateNewCompanyData(
    { name: 'Empresa', email: 'novo@teste.com', cnpj: '123' },
    existing
  );
  assert.equal(badCnpj.valid, false);
  assert.match(badCnpj.error || '', /14 dígitos/i);

  // Erro: CNPJ duplicado
  const dupCnpj = validateNewCompanyData(
    { name: 'Empresa', email: 'novo@teste.com', cnpj: '12.345.678/0001-90' },
    existing
  );
  assert.equal(dupCnpj.valid, false);
  assert.match(dupCnpj.error || '', /já existe uma empresa cadastrada com o cnpj/i);
});

test('canChangeCompanyStatus prevents deactivating platform root account', () => {
  const rootCheck = canChangeCompanyStatus('comp-admin-platform', 'inactive');
  assert.equal(rootCheck.allowed, false);
  assert.match(rootCheck.reason || '', /conta raiz/);

  const regularCheck = canChangeCompanyStatus('comp-demo-1', 'inactive');
  assert.equal(regularCheck.allowed, true);

  const invalidStatusCheck = canChangeCompanyStatus('comp-demo-1', 'unknown_status');
  assert.equal(invalidStatusCheck.allowed, false);
});

test('canDeleteCompany enforces platform_admin role and protects master account', () => {
  const ownerCheck = canDeleteCompany('comp-demo-1', 'owner');
  assert.equal(ownerCheck.allowed, false);

  const adminCheck = canDeleteCompany('comp-demo-1', 'admin');
  assert.equal(adminCheck.allowed, false);

  const platformAdminCheck = canDeleteCompany('comp-demo-1', 'platform_admin');
  assert.equal(platformAdminCheck.allowed, true);

  const platformRootDelete = canDeleteCompany('comp-admin-platform', 'platform_admin');
  assert.equal(platformRootDelete.allowed, false);
});

test('canUserAccessTenant blocks normal users when company is inactive', () => {
  const activeUser = canUserAccessTenant('active', 'owner');
  assert.equal(activeUser.allowed, true);

  const inactiveUser = canUserAccessTenant('inactive', 'employee');
  assert.equal(inactiveUser.allowed, false);
  assert.match(inactiveUser.reason || '', /desativada temporariamente/);

  // Platform admin can still access
  const platformAdmin = canUserAccessTenant('inactive', 'platform_admin');
  assert.equal(platformAdmin.allowed, true);
});

test('filterCompaniesByStatus filters by all status types correctly', () => {
  const mockCompanies: Company[] = [
    {
      id: '1',
      name: 'Empresa A',
      email: 'a@test.com',
      planId: 'free',
      maxProducts: 50,
      maxUsers: 1,
      status: 'active',
      createdAt: '2026-01-01',
    },
    {
      id: '2',
      name: 'Empresa B',
      email: 'b@test.com',
      planId: 'pro',
      maxProducts: 1000,
      maxUsers: 5,
      status: 'inactive',
      createdAt: '2026-01-02',
    },
    {
      id: '3',
      name: 'Empresa C',
      email: 'c@test.com',
      planId: 'business',
      maxProducts: 5000,
      maxUsers: 15,
      status: 'past_due',
      createdAt: '2026-01-03',
    },
    {
      id: '4',
      name: 'Empresa D',
      email: 'd@test.com',
      planId: 'pro',
      maxProducts: 1000,
      maxUsers: 5,
      status: 'canceled',
      createdAt: '2026-01-04',
    },
  ];

  assert.equal(filterCompaniesByStatus(mockCompanies, 'all').length, 4);
  assert.equal(filterCompaniesByStatus(mockCompanies, 'active').length, 1);
  assert.equal(filterCompaniesByStatus(mockCompanies, 'inactive').length, 1);
  assert.equal(filterCompaniesByStatus(mockCompanies, 'past_due').length, 1);
  assert.equal(filterCompaniesByStatus(mockCompanies, 'canceled').length, 1);
});

test('generateAuditDeletionSummary formats legal/LGPD summary correctly', () => {
  const summary = generateAuditDeletionSummary({
    companyName: 'Loja Exemplo',
    companyId: 'comp-99',
    adminEmail: 'admin@r3stock.com.br',
    counts: {
      products: 15,
      movements: 40,
      suppliers: 3,
      users: 2,
    },
  });

  assert.match(summary, /Loja Exemplo/);
  assert.match(summary, /15 produtos/);
  assert.match(summary, /40 movimentações/);
  assert.match(summary, /LGPD/);
});
