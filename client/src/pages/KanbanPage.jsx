import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Filter, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKanban } from '../hooks/useKanban';
import { useIssueDependencies } from '../hooks/useIssues';

const priorityColors = { High: '#EF4444', Medium: '#F59E0B', Low: '#6B7280' };
const statusColors = {
  ToDo: { bg: '#4B4B5E', text: '#A0A0B0' },
  InProgress: { bg: '#4F8EF7', text: '#FFFFFF' },
  Review: { bg: '#F59E0B', text: '#FFFFFF' },
  Done: { bg: '#43D9AD', text: '#FFFFFF' },
};
const columnTitles = { ToDo: 'To Do', InProgress: 'In Progress', Review: 'Review', Done: 'Done' };

function KanbanCard({ card, onDragStart }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div draggable onDragStart={onDragStart}
      className="relative bg-[#252538] rounded-md border border-[#2D2D44] hover:border-[#3D3D54] transition-colors cursor-grab active:cursor-grabbing"
      style={{ borderLeft: `3px solid ${priorityColors[card.priority] || priorityColors.Medium}` }}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className={`absolute left-1 top-1/2 -translate-y-1/2 text-[#6B7280] transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="p-3 pl-6">
        <div className="flex items-start gap-2 mb-3">
          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: priorityColors[card.priority] || priorityColors.Medium }} />
          <h4 className="font-semibold text-[#E5E5E5] text-sm leading-tight">{card.title}</h4>
        </div>
        <div className="flex items-center justify-between">
          <div className="w-6 h-6 rounded-full bg-[#4F8EF7] flex items-center justify-center text-white text-xs font-medium" title={card.assigneeId}>
            {(card.assigneeId || 'UN').substring(0,2)}
          </div>
          <span className="text-[#8B8B9E] text-xs font-medium">{card.issueId}</span>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ status, cards, onAddIssue, onDragOver, onDrop, onCardDragStart }) {
  const colors = statusColors[status];
  return (
    <div className="flex flex-col h-full min-w-0" onDragOver={onDragOver} onDrop={onDrop}>
      <div className="flex items-center justify-between px-4 py-3 rounded-t-lg mb-3" style={{ backgroundColor: colors.bg }}>
        <h3 className="font-semibold text-sm" style={{ color: colors.text }}>{columnTitles[status]}</h3>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: colors.text }}>{cards.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-2 min-h-0">
        {cards.map(card => <KanbanCard key={card.issueId || card._id} card={card} onDragStart={() => onCardDragStart(card, status)} />)}
      </div>
      <button onClick={() => onAddIssue(status)} className="mt-3 mx-2 py-2 px-3 rounded-md border border-dashed border-[#3D3D54] text-[#8B8B9E] hover:border-[#4F8EF7] hover:text-[#4F8EF7] transition-colors flex items-center justify-center gap-2 text-sm font-medium">
        <Plus className="w-4 h-4" />Add Issue
      </button>
    </div>
  );
}

export function KanbanPage() {
  const [selectedProject, setSelectedProject] = useState('');
  const { projects } = useIssueDependencies(null);
  
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].projectId);
    }
  }, [projects, selectedProject]);

  const { columns, isLoading, moveCard, presenceUsers } = useKanban(selectedProject, null);

  const [dragCard, setDragCard] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);

  const handleCardDragStart = (card, fromStatus) => { setDragCard(card); setDragFrom(fromStatus); };

  const handleDrop = async (toStatus) => {
    if (!dragCard || dragFrom === toStatus) return;
    
    // Call the hook to move
    await moveCard(dragCard.issueId, dragFrom, toStatus);
    
    setDragCard(null); setDragFrom(null);
  };

  const navigate = useNavigate();

  const handleAddIssue = (status) => {
    const params = new URLSearchParams();
    if (selectedProject) {
      params.set('projectId', selectedProject);
    }
    params.set('create', '1');
    params.set('status', status);
    navigate(`/issues?${params.toString()}`);
  };

  return (
    <div className="h-full bg-[#1E1E2E] flex flex-col font-['Inter',sans-serif]">
      <div className="bg-[#252538] border-b border-[#2D2D44] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-[#E5E5E5] text-xl font-semibold">Kanban Board</h1>
          
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="appearance-none bg-[#2D2D44] text-[#E5E5E5] px-4 py-2 pr-10 rounded-md border border-[#3D3D54] focus:outline-none focus:border-[#4F8EF7] text-sm font-medium transition-colors">
            {projects.length === 0 && <option value="">No projects available</option>}
            {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
          </select>
          
          <div className="flex items-center -space-x-2">
            {presenceUsers?.map((user, i) => (
               <div key={user.userId || i} className="w-8 h-8 rounded-full border-2 border-[#252538] bg-[#43D9AD] flex items-center justify-center text-xs text-white" title={user.name}>
                 {(user.name || 'U').substring(0,2).toUpperCase()}
               </div>
            ))}
          </div>
          
        </div>
        <button onClick={() => navigate('/issues')} className="flex items-center gap-2 px-4 py-2 bg-[#4F8EF7] hover:bg-[#4080E0] rounded-md text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />Add Card
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-[#8B8B9E]">Loading board...</div>
      ) : !selectedProject ? (
        <div className="flex-1 flex items-center justify-center text-[#8B8B9E]">No project is available for this board yet.</div>
      ) : (
        <div className="flex-1 p-6 grid grid-cols-4 gap-4 min-h-0 overflow-hidden">
          {Object.keys(columns).map(status => (
            <KanbanColumn key={status} status={status} cards={columns[status]}
              onAddIssue={handleAddIssue}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
              onCardDragStart={handleCardDragStart} />
          ))}
        </div>
      )}
    </div>
  );
}
