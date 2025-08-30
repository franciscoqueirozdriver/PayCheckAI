import * as React from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      {children}
    </div>
  );
}

export function DialogContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

export function DialogHeader({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function DialogFooter({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
