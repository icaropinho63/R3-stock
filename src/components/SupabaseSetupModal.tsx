import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  Copy,
  AlertCircle,
  X,
  ExternalLink,
  Shield,
  FileCode,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [schemaSql, setSchemaSql] = useState<string>('');
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/supabase-status')
        .then(res => res.json())
        .then(data => setStatus(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sampleSqlSnippet = `-- R3-Stock - Script RLS PostgreSQL
-- Execute este script no SQL Editor do seu projeto Supabase:
-- Arquivo completo disponível em /supabase/schema.sql no repositório.

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  plan_id VARCHAR(32) NOT NULL DEFAULT 'free',
  max_products INTEGER NOT NULL DEFAULT 50,
  max_users INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sampleSqlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Configuração & Status do Supabase (PostgreSQL)
            </h2>
            <p className="text-xs text-slate-500">
              Arquitetura Multi-Tenant com Row Level Security (RLS) e Supabase Auth
            </p>
          </div>
        </div>

        {/* Status da Conexão */}
        <div
          className={`mb-5 rounded-xl border p-4 text-xs ${
            isSupabaseConfigured
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-blue-200 bg-blue-50/80 text-blue-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {isSupabaseConfigured ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
            )}
            <div>
              <p className="font-bold text-sm">
                {isSupabaseConfigured
                  ? 'Conexão Supabase Ativa em Produção!'
                  : 'Motor de Armazenamento Local Ativo (100% Compatível com Supabase Schema)'}
              </p>
              <p className="mt-1 leading-relaxed">
                {isSupabaseConfigured
                  ? `Seu app está conectado diretamente ao Supabase em ${status?.url}.`
                  : 'O R3-Stock está rodando com o motor persistente multi-empresa com esquema idêntico ao PostgreSQL/Supabase. Os dados são salvos em disco e todas as regras de planos e estoque negativo estão ativas.'}
              </p>
            </div>
          </div>
        </div>

        {/* Passo a Passo de Configuração */}
        <div className="space-y-4 text-xs text-slate-600">
          <h3 className="font-bold text-slate-900 text-sm">
            Como conectar seu projeto Supabase remoto:
          </h3>

          <ol className="list-decimal pl-4 space-y-2">
            <li>
              Crie um novo projeto gratuito em{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                supabase.com <ExternalLink className="h-3 w-3" />
              </a>.
            </li>
            <li>
              Acesse o <strong>SQL Editor</strong> no painel do Supabase e execute o script{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">
                supabase/schema.sql
              </code>{' '}
              (já gerado e salvo no projeto com tabelas, índices e políticas RLS).
            </li>
            <li>
              Em <strong>Project Settings → API</strong>, copie a <em>Project URL</em> e a <em>anon public key</em>.
            </li>
            <li>
              Adicione as variáveis no arquivo <code>.env</code>:
              <pre className="mt-1 rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-slate-200 overflow-x-auto">
{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui`}
              </pre>
            </li>
          </ol>

          {/* Destaque do Row-Level Security */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Garantia de Isolamento Multi-Empresa com RLS</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Cada registro de produto, fornecedor ou movimentação está atrelado a um <code>company_id</code>. O PostgreSQL impede no nível do banco que qualquer usuário acesse dados de outra organização, garantindo conformidade com a LGPD e privacidade total.
            </p>
          </div>

          {/* Prévia do Script SQL com Botão Copiar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-slate-500" />
                <span>Script SQL de Migração (supabase/schema.sql)</span>
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
              >
                <Copy className="h-3 w-3" />
                <span>{copied ? 'Copiado!' : 'Copiar Trecho SQL'}</span>
              </button>
            </div>
            <pre className="max-h-36 overflow-y-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-400">
              {sampleSqlSnippet}
            </pre>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
