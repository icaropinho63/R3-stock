import React from 'react';

interface R3StockLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'dark' | 'light';
}

export const R3StockLogo: React.FC<R3StockLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'dark',
}) => {
  // Configurações de dimensão
  const sizeMap = {
    sm: { box: 'h-8 w-8', text: 'text-base', sub: 'text-[9px]' },
    md: { box: 'h-10 w-10', text: 'text-xl', sub: 'text-[10px]' },
    lg: { box: 'h-12 w-12', text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'h-16 w-16', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Símbolo do Logotipo: Combinação da Letra R + Número 3 em Caixas de Estoque Isométricas */}
      <div
        className={`relative flex ${currentSize.box} items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-1.5 shadow-md shadow-blue-600/25 ring-1 ring-white/20`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          {/* Caixa Isométrica / Base de Estoque Nível 1 */}
          <path
            d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
            fill="url(#cube_grad_base)"
            opacity="0.3"
          />

          {/* 3 Prateleiras / Níveis Modulares de Estoque (Representando o 3 de R3) */}
          <path
            d="M6 14L24 24L42 14"
            stroke="#93C5FD"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 24L24 34L42 24"
            stroke="#60A5FA"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 24V44"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Letra R estilizada integrada ao lado esquerdo da caixa */}
          <path
            d="M14 11V31M14 11H22C24.5 11 26 12.5 26 15C26 17.5 24.5 19 22 19H14M20 19L26 31"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Número 3 estilizado integrado ao lado direito com gradiente luminoso */}
          <path
            d="M27 13H35L30 19C33 19 35.5 20.5 35.5 23.5C35.5 27 32.5 29 28 29"
            stroke="#38BDF8"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <defs>
            <linearGradient id="cube_grad_base" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E40AF" />
              <stop offset="1" stopColor="#312E81" />
            </linearGradient>
          </defs>
        </svg>

        {/* Indicador de Status / Nível Ativo */}
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500 ring-2 ring-white"></span>
        </span>
      </div>

      {/* Tipografia da Marca R3-Stock */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center tracking-tight">
            <span
              className={`font-black ${currentSize.text} tracking-tight ${
                variant === 'light' ? 'text-white' : 'text-slate-900'
              }`}
            >
              R3<span className="text-blue-600">-Stock</span>
            </span>
          </div>
          <span
            className={`font-semibold tracking-wider uppercase ${currentSize.sub} ${
              variant === 'light' ? 'text-blue-200' : 'text-slate-500'
            }`}
          >
            Gestão Inteligente de Estoque
          </span>
        </div>
      )}
    </div>
  );
};
