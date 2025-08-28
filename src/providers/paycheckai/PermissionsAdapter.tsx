'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Define the shape of the permissions context
interface PermissionsContextType {
  temPermissao: (feature: string) => boolean;
  // In a real system, you might have user roles, etc.
  // role: 'admin' | 'user' | 'guest';
}

// Create the context with a default (non-functional) value
const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// The provider component
export const PaycheckAIPermissionsProvider = ({ children }: { children: ReactNode }) => {
  // MOCK IMPLEMENTATION
  // In a real system, this would check against a user's roles/permissions
  // fetched from an API or session.
  const temPermissao = (feature: string): boolean => {
    if (feature === 'paycheckai-module') {
      // This simulates a feature flag. For this integration, we'll assume
      // it's always on. It could be controlled by an environment variable.
      return process.env.NEXT_PUBLIC_FEATURE_PAYCHECKAI_ENABLED === 'true' || true;
    }
    // Deny other features by default in this mock
    return false;
  };

  const value = { temPermissao };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

// The custom hook to be used by components
export const usePaycheckAIPermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePaycheckAIPermissions must be used within a PaycheckAIPermissionsProvider');
  }
  return context;
};
