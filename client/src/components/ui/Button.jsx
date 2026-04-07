import React from 'react';

export const Button = React.forwardRef(({ 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors-fast focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-primary text-inverse hover:bg-accent-hover focus:ring-primary',
    secondary: 'bg-surface hover:bg-surface-hover text-primary border border-border-strong focus:ring-border-strong',
    ghost: 'bg-transparent hover:bg-surface-hover text-primary focus:ring-border-subtle',
    danger: 'bg-accent-red text-white hover:opacity-90 focus:ring-accent-red',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-8 text-base',
    icon: 'h-9 w-9',
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${currentVariant} ${currentSize} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
