import React from 'react';
import { Button } from '../ui/Button';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border-strong bg-surface/50">
      <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4 border border-border-subtle shadow-sm">
        {Icon && <Icon className="w-8 h-8 text-muted" />}
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2 tracking-tight">{title}</h3>
      <p className="text-muted text-sm max-w-sm mb-6 leading-relaxed">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
