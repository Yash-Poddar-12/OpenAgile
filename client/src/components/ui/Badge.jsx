import React from 'react';

export const Badge = ({ className = '', variant = 'default', children, ...props }) => {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-border-strong focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'border-transparent bg-primary text-inverse hover:bg-accent-hover',
    secondary: 'border-transparent bg-surface-hover text-primary hover:bg-border-subtle',
    outline: 'border-border-strong text-primary',
    success: 'border-transparent bg-accent-green/20 text-accent-green hover:bg-accent-green/30 px-2 py-0.5',
    danger: 'border-transparent bg-accent-red/20 text-accent-red hover:bg-accent-red/30 px-2 py-0.5',
    warning: 'border-transparent bg-accent-orange/20 text-accent-orange hover:bg-accent-orange/30 px-2 py-0.5',
    blue: 'border-transparent bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 px-2 py-0.5',
  };

  const activeVariant = variants[variant] || variants.default;

  return (
    <div className={`${baseStyles} ${activeVariant} ${className}`} {...props}>
      {children}
    </div>
  );
};
