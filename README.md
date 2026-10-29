# R3-Stock — Sistema SaaS Inteligente para Gestão de Estoque

<div align="center">
  <h3>Plataforma SaaS Profissional Multi-Empresa para Gestão de Estoque, Inventário e Fornecedores</h3>
  <p>Construído com React, TypeScript, Tailwind CSS, PostgreSQL / Supabase e Integração de Pagamentos com Mercado Pago.</p>
</div>

---

## 📦 Sobre o R3-Stock

O **R3-Stock** é uma solução completa para controle de inventário voltada a comércios, distribuidores e pequenas e médias empresas. Ele oferece isolamento estrito multi-empresa com **Row-Level Security (RLS)**, catálogo de produtos com cálculo automático de margem de lucro, prevenção incondicional contra estoque negativo e controle de assinaturas em camadas (**Free**, **Pro** e **Business**).

### Pilares R3:
- **R**astreabilidade: Auditoria rigorosa de cada entrada, saída e ajuste com operador e data/hora.
- **R**obustez: Bloqueio no backend de estoque negativo e validação de limites de plano antes de gravar dados.
- **R**endimento: Indicadores em tempo real de lucratividade, margem bruta média e capital investido.

---

## ⚡ Funcionalidades Principais

- **🏢 Multi-Tenancy & Segurança:** Cada empresa tem seus dados 100% isolados através de `company_id` e políticas RLS no PostgreSQL (Supabase).
- **📊 Dashboard em Tempo Real:** Indicadores de saldo patrimonial a preço de custo e venda, total de produtos (SKUs), movimentações mensais e alertas de estoque crítico.
- **📦 Catálogo de Produtos:** Cadastro completo com SKU, código de barras EAN, unidade de medida, estoque mínimo e cálculo dinâmico da margem de lucro.
- **🛡️ Prevenção Anti-Estoque Negativo:** Operações de saída que excedem o saldo disponível são bloqueadas no backend.
- **🔄 Auditoria & Histórico de Movimentações:** Rastreamento de entradas, saídas e balanços com justificativa e responsável.
- **🚚 Gestão de Fornecedores:** Vínculo de fornecedores com produtos, dados de contato e condições comerciais.
- **📑 Relatórios com Exportação CSV:** 4 relatórios consolidados com formatação brasileira (separador `;` e encoding UTF-8 com BOM para Excel).
- **💳 Planos & Mercado Pago:**
  - **FREE:** Até 50 produtos e 1 usuário (R$ 0/mês).
  - **PRO:** Até 1.000 produtos e 5 usuários (R$ 39,90/mês).
  - **BUSINESS:** Até 5.000 produtos e 15 usuários (R$ 79,90/mês).
  - Endpoints prontos para checkout e webhooks do Mercado Pago.
- **👑 Painel SaaS Owner:** Portal exclusivo do proprietário para acompanhar MRR, editar preços de planos e gerenciar tenants.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons.
- **Backend:** Node.js, Express, TSX, Vite Middleware.
- **Banco de Dados:** PostgreSQL com Supabase Client / Local Persistence Layer com RLS.
- **Pagamentos:** Mercado Pago API (Preferences & Webhooks).

---

## 🚀 Como Executar Localmente

### 1. Clonar e Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha suas variáveis se desejar conectar serviços externos:
```env
# Supabase (Opcional - caso utilize projeto remoto)
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-anon"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role"

# Mercado Pago (Opcional - para assinaturas reais em produção)
MERCADO_PAGO_ACCESS_TOKEN="APP_USR-..."
```

### 3. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`.

---

## 🗄️ Esquema do Banco de Dados PostgreSQL (Supabase)

O arquivo `supabase/schema.sql` contém a estrutura completa de DDL, incluindo:
- `plans` (planos da plataforma e limites)
- `companies` (empresas / organizações cadastradas)
- `profiles` (perfis de usuários vinculados ao auth.users)
- `suppliers` (fornecedores)
- `products` (produtos em estoque)
- `stock_movements` (histórico de auditoria)
- `subscriptions` (assinaturas Mercado Pago)
- Políticas de Row-Level Security (RLS) habilitadas em todas as tabelas.

---

## 📄 Licença

Distribuído sob a licença Apache 2.0. Consulte o arquivo de licença para mais informações.
