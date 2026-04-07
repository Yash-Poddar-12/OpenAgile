import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import PriorityBadge from '../issues/PriorityBadge';

const KanbanCard = ({ issue, users = [], onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.issueId, data: { issue } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const assigneeName = users.find(u => u.userId === issue.assigneeId)?.name || issue.assigneeId;

  // Top border mapping based on priority
  const priorityBorderColors = {
    High: 'border-t-[#EF4444]',
    Medium: 'border-t-[#F59E0B]',
    Low: 'border-t-[#6B7280]',
  };
  const topBorderClass = priorityBorderColors[issue.priority] || priorityBorderColors.Medium;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick(issue)}
      className={`group relative bg-[#1A1A2E] rounded-lg p-3.5 shadow-sm border border-[#2A2A3E] border-t-2 ${topBorderClass} hover:border-[#3B82F6] hover:shadow-card cursor-pointer transition-all flex flex-col gap-2 mb-3`}
    >
      <div className="flex justify-between items-start gap-2">
        <span className="text-xs font-mono text-mint font-medium">{issue.issueId}</span>
        
        {/* Drag Handle - visible on hover */}
        <div 
          {...attributes} 
          {...listeners}
          onClick={(e) => e.stopPropagation()} // Prevent clicking handle from opening details
          className="opacity-0 group-hover:opacity-100 p-0.5 -mr-1 -mt-1 text-muted hover:text-white cursor-grab active:cursor-grabbing transition-opacity"
        >
          <GripVertical size={14} />
        </div>
      </div>
      
      <h4 className="text-sm text-white font-medium leading-tight">
        {issue.title}
      </h4>

      <div className="flex justify-between items-center mt-1">
        <PriorityBadge priority={issue.priority} size="sm" />
        
        {issue.assigneeId && (
          <div 
            className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue to-mint flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
            title={assigneeName}
          >
            {getInitials(assigneeName)}
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
