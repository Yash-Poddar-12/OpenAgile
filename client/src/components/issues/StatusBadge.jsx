import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const StatusBadge = ({ status = 'ToDo', size = 'md', editable = false, onChange }) => {
  const isSmall = size === 'sm';
  const padding = isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  const styles = {
    ToDo: { bg: 'bg-[#2A2A3E]', text: 'text-[#E2E8F0]', label: 'ToDo' },
    InProgress: { bg: 'bg-[#4F8EF7]/20', text: 'text-[#4F8EF7]', label: 'In Progress' },
    Review: { bg: 'bg-[#F59E0B]/20', text: 'text-[#F59E0B]', label: 'Review' },
    Done: { bg: 'bg-[#10B981]/20', text: 'text-[#10B981]', label: 'Done' }
  };

  const config = styles[status] || styles.ToDo;

  const allowedTransitions = {
    ToDo: ['ToDo', 'InProgress'],
    InProgress: ['InProgress', 'Review', 'ToDo'],
    Review: ['Review', 'Done', 'InProgress'],
    Done: ['Done', 'ToDo', 'InProgress', 'Review'],
  };

  const allowedOptions = allowedTransitions[status] || [status];

  if (editable && onChange) {
    return (
      <div className="relative inline-block group">
        <select
          value={status}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none rounded-md font-medium pr-6 ${padding} ${config.bg} ${config.text} cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue transition-all border-none`}
        >
          {allowedOptions.map(opt => (
            <option key={opt} value={opt} className="bg-card text-white">
              {styles[opt].label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
          <ChevronDown className={`w-3 h-3 ${config.text}`} />
        </div>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-md font-medium ${padding} ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
