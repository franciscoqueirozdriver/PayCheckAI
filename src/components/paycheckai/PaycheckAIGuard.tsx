'use client';

import React, { ReactNode } from 'react';
import { usePaycheckAIPermissions } from '@/src/providers/paycheckai/PermissionsAdapter';

interface PaycheckAIGuardProps {
  children: ReactNode;
}

const AccessDenied = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h1 className="text-2xl font-bold">Acesso Negado</h1>
      <p className="text-gray-600">Você não tem permissão para acessar este módulo.</p>
    </div>
  </div>
);

export const PaycheckAIGuard = ({ children }: PaycheckAIGuardProps) => {
  const { temPermissao } = usePaycheckAIPermissions();
  const canAccess = temPermissao('paycheckai-module');

  if (!canAccess) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};
