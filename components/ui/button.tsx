import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'default';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const variantCls =
      variant === 'outline'
        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        : 'bg-blue-600 text-white hover:bg-blue-700';
    const sizeCls = size === 'sm' ? 'h-8 px-2 text-sm' : 'h-10 px-4';
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md ${variantCls} ${sizeCls} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
