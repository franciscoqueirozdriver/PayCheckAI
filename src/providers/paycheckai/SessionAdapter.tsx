'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Define the shape of the user/session object
interface MockUser {
  id: string;
  name: string;
  email?: string;
}

interface SessionContextType {
  user: MockUser | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
}

// Create the context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// The provider component
export const PaycheckAISessionProvider = ({ children }: { children: ReactNode }) => {
  // MOCK IMPLEMENTATION
  // This simulates a session from a parent system without using NextAuth.
  // In a real integration, this would get the user data from the actual
  // session provider of the main application.
  const mockSession: SessionContextType = {
    user: {
      id: 'anon-dev-user',
      name: 'Dev User',
      email: 'dev@example.com',
    },
    status: 'authenticated',
  };

  return (
    <SessionContext.Provider value={mockSession}>
      {children}
    </SessionContext.Provider>
  );
};

// The custom hook
export const usePaycheckAISession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    // In a real app, you might not want to throw an error, but for this
    // decoupled module, it makes sense to enforce the provider's presence.
    throw new Error('usePaycheckAISession must be used within a PaycheckAISessionProvider');
  }
  return context;
};
