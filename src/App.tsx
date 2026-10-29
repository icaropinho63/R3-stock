import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { MovementsView } from './components/MovementsView';
import { SuppliersView } from './components/SuppliersView';
import { ReportsView } from './components/ReportsView';
import { PlansView } from './components/PlansView';
import { AdminPlatformView } from './components/AdminPlatformView';
import { StockMovementModal } from './components/StockMovementModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { Product, StockMovement, Supplier, Plan } from './types';

function MainApp() {
  const { user, company, plan, token, loading: authLoading, loginAsDemo } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modais globais
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authPlanId, setAuthPlanId] = useState<string>('free');

  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'entry' | 'exit' | 'adjustment'>('entry');
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);

  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // Estados dos dados da empresa autenticada
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Carregar planos disponíveis
  useEffect(() => {
    fetch('/api/plans')
      .then(res => res.json())
      .then(data => setPlans(data))
      .catch(() => {});
  }, []);

  // Suporte a autostart (?autostart=1) para pular direto para o dashboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !user && !token) {
      loginAsDemo('demo');
    }
  }, [user, token]);

  // Carregar dados quando usuário autenticado
  const fetchTenantData = async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [prodsRes, movsRes, supsRes] = await Promise.all([
        fetch('/api/products', { headers }),
        fetch('/api/stock-movements', { headers }),
        fetch('/api/suppliers', { headers }),
      ]);

      if (prodsRes.ok) setProducts(await prodsRes.json());
      if (movsRes.ok) setMovements(await movsRes.json());
      if (supsRes.ok) setSuppliers(await supsRes.json());
    } catch (err) {
      console.error('Erro ao carregar dados do tenant:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchTenantData();
    } else {
      setProducts([]);
      setMovements([]);
      setSuppliers([]);
    }
  }, [user, token]);

  // Handlers para Produtos
  const handleSaveProduct = async (
    productData: any,
    isEdit: boolean,
    id?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const url = isEdit ? `/api/products/${id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro ao salvar produto.' };
      }

      await fetchTenantData();
      return { success: true };
    } catch {
      return { success: false, error: 'Erro de conexão com o servidor.' };
    }
  };

  const handleDeleteProduct = async (
    productId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro ao excluir.' };
      }
      await fetchTenantData();
      return { success: true };
    } catch {
      return { success: false, error: 'Erro de conexão.' };
    }
  };

  // Handler para Movimentação de Estoque
  const handleRegisterMovement = async (data: {
    productId: string;
    type: 'entry' | 'exit' | 'adjustment';
    quantity: number;
    reason: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Erro ao registrar movimentação.' };
      }

      await fetchTenantData();
      return { success: true };
    } catch {
      return { success: false, error: 'Erro de conexão.' };
    }
  };

  // Handlers para Fornecedores
  const handleSaveSupplier = async (
    supplierData: any,
    isEdit: boolean,
    id?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const url = isEdit ? `/api/suppliers/${id}` : '/api/suppliers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(supplierData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro ao salvar fornecedor.' };
      }

      await fetchTenantData();
      return { success: true };
    } catch {
      return { success: false, error: 'Erro de conexão.' };
    }
  };

  const handleDeleteSupplier = async (
    supplierId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchTenantData();
        return { success: true };
      }
      return { success: false, error: 'Falha ao excluir.' };
    } catch {
      return { success: false, error: 'Erro de conexão.' };
    }
  };

  // Abrir modal de movimentação com contexto
  const handleOpenMovement = (type?: 'entry' | 'exit' | 'adjustment', product?: Product) => {
    setMovementType(type || 'entry');
    setMovementProduct(product || null);
    setMovementModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 font-sans text-xs">
        Iniciando R3-Stock SaaS...
      </div>
    );
  }

  // Se não estiver logado, exibe a Landing Page profissional
  if (!user) {
    return (
      <>
        <LandingPage
          plans={plans}
          onStartFree={planId => {
            setAuthMode('register');
            setAuthPlanId(planId || 'free');
            setAuthModalOpen(true);
          }}
          onLogin={() => {
            setAuthMode('login');
            setAuthModalOpen(true);
          }}
          onDemoLogin={type => loginAsDemo(type)}
        />

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
          initialPlanId={authPlanId}
          plans={plans}
        />
      </>
    );
  }

  // Usuário Autenticado: Renderiza Dashboard e Módulos do Sistema
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* Menu Lateral Responsivo */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentProductCount={products.length}
        onOpenPlans={() => setActiveTab('plans')}
        onOpenSupabase={() => setSupabaseModalOpen(true)}
      />

      {/* Conteúdo Principal */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onOpenPlans={() => setActiveTab('plans')}
          onOpenSupabaseStatus={() => setSupabaseModalOpen(true)}
          currentProductCount={products.length}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === 'dashboard' && (
              <DashboardView
                products={products}
                movements={movements}
                company={company}
                plan={plan}
                onOpenNewProduct={() => setActiveTab('products')}
                onOpenMovement={handleOpenMovement}
                onNavigateToProducts={() => setActiveTab('products')}
                onNavigateToMovements={() => setActiveTab('movements')}
                onOpenPlans={() => setActiveTab('plans')}
              />
            )}

            {activeTab === 'products' && (
              <ProductsView
                products={products}
                suppliers={suppliers}
                company={company}
                plan={plan}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onOpenMovement={handleOpenMovement}
                onOpenPlans={() => setActiveTab('plans')}
              />
            )}

            {activeTab === 'movements' && (
              <MovementsView
                movements={movements}
                products={products}
                onOpenMovementModal={handleOpenMovement}
              />
            )}

            {activeTab === 'suppliers' && (
              <SuppliersView
                suppliers={suppliers}
                products={products}
                onSaveSupplier={handleSaveSupplier}
                onDeleteSupplier={handleDeleteSupplier}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                products={products}
                movements={movements}
                suppliers={suppliers}
              />
            )}

            {activeTab === 'plans' && (
              <PlansView
                plans={plans}
                company={company}
                currentProductCount={products.length}
                onUpgradeSuccess={fetchTenantData}
              />
            )}

            {activeTab === 'admin' && <AdminPlatformView />}
          </div>
        </main>
      </div>

      {/* Modal de Movimentações de Estoque */}
      <StockMovementModal
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        products={products}
        initialType={movementType}
        initialProduct={movementProduct}
        onRegisterMovement={handleRegisterMovement}
      />

      {/* Modal de Status e Guia do Supabase */}
      <SupabaseSetupModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
