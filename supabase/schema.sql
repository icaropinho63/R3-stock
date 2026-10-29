-- ==============================================================================
-- R3-Stock - Esquema Completo do Banco de Dados PostgreSQL para Supabase
-- Sistema SaaS de Gerenciamento de Estoque Multi-Empresa com RLS e Planos
-- ==============================================================================

-- 1. Habilitar UUID caso não esteja habilitado
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Planos da Plataforma
CREATE TABLE IF NOT EXISTS public.plans (
  id VARCHAR(32) PRIMARY KEY, -- 'free', 'pro', 'business'
  name VARCHAR(64) NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  max_products INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir planos padrão do R3-Stock
INSERT INTO public.plans (id, name, price, billing_cycle, max_products, max_users, features)
VALUES
  ('free', 'Free', 0.00, 'monthly', 50, 1, '["Até 50 produtos", "1 usuário", "Controle de estoque básico", "Dashboard em tempo real", "Relatórios básicos"]'::jsonb),
  ('pro', 'Pro', 39.90, 'monthly', 1000, 5, '["Até 1.000 produtos", "5 usuários colaboradores", "Relatórios avançados", "Importação e exportação CSV", "Gestão completa de fornecedores", "Indicadores financeiros de margem"]'::jsonb),
  ('business', 'Business', 79.90, 'monthly', 5000, 15, '["Até 5.000 produtos", "15 usuários colaboradores", "Todos os recursos do Pro", "Permissões avançadas por cargo", "Relatórios completos com auditoria", "Suporte prioritário"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  max_products = EXCLUDED.max_products,
  max_users = EXCLUDED.max_users,
  features = EXCLUDED.features;

-- 3. Tabela de Empresas (Tenants)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  responsible_name VARCHAR(255),
  cnpj VARCHAR(20),
  phone VARCHAR(30),
  email VARCHAR(255),
  plan_id VARCHAR(32) NOT NULL DEFAULT 'free' REFERENCES public.plans(id),
  max_products INTEGER NOT NULL DEFAULT 50,
  max_users INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'past_due', 'canceled')),
  deactivated_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Perfis de Usuários (Extensão de auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'owner', -- 'owner', 'admin', 'employee', 'platform_admin'
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  phone VARCHAR(30),
  email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabela de Produtos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(64),
  barcode VARCHAR(64),
  category VARCHAR(100) NOT NULL DEFAULT 'Geral',
  unit VARCHAR(20) NOT NULL DEFAULT 'UN',
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock INTEGER NOT NULL DEFAULT 5,
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_company_sku UNIQUE (company_id, sku)
);

-- 7. Tabela de Movimentações de Estoque (Histórico e Auditoria)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('entry', 'exit', 'adjustment')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL CHECK (new_stock >= 0),
  reason VARCHAR(255) NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Tabela de Assinaturas & Mercado Pago
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id VARCHAR(32) NOT NULL REFERENCES public.plans(id),
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'pending', 'canceled'
  mercadopago_subscription_id VARCHAR(255),
  mercadopago_payer_id VARCHAR(255),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Tabela de Logs de Auditoria Administrativa (LGPD & Ações do Dono da Plataforma)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email VARCHAR(255) NOT NULL,
  admin_name VARCHAR(255) NOT NULL,
  target_company_id VARCHAR(255) NOT NULL,
  target_company_name VARCHAR(255) NOT NULL,
  action VARCHAR(64) NOT NULL, -- 'deactivate_company', 'reactivate_company', 'delete_company'
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Row-Level Security (RLS) - Isolamento Estrito entre Empresas
-- ==============================================================================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter a empresa do usuário autenticado no Supabase
CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Planos: Qualquer um pode consultar (leitura pública dos planos)
CREATE POLICY "Planos visíveis publicamente"
  ON public.plans FOR SELECT USING (true);

-- Empresas: Usuário pode ver apenas sua própria empresa
CREATE POLICY "Empresas visíveis apenas por seus membros"
  ON public.companies FOR SELECT
  USING (id = public.get_auth_company_id());

CREATE POLICY "Empresas editáveis apenas pelo proprietário"
  ON public.companies FOR UPDATE
  USING (id = public.get_auth_company_id());

-- Perfis: Usuários podem ver perfis de sua própria empresa
CREATE POLICY "Perfis visíveis apenas da mesma empresa"
  ON public.profiles FOR SELECT
  USING (company_id = public.get_auth_company_id() OR id = auth.uid());

CREATE POLICY "Usuário pode atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Fornecedores: Isolamento por company_id
CREATE POLICY "Fornecedores da própria empresa"
  ON public.suppliers FOR ALL
  USING (company_id = public.get_auth_company_id())
  WITH CHECK (company_id = public.get_auth_company_id());

-- Produtos: Isolamento por company_id
CREATE POLICY "Produtos da própria empresa"
  ON public.products FOR ALL
  USING (company_id = public.get_auth_company_id())
  WITH CHECK (company_id = public.get_auth_company_id());

-- Movimentações: Isolamento por company_id
CREATE POLICY "Movimentações da própria empresa"
  ON public.stock_movements FOR ALL
  USING (company_id = public.get_auth_company_id())
  WITH CHECK (company_id = public.get_auth_company_id());

-- Assinaturas: Isolamento por company_id
CREATE POLICY "Assinaturas da própria empresa"
  ON public.subscriptions FOR SELECT
  USING (company_id = public.get_auth_company_id());

-- ==============================================================================
-- Índices para Performance de Consultas
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_company_category ON public.products(company_id, category);
CREATE INDEX IF NOT EXISTS idx_products_company_sku ON public.products(company_id, sku);
CREATE INDEX IF NOT EXISTS idx_movements_company_date ON public.stock_movements(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON public.suppliers(company_id);
