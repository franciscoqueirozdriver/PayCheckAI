import * as React from 'react';

export function Command({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function CommandInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full border-b px-2 py-1 text-sm ${className}`} {...props} />;
}

export function CommandList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`max-h-60 overflow-y-auto ${className}`}>{children}</div>;
}

export function CommandItem({ onSelect, children, className = '' }: { onSelect: () => void; children: React.ReactNode; className?: string; value?: string }) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer px-2 py-1 text-sm hover:bg-gray-100 ${className}`}
    >
      {children}
    </div>
  );
}

export function CommandEmpty({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-1 text-sm text-gray-500">{children}</div>;
}

export function CommandGroup({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
