import * as React from 'react';

interface PopoverContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextType | null>(null);

export function Popover({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <PopoverContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ asChild = false, children }: { asChild?: boolean; children: React.ReactElement }) {
  const ctx = React.useContext(PopoverContext)!;
  if (asChild) {
    return React.cloneElement(children, {
      onClick: () => ctx.setOpen(!ctx.open),
    });
  }
  return (
    <button onClick={() => ctx.setOpen(!ctx.open)}>{children}</button>
  );
}

export function PopoverContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(PopoverContext)!;
  if (!ctx.open) return null;
  return (
    <div className={`absolute z-50 mt-2 rounded-md border bg-white p-2 shadow-md ${className}`}>
      {children}
    </div>
  );
}
