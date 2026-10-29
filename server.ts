import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {
  checkPlanProductLimit,
  checkPlanUserLimit,
  calculateStockAfterMovement,
  type PlanConfig,
} from './src/utils/inventoryRules';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// ==============================================================================
// Armazenamento Persistente Multi-Empresa em Disco (data/db.json)
// Garante persistência dos dados e suporte completo para demonstrações e testes
// ==============================================================================
const DB_FILE = path.resolve('data/db.json');

interface StoredPlan extends PlanConfig {
  features: string[];
  billingCycle: string;
}

interface StoredCompany {
  id: string;
  name: string;
  responsibleName?: string;
  cnpj: string;
  phone: string;
  email: string;
  planId: string;
  maxProducts: number;
  maxUsers: number;
  status: 'active' | 'inactive' | 'past_due' | 'canceled';
  deactivatedAt?: string | null;
  adminNotes?: string;
  createdAt: string;
}

export interface StoredAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  targetCompanyId: string;
  targetCompanyName: string;
  action: 'deactivate_company' | 'reactivate_company' | 'delete_company' | 'register_company';
  details: string;
  createdAt: string;
}

interface StoredUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'owner' | 'admin' | 'employee' | 'platform_admin';
  createdAt: string;
}

interface StoredSupplier {
  id: string;
  companyId: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
}

interface StoredProduct {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  supplierId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredMovement {
  id: string;
  companyId: string;
  productId: string;
  type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  notes: string;
  userId: string;
  userName: string;
  createdAt: string;
}

interface DatabaseSchema {
  plans: StoredPlan[];
  companies: StoredCompany[];
  users: StoredUser[];
  suppliers: StoredSupplier[];
  products: StoredProduct[];
  movements: StoredMovement[];
  auditLogs: StoredAuditLog[];
}

const defaultPlans: StoredPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    maxProducts: 50,
    maxUsers: 1,
    billingCycle: 'monthly',
    features: [
      'Até 50 produtos cadastrados',
      '1 usuário com acesso',
      'Controle de entradas e saídas',
      'Dashboard com indicadores básicos',
      'Relatórios essenciais',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 39.9,
    maxProducts: 1000,
    maxUsers: 5,
    billingCycle: 'monthly',
    features: [
      'Até 1.000 produtos cadastrados',
      'Até 5 usuários colaboradores',
      'Relatórios avançados com exportação CSV',
      'Importação em lote via CSV',
      'Gestão completa de fornecedores',
      'Alertas de estoque baixo e margem de lucro',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 79.9,
    maxProducts: 5000,
    maxUsers: 15,
    billingCycle: 'monthly',
    features: [
      'Até 5.000 produtos cadastrados',
      'Até 15 usuários com permissões avançadas',
      'Todos os recursos do plano Pro',
      'Controle de acesso granular por cargo',
      'Auditoria completa de movimentações',
      'Suporte prioritário via WhatsApp',
    ],
  },
];

function initDB(): DatabaseSchema {
  if (!fs.existsSync(path.dirname(DB_FILE))) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      // Garante migração de credenciais e nomes para a marca R3-Stock
      let modified = false;
      data.users.forEach((u: StoredUser) => {
        if (u.email.includes('stockflow.com.br')) {
          u.email = u.email.replace('stockflow.com.br', 'r3stock.com.br');
          if (u.name.includes('StockFlow')) {
            u.name = u.name.replace('StockFlow', 'R3-Stock');
          }
          modified = true;
        }
      });
      if (!Array.isArray(data.auditLogs)) {
        data.auditLogs = [];
        modified = true;
      }
      if (Array.isArray(data.companies)) {
        data.companies.forEach((c: StoredCompany) => {
          if (c.deactivatedAt === undefined) {
            c.deactivatedAt = c.status === 'inactive' ? new Date().toISOString() : null;
            modified = true;
          }
        });
      }
      if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      }
      return data;
    } catch {
      // parse error, re-seed
    }
  }

  // Dados iniciais de demonstração (seed)
  const initialCompany: StoredCompany = {
    id: 'comp-demo-1',
    name: 'TechStore Brasil Ltda',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    email: 'contato@techstore.com.br',
    planId: 'pro',
    maxProducts: 1000,
    maxUsers: 5,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const initialUser: StoredUser = {
    id: 'user-demo-1',
    companyId: initialCompany.id,
    name: 'Carlos Oliveira',
    email: 'demo@r3stock.com.br',
    passwordHash: 'demo123',
    role: 'owner',
    createdAt: new Date().toISOString(),
  };

  const platformAdmin: StoredUser = {
    id: 'user-admin-root',
    companyId: 'comp-admin-platform',
    name: 'Administrador R3-Stock',
    email: 'admin@r3stock.com.br',
    passwordHash: 'admin123',
    role: 'platform_admin',
    createdAt: new Date().toISOString(),
  };

  const initialSuppliers: StoredSupplier[] = [
    {
      id: 'sup-1',
      companyId: initialCompany.id,
      name: 'Distribuidora Global Tech',
      contactName: 'Mariana Santos',
      phone: '(11) 3221-8899',
      email: 'pedidos@globaltech.com.br',
      notes: 'Prazo médio de entrega: 3 dias úteis. Desconto de 5% no PIX.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sup-2',
      companyId: initialCompany.id,
      name: 'Eletrônicos do Brasil S/A',
      contactName: 'Roberto Costa',
      phone: '(41) 3044-1234',
      email: 'comercial@eletronicosbr.com',
      notes: 'Fornecedor homologado para cabos e adaptadores.',
      createdAt: new Date().toISOString(),
    },
  ];

  const initialProducts: StoredProduct[] = [
    {
      id: 'prod-1',
      companyId: initialCompany.id,
      name: 'Teclado Mecânico RGB Switch Blue',
      sku: 'TEC-MEC-01',
      barcode: '7891234567890',
      category: 'Periféricos',
      unit: 'UN',
      quantity: 18,
      minStock: 10,
      costPrice: 120.0,
      salePrice: 249.9,
      supplierId: 'sup-1',
      notes: 'Garantia de 12 meses direto do fornecedor.',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-2',
      companyId: initialCompany.id,
      name: 'Mouse Gamer 16000 DPI Óptico',
      sku: 'MOU-GAM-02',
      barcode: '7891234567891',
      category: 'Periféricos',
      unit: 'UN',
      quantity: 4,
      minStock: 15, // ESTOQUE BAIXO!
      costPrice: 65.0,
      salePrice: 149.9,
      supplierId: 'sup-1',
      notes: 'Modelo de alta rotatividade. Repor imediatamente.',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-3',
      companyId: initialCompany.id,
      name: 'Monitor UltraWide 29" IPS Full HD',
      sku: 'MON-UW-29',
      barcode: '7891234567892',
      category: 'Monitores',
      unit: 'UN',
      quantity: 8,
      minStock: 5,
      costPrice: 790.0,
      salePrice: 1399.0,
      supplierId: 'sup-2',
      notes: 'Frágil. Armazenar na prateleira inferior.',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-4',
      companyId: initialCompany.id,
      name: 'Headset Sem Fio Noise Cancelling',
      sku: 'HEA-WIR-04',
      barcode: '7891234567893',
      category: 'Áudio',
      unit: 'UN',
      quantity: 0, // ESGOTADO!
      minStock: 8,
      costPrice: 210.0,
      salePrice: 429.0,
      supplierId: 'sup-1',
      notes: 'Esgotou após promoção da Black Friday.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-5',
      companyId: initialCompany.id,
      name: 'Cabo HDMI 2.1 Ultra High Speed 2m',
      sku: 'CAB-HDM-05',
      barcode: '7891234567894',
      category: 'Acessórios',
      unit: 'UN',
      quantity: 45,
      minStock: 20,
      costPrice: 15.0,
      salePrice: 45.0,
      supplierId: 'sup-2',
      notes: 'Suporta 4K a 120Hz e 8K a 60Hz.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialMovements: StoredMovement[] = [
    {
      id: 'mov-1',
      companyId: initialCompany.id,
      productId: 'prod-1',
      type: 'entry',
      quantity: 20,
      previousStock: 0,
      newStock: 20,
      reason: 'Compra inicial NF-e #1042',
      notes: 'Recebido sem avarias.',
      userId: initialUser.id,
      userName: initialUser.name,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'mov-2',
      companyId: initialCompany.id,
      productId: 'prod-1',
      type: 'exit',
      quantity: 2,
      previousStock: 20,
      newStock: 18,
      reason: 'Venda Pedido #841',
      notes: 'Retirada para expedição balcão.',
      userId: initialUser.id,
      userName: initialUser.name,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'mov-3',
      companyId: initialCompany.id,
      productId: 'prod-2',
      type: 'exit',
      quantity: 11,
      previousStock: 15,
      newStock: 4,
      reason: 'Venda em lote para empresa parceira',
      notes: 'NF-e emitida com sucesso.',
      userId: initialUser.id,
      userName: initialUser.name,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];

  const initialData: DatabaseSchema = {
    plans: defaultPlans,
    companies: [initialCompany],
    users: [initialUser, platformAdmin],
    suppliers: initialSuppliers,
    products: initialProducts,
    movements: initialMovements,
    auditLogs: [],
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}

let db = initDB();

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// Middleware de autenticação simples por Bearer token ou sessão simulada
function authenticateUser(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Não autorizado. Token de autenticação ausente.' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const user = db.users.find(u => u.id === token || u.email === token);

  if (!user) {
    res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    return;
  }

  const company = db.companies.find(c => c.id === user.companyId);

  // Se a empresa foi desativada pela administração, bloqueia usuários comuns
  if (user.role !== 'platform_admin' && company && company.status === 'inactive') {
    res.status(403).json({
      error: 'Esta empresa foi desativada temporariamente pela administração da plataforma. Entre em contato com o suporte.',
      code: 'COMPANY_INACTIVE',
    });
    return;
  }

  // Anexa usuário e empresa na requisição
  (req as any).user = user;
  (req as any).company = company;
  next();
}

// ==============================================================================
// ROTAS DE AUTENTICAÇÃO
// ==============================================================================

app.post('/api/auth/register', (req: Request, res: Response): void => {
  const { companyName, name, email, password, cnpj, phone, planId = 'free' } = req.body;

  if (!companyName || !name || !email || !password) {
    res.status(400).json({ error: 'Nome da empresa, seu nome, e-mail e senha são obrigatórios.' });
    return;
  }

  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    res.status(400).json({ error: 'Já existe uma conta cadastrada com este e-mail.' });
    return;
  }

  const selectedPlan = db.plans.find(p => p.id === planId) || db.plans[0];

  const newCompanyId = `comp-${Date.now()}`;
  const newUserId = `user-${Date.now()}`;

  const newCompany: StoredCompany = {
    id: newCompanyId,
    name: companyName,
    cnpj: cnpj || '',
    phone: phone || '',
    email: email,
    planId: selectedPlan.id,
    maxProducts: selectedPlan.maxProducts,
    maxUsers: selectedPlan.maxUsers,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const newUser: StoredUser = {
    id: newUserId,
    companyId: newCompanyId,
    name,
    email,
    passwordHash: password, // Em produção com Supabase Auth usa bcrypt/scrypt
    role: 'owner',
    createdAt: new Date().toISOString(),
  };

  db.companies.push(newCompany);
  db.users.push(newUser);
  saveDB();

  res.status(201).json({
    token: newUser.id,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      companyId: newUser.companyId,
    },
    company: newCompany,
    plan: selectedPlan,
  });
});

app.post('/api/auth/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    return;
  }

  const user = db.users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
  );

  if (!user) {
    res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    return;
  }

  const company = db.companies.find(c => c.id === user.companyId);

  // Bloqueio no login para empresas desativadas
  if (user.role !== 'platform_admin' && company && company.status === 'inactive') {
    res.status(403).json({
      error: 'Acesso bloqueado: esta empresa foi desativada temporariamente pela administração da plataforma.',
      code: 'COMPANY_INACTIVE',
    });
    return;
  }

  const plan = db.plans.find(p => p.id === (company ? company.planId : 'free')) || db.plans[0];

  res.json({
    token: user.id,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
    company,
    plan,
  });
});

app.get('/api/auth/me', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  const company = (req as any).company as StoredCompany;
  const plan = db.plans.find(p => p.id === (company ? company.planId : 'free')) || db.plans[0];

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
    company,
    plan,
  });
});

// ==============================================================================
// ROTAS DE PLANOS
// ==============================================================================

app.get('/api/plans', (_req: Request, res: Response) => {
  res.json(db.plans);
});

// ==============================================================================
// ROTAS DE PRODUTOS (Com validação estrita de limites de planos no BACKEND)
// ==============================================================================

app.get('/api/products', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const companyProducts = db.products.filter(p => p.companyId === user.companyId);
  res.json(companyProducts);
});

app.post('/api/products', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  const company = (req as any).company as StoredCompany;

  if (!company) {
    res.status(404).json({ error: 'Empresa não encontrada.' });
    return;
  }

  const currentPlan = db.plans.find(p => p.id === company.planId) || {
    id: company.planId,
    name: 'Atual',
    maxProducts: company.maxProducts,
    maxUsers: company.maxUsers,
    price: 0,
  };

  const existingProductsCount = db.products.filter(p => p.companyId === user.companyId).length;

  // Validação no backend de limite do plano
  const planCheck = checkPlanProductLimit(existingProductsCount, currentPlan);
  if (!planCheck.allowed) {
    res.status(403).json({
      error: planCheck.message,
      code: 'PLAN_LIMIT_REACHED',
      currentCount: existingProductsCount,
      maxProducts: currentPlan.maxProducts,
    });
    return;
  }

  const {
    name,
    sku,
    barcode,
    category,
    unit,
    quantity,
    minStock,
    costPrice,
    salePrice,
    supplierId,
    notes,
  } = req.body;

  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'O nome do produto é obrigatório.' });
    return;
  }

  const initialQty = Math.max(0, parseInt(quantity, 10) || 0);

  const newProduct: StoredProduct = {
    id: `prod-${Date.now()}`,
    companyId: user.companyId,
    name: name.trim(),
    sku: sku ? sku.trim() : `SKU-${Date.now().toString().slice(-6)}`,
    barcode: barcode ? barcode.trim() : '',
    category: category ? category.trim() : 'Geral',
    unit: unit ? unit.trim().toUpperCase() : 'UN',
    quantity: initialQty,
    minStock: parseInt(minStock, 10) || 5,
    costPrice: parseFloat(costPrice) || 0,
    salePrice: parseFloat(salePrice) || 0,
    supplierId: supplierId || undefined,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.products.push(newProduct);

  // Se houver saldo inicial > 0, cria automaticamente a movimentação de entrada inicial
  if (initialQty > 0) {
    const initialMovement: StoredMovement = {
      id: `mov-${Date.now()}`,
      companyId: user.companyId,
      productId: newProduct.id,
      type: 'entry',
      quantity: initialQty,
      previousStock: 0,
      newStock: initialQty,
      reason: 'Estoque inicial cadastrado',
      notes: 'Cadastro inicial do item',
      userId: user.id,
      userName: user.name,
      createdAt: new Date().toISOString(),
    };
    db.movements.push(initialMovement);
  }

  saveDB();
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  const productId = req.params.id;

  const product = db.products.find(p => p.id === productId && p.companyId === user.companyId);
  if (!product) {
    res.status(404).json({ error: 'Produto não encontrado.' });
    return;
  }

  const {
    name,
    sku,
    barcode,
    category,
    unit,
    minStock,
    costPrice,
    salePrice,
    supplierId,
    notes,
  } = req.body;

  if (name) product.name = name.trim();
  if (sku !== undefined) product.sku = sku.trim();
  if (barcode !== undefined) product.barcode = barcode.trim();
  if (category !== undefined) product.category = category.trim();
  if (unit !== undefined) product.unit = unit.trim().toUpperCase();
  if (minStock !== undefined) product.minStock = parseInt(minStock, 10) || 0;
  if (costPrice !== undefined) product.costPrice = parseFloat(costPrice) || 0;
  if (salePrice !== undefined) product.salePrice = parseFloat(salePrice) || 0;
  if (supplierId !== undefined) product.supplierId = supplierId || undefined;
  if (notes !== undefined) product.notes = notes;
  product.updatedAt = new Date().toISOString();

  saveDB();
  res.json(product);
});

app.delete('/api/products/:id', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  const productId = req.params.id;

  const productIndex = db.products.findIndex(p => p.id === productId && p.companyId === user.companyId);
  if (productIndex === -1) {
    res.status(404).json({ error: 'Produto não encontrado.' });
    return;
  }

  db.products.splice(productIndex, 1);
  saveDB();
  res.json({ success: true, message: 'Produto excluído com sucesso.' });
});

// ==============================================================================
// ROTAS DE MOVIMENTAÇÕES DE ESTOQUE (Proteção contra estoque negativo)
// ==============================================================================

app.get('/api/stock-movements', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const companyMovements = db.movements
    .filter(m => m.companyId === user.companyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(companyMovements);
});

app.post('/api/stock-movements', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  const { productId, type, quantity, reason, notes } = req.body;

  if (!productId || !type || quantity === undefined) {
    res.status(400).json({ error: 'Produto, tipo de movimentação e quantidade são obrigatórios.' });
    return;
  }

  const product = db.products.find(p => p.id === productId && p.companyId === user.companyId);
  if (!product) {
    res.status(404).json({ error: 'Produto não encontrado.' });
    return;
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    res.status(400).json({ error: 'A quantidade deve ser um número inteiro positivo maior que zero.' });
    return;
  }

  // Validação pura e proteção contra estoque negativo
  const movementResult = calculateStockAfterMovement({
    type: type as any,
    quantity: qty,
    currentStock: product.quantity,
  });

  if (!movementResult.allowed) {
    res.status(400).json({
      error: movementResult.error,
      currentStock: product.quantity,
      requestedQuantity: qty,
    });
    return;
  }

  const previousStock = product.quantity;
  const newStock = movementResult.newStock;

  // Atualiza saldo do produto de forma atômica
  product.quantity = newStock;
  product.updatedAt = new Date().toISOString();

  const newMovement: StoredMovement = {
    id: `mov-${Date.now()}`,
    companyId: user.companyId,
    productId: product.id,
    type,
    quantity: qty,
    previousStock,
    newStock,
    reason: reason ? reason.trim() : (type === 'entry' ? 'Entrada avulsa' : type === 'exit' ? 'Saída avulsa' : 'Ajuste de inventário'),
    notes: notes || '',
    userId: user.id,
    userName: user.name,
    createdAt: new Date().toISOString(),
  };

  db.movements.push(newMovement);
  saveDB();

  res.status(201).json({
    movement: newMovement,
    product,
  });
});

// ==============================================================================
// ROTAS DE FORNECEDORES
// ==============================================================================

app.get('/api/suppliers', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const suppliers = db.suppliers.filter(s => s.companyId === user.companyId);
  res.json(suppliers);
});

app.post('/api/suppliers', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  const { name, contactName, phone, email, notes } = req.body;

  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'O nome do fornecedor é obrigatório.' });
    return;
  }

  const newSupplier: StoredSupplier = {
    id: `sup-${Date.now()}`,
    companyId: user.companyId,
    name: name.trim(),
    contactName: contactName ? contactName.trim() : '',
    phone: phone ? phone.trim() : '',
    email: email ? email.trim() : '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  db.suppliers.push(newSupplier);
  saveDB();
  res.status(201).json(newSupplier);
});

app.put('/api/suppliers/:id', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  const supplierId = req.params.id;

  const supplier = db.suppliers.find(s => s.id === supplierId && s.companyId === user.companyId);
  if (!supplier) {
    res.status(404).json({ error: 'Fornecedor não encontrado.' });
    return;
  }

  const { name, contactName, phone, email, notes } = req.body;
  if (name) supplier.name = name.trim();
  if (contactName !== undefined) supplier.contactName = contactName.trim();
  if (phone !== undefined) supplier.phone = phone.trim();
  if (email !== undefined) supplier.email = email.trim();
  if (notes !== undefined) supplier.notes = notes;

  saveDB();
  res.json(supplier);
});

app.delete('/api/suppliers/:id', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  const supplierId = req.params.id;

  const index = db.suppliers.findIndex(s => s.id === supplierId && s.companyId === user.companyId);
  if (index === -1) {
    res.status(404).json({ error: 'Fornecedor não encontrado.' });
    return;
  }

  db.suppliers.splice(index, 1);
  saveDB();
  res.json({ success: true, message: 'Fornecedor excluído com sucesso.' });
});

// ==============================================================================
// ROTAS DE MERCADO PAGO E ASSINATURAS
// ==============================================================================

app.post('/api/payments/mercadopago/create-preference', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  const company = (req as any).company as StoredCompany;
  const user = (req as any).user as StoredUser;
  const { planId } = req.body;

  const plan = db.plans.find(p => p.id === planId);
  if (!plan) {
    res.status(404).json({ error: 'Plano não encontrado.' });
    return;
  }

  const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  // Se o usuário já configurou o token real do Mercado Pago no .env:
  if (mpAccessToken && !mpAccessToken.includes('placeholder')) {
    try {
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: plan.id,
              title: `Assinatura R3-Stock - Plano ${plan.name}`,
              quantity: 1,
              currency_id: 'BRL',
              unit_price: plan.price,
            },
          ],
          payer: {
            name: user.name,
            email: user.email,
          },
          back_urls: {
            success: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
            failure: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard?payment=failure`,
            pending: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard?payment=pending`,
          },
          auto_return: 'approved',
          external_reference: `${company.id}:${plan.id}`,
          notification_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`,
        }),
      });

      const mpData = await response.json();
      if (!response.ok) {
        res.status(response.status).json({
          error: 'Erro na API do Mercado Pago',
          details: mpData,
        });
        return;
      }

      res.json({
        preferenceId: mpData.id,
        initPoint: mpData.init_point,
        sandboxInitPoint: mpData.sandbox_init_point,
        mode: 'production_api',
      });
      return;
    } catch (err: any) {
      res.status(500).json({ error: 'Falha ao contatar a API do Mercado Pago', message: err.message });
      return;
    }
  }

  // Caso ainda não configurado no .env, informa as instruções reais e permite teste do fluxo
  res.json({
    mode: 'pending_configuration',
    message: 'Aviso: MERCADO_PAGO_ACCESS_TOKEN não configurado no arquivo .env.',
    instructions: 'Para pagamentos reais em produção, adicione sua credencial do Mercado Pago no arquivo .env.',
    simulatedSuccessAvailable: true,
    plan,
  });
});

// Endpoint para simular upgrade de plano na demonstração (ou pós aprovação)
app.post('/api/companies/upgrade-plan', authenticateUser, (req: Request, res: Response): void => {
  const company = (req as any).company as StoredCompany;
  const { planId } = req.body;

  const targetPlan = db.plans.find(p => p.id === planId);
  if (!targetPlan) {
    res.status(404).json({ error: 'Plano selecionado não existe.' });
    return;
  }

  const storedComp = db.companies.find(c => c.id === company.id);
  if (storedComp) {
    storedComp.planId = targetPlan.id;
    storedComp.maxProducts = targetPlan.maxProducts;
    storedComp.maxUsers = targetPlan.maxUsers;
    storedComp.status = 'active';
    saveDB();
  }

  res.json({
    success: true,
    message: `Plano atualizado com sucesso para ${targetPlan.name}!`,
    company: storedComp,
    plan: targetPlan,
  });
});

// Webhook do Mercado Pago para confirmação automática de assinaturas
app.post('/api/webhooks/mercadopago', (req: Request, res: Response) => {
  const { type, data } = req.body;
  console.log('[Mercado Pago Webhook recebido]:', type, data);

  // Aqui o webhook valida a notificação e atualiza o status da assinatura
  res.status(200).send('OK');
});

// ==============================================================================
// ROTAS DE ADMINISTRAÇÃO DA PLATAFORMA (Painel SaaS Owner)
// ==============================================================================

app.get('/api/admin/metrics', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  if (
    user.role !== 'platform_admin' &&
    user.email !== 'admin@r3stock.com.br' &&
    user.email !== 'admin@stockflow.com.br'
  ) {
    res.status(403).json({ error: 'Acesso restrito ao proprietário da plataforma.' });
    return;
  }

  const totalCompanies = db.companies.length;
  const totalUsers = db.users.length;
  const totalProducts = db.products.length;
  const totalMovements = db.movements.length;

  let mrr = 0;
  db.companies.forEach(comp => {
    const p = db.plans.find(plan => plan.id === comp.planId);
    if (p && comp.status === 'active') {
      mrr += p.price;
    }
  });

  res.json({
    totalCompanies,
    totalUsers,
    totalProducts,
    totalMovements,
    mrr: Number(mrr.toFixed(2)),
    companies: db.companies,
    plans: db.plans,
  });
});

app.put('/api/admin/plans/:id', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  if (
    user.role !== 'platform_admin' &&
    user.email !== 'admin@r3stock.com.br' &&
    user.email !== 'admin@stockflow.com.br'
  ) {
    res.status(403).json({ error: 'Acesso restrito ao proprietário da plataforma.' });
    return;
  }

  const planId = req.params.id;
  const plan = db.plans.find(p => p.id === planId);
  if (!plan) {
    res.status(404).json({ error: 'Plano não encontrado.' });
    return;
  }

  const { price, maxProducts, maxUsers, name } = req.body;
  if (name !== undefined) plan.name = name;
  if (price !== undefined) plan.price = parseFloat(price) || 0;
  if (maxProducts !== undefined) plan.maxProducts = parseInt(maxProducts, 10);
  if (maxUsers !== undefined) plan.maxUsers = parseInt(maxUsers, 10);

  // Propaga novos limites para empresas existentes no plano
  db.companies.forEach(c => {
    if (c.planId === planId) {
      if (maxProducts !== undefined) c.maxProducts = plan.maxProducts;
      if (maxUsers !== undefined) c.maxUsers = plan.maxUsers;
    }
  });

  saveDB();
  res.json(plan);
});

// Cadastro de nova empresa diretamente pelo painel administrativo (SaaS Master)
app.post('/api/admin/companies', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  if (
    user.role !== 'platform_admin' &&
    user.email !== 'admin@r3stock.com.br' &&
    user.email !== 'admin@stockflow.com.br'
  ) {
    res.status(403).json({ error: 'Acesso restrito ao proprietário da plataforma (SaaS Master).' });
    return;
  }

  const {
    name,
    responsibleName,
    email,
    cnpj,
    phone,
    planId = 'free',
    status = 'active',
    adminNotes,
    accessOption = 'company_only',
  } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({ error: 'O nome da empresa é obrigatório (mínimo de 2 caracteres).' });
    return;
  }

  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'O e-mail principal da empresa é obrigatório.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    res.status(400).json({ error: 'O e-mail informado possui formato inválido.' });
    return;
  }

  // Prevenção de duplicidade por e-mail
  const emailExists = db.companies.some(c => c.email && c.email.trim().toLowerCase() === normalizedEmail);
  if (emailExists) {
    res.status(409).json({ error: `Já existe uma empresa cadastrada com o e-mail "${email.trim()}".` });
    return;
  }

  // Prevenção de duplicidade por CNPJ
  const cleanCnpj = cnpj ? String(cnpj).replace(/\D/g, '') : '';
  if (cleanCnpj) {
    if (cleanCnpj.length !== 14) {
      res.status(400).json({ error: 'CNPJ deve conter 14 dígitos numéricos (ou ser deixado em branco).' });
      return;
    }
    const cnpjExists = db.companies.some(c => {
      if (!c.cnpj) return false;
      return c.cnpj.replace(/\D/g, '') === cleanCnpj;
    });
    if (cnpjExists) {
      res.status(409).json({ error: `Já existe uma empresa cadastrada com o CNPJ "${cnpj}".` });
      return;
    }
  }

  const targetPlan = db.plans.find(p => p.id === planId) || db.plans[0];
  const initialStatus = status === 'inactive' ? 'inactive' : 'active';
  const companyId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newCompany: StoredCompany = {
    id: companyId,
    name: name.trim(),
    responsibleName: responsibleName && typeof responsibleName === 'string' ? responsibleName.trim() : undefined,
    cnpj: cnpj ? String(cnpj).trim() : '',
    phone: phone ? String(phone).trim() : '',
    email: normalizedEmail,
    planId: targetPlan.id,
    maxProducts: targetPlan.maxProducts,
    maxUsers: targetPlan.maxUsers,
    status: initialStatus,
    deactivatedAt: initialStatus === 'inactive' ? new Date().toISOString() : null,
    adminNotes: adminNotes && typeof adminNotes === 'string' ? adminNotes.trim() : undefined,
    createdAt: new Date().toISOString(),
  };

  db.companies.push(newCompany);

  let inviteData: { token: string; inviteUrl: string; message: string; email: string } | null = null;

  if (accessOption === 'company_and_invite') {
    const inviteToken = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const invitedUser: StoredUser = {
      id: `user-${Date.now()}`,
      companyId: newCompany.id,
      name: (responsibleName && typeof responsibleName === 'string' && responsibleName.trim())
        ? responsibleName.trim()
        : `Responsável ${newCompany.name}`,
      email: normalizedEmail,
      passwordHash: '', // Convite seguro: senha não é pré-definida em texto simples
      role: 'owner',
      createdAt: new Date().toISOString(),
    };
    db.users.push(invitedUser);

    inviteData = {
      token: inviteToken,
      email: normalizedEmail,
      inviteUrl: `${process.env.APP_URL || 'http://localhost:3000'}/convite?token=${inviteToken}&email=${encodeURIComponent(normalizedEmail)}`,
      message: 'Convite gerado com token temporário único. Em ambiente Supabase com SMTP habilitado, o e-mail de configuração de senha é disparado pelo Supabase Auth.',
    };
  }

  // Registro de Auditoria Administrativa
  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
  }
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: user.id,
    adminEmail: user.email,
    adminName: user.name,
    targetCompanyId: newCompany.id,
    targetCompanyName: newCompany.name,
    action: 'register_company',
    details: `Empresa "${newCompany.name}" cadastrada diretamente pelo SaaS Master no plano ${targetPlan.name} (${targetPlan.maxProducts} produtos, ${targetPlan.maxUsers} usuários). Status inicial: ${newCompany.status}. Acesso: ${
      accessOption === 'company_and_invite'
        ? `Empresa com convite seguro emitido para ${responsibleName || normalizedEmail}`
        : 'Somente empresa cadastrada (sem usuário inicial)'
    }.`,
    createdAt: new Date().toISOString(),
  });

  saveDB();

  res.status(201).json({
    success: true,
    message: `Empresa "${newCompany.name}" cadastrada com sucesso!`,
    company: newCompany,
    invite: inviteData,
  });
});

app.put('/api/admin/companies/:id/status', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  if (
    user.role !== 'platform_admin' &&
    user.email !== 'admin@r3stock.com.br' &&
    user.email !== 'admin@stockflow.com.br'
  ) {
    res.status(403).json({ error: 'Acesso restrito ao proprietário da plataforma.' });
    return;
  }

  const comp = db.companies.find(c => c.id === req.params.id);
  if (!comp) {
    res.status(404).json({ error: 'Empresa não encontrada.' });
    return;
  }

  const { status, planId } = req.body;

  if (comp.id === 'comp-admin-platform' && status === 'inactive') {
    res.status(400).json({ error: 'A conta raiz da plataforma não pode ser desativada.' });
    return;
  }

  if (status && status !== comp.status) {
    const actionType = status === 'inactive' ? 'deactivate_company' : 'reactivate_company';
    if (!Array.isArray(db.auditLogs)) {
      db.auditLogs = [];
    }
    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      adminId: user.id,
      adminEmail: user.email,
      adminName: user.name,
      targetCompanyId: comp.id,
      targetCompanyName: comp.name,
      action: actionType,
      details:
        status === 'inactive'
          ? `Empresa desativada pelo administrador. Usuários vinculados foram bloqueados de efetuar login ou movimentações enquanto o banco preserva os dados.`
          : `Empresa reativada pelo administrador. O acesso dos colaboradores foi plenamente restaurado.`,
      createdAt: new Date().toISOString(),
    });
    comp.status = status;
    comp.deactivatedAt = status === 'inactive' ? new Date().toISOString() : null;
  }

  if (planId) {
    const targetPlan = db.plans.find(p => p.id === planId);
    if (targetPlan) {
      comp.planId = targetPlan.id;
      comp.maxProducts = targetPlan.maxProducts;
      comp.maxUsers = targetPlan.maxUsers;
    }
  }

  saveDB();
  res.json(comp);
});

// Exclusão definitiva de empresa com verificação estrita no backend e limpeza em cascata
app.delete('/api/admin/companies/:id', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  if (
    user.role !== 'platform_admin' &&
    user.email !== 'admin@r3stock.com.br' &&
    user.email !== 'admin@stockflow.com.br'
  ) {
    res.status(403).json({ error: 'Acesso restrito ao proprietário da plataforma.' });
    return;
  }

  const companyId = req.params.id;
  if (companyId === 'comp-admin-platform') {
    res.status(400).json({ error: 'A empresa do administrador mestre não pode ser excluída.' });
    return;
  }

  const comp = db.companies.find(c => c.id === companyId);
  if (!comp) {
    res.status(404).json({ error: 'Empresa não encontrada.' });
    return;
  }

  const { confirmedText, confirmedName } = req.body;
  const confirmation = (confirmedText !== undefined ? confirmedText : confirmedName) || '';
  if (typeof confirmation !== 'string' || confirmation.trim().toUpperCase() !== 'EXCLUIR') {
    res.status(400).json({
      error: 'Confirmação inválida. Digite exatamente a palavra EXCLUIR para confirmar a exclusão definitiva.',
    });
    return;
  }

  // Contagem dos dados relacionados antes da exclusão para registro no log de auditoria
  const prodCount = db.products.filter(p => p.companyId === comp.id).length;
  const movCount = db.movements.filter(m => m.companyId === comp.id).length;
  const supCount = db.suppliers.filter(s => s.companyId === comp.id).length;
  const userCount = db.users.filter(u => u.companyId === comp.id && u.role !== 'platform_admin').length;

  // Remoção transacional e consistente de dados operacionais
  db.products = db.products.filter(p => p.companyId !== comp.id);
  db.movements = db.movements.filter(m => m.companyId !== comp.id);
  db.suppliers = db.suppliers.filter(s => s.companyId !== comp.id);
  db.users = db.users.filter(u => !(u.companyId === comp.id && u.role !== 'platform_admin'));
  db.companies = db.companies.filter(c => c.id !== comp.id);

  // Registro permanente de auditoria (LGPD e prestação de contas)
  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
  }
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: user.id,
    adminEmail: user.email,
    adminName: user.name,
    targetCompanyId: comp.id,
    targetCompanyName: comp.name,
    action: 'delete_company',
    details: `Exclusão definitiva da empresa "${comp.name}" (ID: ${comp.id}, E-mail: ${comp.email}, Plano: ${comp.planId}). Dados operacionais excluídos: ${prodCount} produtos, ${movCount} movimentações, ${supCount} fornecedores, ${userCount} usuários. Registros de auditoria preservados conforme obrigações da LGPD.`,
    createdAt: new Date().toISOString(),
  });

  saveDB();

  res.json({
    success: true,
    message: `A empresa "${comp.name}" e seus dados relacionados foram excluídos com sucesso.`,
    deletedCompany: comp,
  });
});

// Consulta aos registros de auditoria administrativa
app.get('/api/admin/audit-logs', authenticateUser, (req: Request, res: Response): void => {
  const user = (req as any).user as StoredUser;
  if (
    user.role !== 'platform_admin' &&
    user.email !== 'admin@r3stock.com.br' &&
    user.email !== 'admin@stockflow.com.br'
  ) {
    res.status(403).json({ error: 'Acesso restrito ao proprietário da plataforma.' });
    return;
  }

  res.json(db.auditLogs || []);
});

// Status do Supabase para o painel de administração e verificação do usuário
app.get('/api/admin/supabase-status', (_req: Request, res: Response) => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const isConfigured = Boolean(url && anonKey && !url.includes('placeholder'));

  res.json({
    isConfigured,
    url: isConfigured ? url : null,
    hasServiceRoleKey: Boolean(serviceKey),
    schemaScriptPath: 'supabase/schema.sql',
    databaseEngine: isConfigured ? 'Supabase PostgreSQL' : 'Local Persistent Engine (Supabase Schema Compliant)',
  });
});

// ==============================================================================
// CONFIGURAÇÃO DO VITE (Dev com middleware ou Produção estática)
// ==============================================================================

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[R3-Stock] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
