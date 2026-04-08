import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Edit2,
  Flag,
  MessageSquare,
  Plus,
  Square,
  Trash2,
  User,
  X,
} from 'lucide-react';
import Modal from '../components/common/Modal';
import { useIssues, useIssueDependencies } from '../hooks/useIssues';
import { useToast } from '../context/ToastContext';
import { addIssueComment, getIssue as getIssueDetails } from '../services/issueService';

const ALL_PROJECTS = 'all-projects';
const ALL_SPRINTS = 'all-sprints';
const WORKSPACE_STORAGE_KEY = 'openagile_current_workspace_project_id';

const priorityColor = {
  High: 'bg-red-500/20 text-red-400 border-red-500/30',
  Medium: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};
const statusColor = {
  ToDo: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  InProgress: 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30',
  Review: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Done: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30',
};
const priorityText = { High: 'text-red-400', Medium: 'text-orange-400', Low: 'text-gray-400' };
const statusText = { ToDo: 'text-gray-400', InProgress: 'text-[#3B82F6]', Review: 'text-orange-400', Done: 'text-[#10B981]' };
const statusLabel = { ToDo: 'To Do', InProgress: 'In Progress', Review: 'Review', Done: 'Done' };

const defaultFormState = {
  title: '',
  description: '',
  projectId: '',
  priority: 'Medium',
  status: 'ToDo',
  dueDate: '',
  assigneeId: '',
};

const issueMatchesCurrentFilters = (issue, filters, selectedAssignees) => {
  if (!issue) {
    return false;
  }

  if (filters.projectId && issue.projectId !== filters.projectId) {
    return false;
  }
  if (filters.sprintId && issue.sprintId !== filters.sprintId) {
    return false;
  }
  if (filters.priority && issue.priority !== filters.priority) {
    return false;
  }
  if (filters.status && issue.status !== filters.status) {
    return false;
  }
  if (selectedAssignees.length > 0 && !selectedAssignees.includes(issue.assigneeId)) {
    return false;
  }

  return true;
};

function IssueDetailPanel({ issue, onClose, onAddComment, isSubmittingComment = false, isLoading = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (issue) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }

    setIsVisible(false);
    return undefined;
  }, [issue]);

  if (!issue) return null;

  const requirements = issue.requirements || [];
  const comments = issue.comments || [];
  const activity = issue.activity || [];
  const assigneeLabel = issue.assigneeName || issue.assigneeId || 'Unassigned';
  const projectLabel = issue.projectName || issue.projectId || 'No project';

  const handleCommentSubmit = async () => {
    if (!comment.trim() || !onAddComment) {
      return;
    }

    const wasSaved = await onAddComment(comment.trim());
    if (wasSaved) {
      setComment('');
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 transition-opacity z-40 ${isVisible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`fixed top-0 right-0 h-full w-[600px] bg-[#1E1E2E] border-l border-[#33334a] shadow-2xl z-50 transition-transform duration-300 ease-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#33334a]">
            <div className="flex items-center gap-3">
              <span className="text-[#10B981] font-mono">{issue.issueId}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400 text-sm">{projectLabel}</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#252537] rounded-lg transition-colors text-gray-400 hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-6">
              <h2 className="text-xl text-gray-100">{issue.title}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Flag className={`w-4 h-4 ${priorityText[issue.priority] || priorityText.Medium}`} />
                  <span className="text-gray-400">Priority:</span>
                  <span className={priorityText[issue.priority] || priorityText.Medium}>{issue.priority}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className={`w-4 h-4 ${statusText[issue.status] || statusText.ToDo}`} />
                  <span className="text-gray-400">Status:</span>
                  <span className={statusText[issue.status] || statusText.ToDo}>{statusLabel[issue.status] || issue.status}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Assignee:</span>
                  <span className="text-gray-200">{assigneeLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Due:</span>
                  <span className="text-gray-200">{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'None'}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-2">Description</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{issue.description || 'No description provided.'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Requirements ({requirements.filter((requirement) => requirement.completed).length}/{requirements.length})
                </h3>
                <div className="space-y-2">
                  {requirements.length === 0 && <p className="text-sm text-gray-500 italic">No checklist items yet.</p>}
                  {requirements.map((requirement) => (
                    <label key={requirement.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#252537] transition-colors cursor-pointer group">
                      <div className="mt-0.5">
                        {requirement.completed ? <CheckSquare className="w-5 h-5 text-[#10B981]" /> : <Square className="w-5 h-5 text-gray-500 group-hover:text-gray-400" />}
                      </div>
                      <span className={`text-sm flex-1 ${requirement.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{requirement.text}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />Comments ({comments.length})
                </h3>
                <div className="space-y-4">
                  {isLoading && <p className="text-sm text-gray-500 italic">Loading issue details...</p>}
                  {comments.map((entry) => (
                    <div key={entry.commentId || entry.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#10B981] flex items-center justify-center text-white text-xs flex-shrink-0">{entry.avatar}</div>
                      <div className="flex-1 bg-[#252537] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-200">{entry.author}</span>
                          <span className="text-xs text-gray-500">{entry.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-300">{entry.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && <p className="text-sm text-gray-500 italic">No comments yet.</p>}
                  <div className="flex gap-3 pt-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#10B981] flex items-center justify-center text-white text-xs flex-shrink-0">ME</div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-[#252537] text-gray-300 px-4 py-2 rounded-lg border border-[#33334a] focus:border-[#3B82F6] focus:outline-none text-sm placeholder-gray-500"
                      />
                      <button
                        type="button"
                        onClick={handleCommentSubmit}
                        disabled={isSubmittingComment || !comment.trim()}
                        className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm text-white transition-colors hover:bg-[#2563EB] disabled:opacity-50"
                      >
                        {isSubmittingComment ? 'Saving...' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm text-gray-400 mb-3">Activity</h3>
                <div className="space-y-3">
                  {activity.length === 0 && <p className="text-sm text-gray-500 italic">No activity recorded yet.</p>}
                  {activity.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-gray-200">{entry.user}</span>
                        <span className="text-gray-400"> {entry.action}</span>
                        <div className="text-xs text-gray-500 mt-0.5">{entry.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function IssuesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamKey = searchParams.toString();
  const { showToast } = useToast();

  const [selectedProject, setSelectedProject] = useState(ALL_PROJECTS);
  const [selectedSprint, setSelectedSprint] = useState(ALL_SPRINTS);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [hasHandledCreateQuery, setHasHandledCreateQuery] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [formData, setFormData] = useState(defaultFormState);
  const [detailIssue, setDetailIssue] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const { projects: allProjects, sprints, users } = useIssueDependencies(selectedProject !== ALL_PROJECTS ? selectedProject : null);

  const filters = useMemo(() => ({
    projectId: selectedProject !== ALL_PROJECTS ? selectedProject : null,
    sprintId: selectedSprint !== ALL_SPRINTS ? selectedSprint : null,
    priority: selectedPriority !== 'All' ? selectedPriority : null,
    status: selectedStatus !== 'All' ? selectedStatus : null,
  }), [selectedPriority, selectedProject, selectedSprint, selectedStatus]);

  const { issues, totalIssues, loading, removeIssue, addIssue, editIssue } = useIssues(filters, { field: sortField, order: sortDirection });

  const projectLookup = useMemo(() => new Map(allProjects.map((project) => [project.projectId, project])), [allProjects]);
  const userLookup = useMemo(() => new Map(users.map((user) => [user.userId, user])), [users]);

  const projectOptions = useMemo(
    () => [{ label: 'All Projects', value: ALL_PROJECTS }, ...allProjects.map((project) => ({ label: project.name, value: project.projectId }))],
    [allProjects]
  );
  const sprintOptions = useMemo(
    () => [{ label: 'All Sprints', value: ALL_SPRINTS }, ...sprints.map((sprint) => ({ label: sprint.name, value: sprint.sprintId }))],
    [sprints]
  );
  const priorities = ['All', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'ToDo', 'InProgress', 'Review', 'Done'];

  const resolvedIssues = useMemo(() => (
    (issues || []).map((issue) => ({
      ...issue,
      projectName: projectLookup.get(issue.projectId)?.name || issue.projectId,
      assigneeName: userLookup.get(issue.assigneeId)?.name || issue.assigneeId || 'Unassigned',
      requirements: issue.requirements || [],
      comments: issue.comments || [],
      activity: issue.activity || [],
    }))
  ), [issues, projectLookup, userLookup]);

  const filteredIssues = useMemo(() => {
    if (selectedAssignees.length === 0) {
      return resolvedIssues;
    }

    return resolvedIssues.filter((issue) => selectedAssignees.includes(issue.assigneeId));
  }, [resolvedIssues, selectedAssignees]);

  const loadIssueDetail = async (issueId) => {
    if (!issueId) {
      setDetailIssue(null);
      return;
    }

    try {
      setDetailLoading(true);
      const response = await getIssueDetails(issueId);
      const issue = response.issue || {};
      const activityLog = response.activityLog || [];

      setDetailIssue({
        ...issue,
        projectName: projectLookup.get(issue.projectId)?.name || issue.projectId,
        assigneeName: userLookup.get(issue.assigneeId)?.name || issue.assigneeId || 'Unassigned',
        requirements: issue.requirements || [],
        comments: (issue.comments || []).map((entry) => ({
          ...entry,
          id: entry.commentId,
          author: entry.authorName || entry.authorId || 'Unknown',
          avatar: (entry.authorName || entry.authorId || 'UN').substring(0, 2).toUpperCase(),
          timestamp: new Date(entry.createdAt).toLocaleString(),
        })),
        activity: activityLog.map((entry) => ({
          id: entry.logId,
          user: entry.performer?.name || entry.performedBy || 'System',
          action: entry.action.replaceAll('_', ' ').toLowerCase(),
          timestamp: new Date(entry.timestamp).toLocaleString(),
        })),
      });
    } catch (err) {
      showToast('error', 'Failed to load issue details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedIssue?.issueId) {
      setDetailIssue(null);
      return;
    }

    loadIssueDetail(selectedIssue.issueId);
  }, [selectedIssue?.issueId, projectLookup, userLookup]);

  useEffect(() => {
    if (selectedProject === ALL_PROJECTS) {
      setSelectedSprint(ALL_SPRINTS);
      return;
    }

    const sprintStillExists = sprints.some((sprint) => sprint.sprintId === selectedSprint);
    if (!sprintStillExists && selectedSprint !== ALL_SPRINTS) {
      setSelectedSprint(ALL_SPRINTS);
    }
  }, [selectedProject, selectedSprint, sprints]);

  useEffect(() => {
    const projectIdFromQuery = searchParams.get('projectId');
    const workspaceProjectId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    const preferredProjectId = projectIdFromQuery || workspaceProjectId;

    if (preferredProjectId && allProjects.some((project) => project.projectId === preferredProjectId)) {
      setSelectedProject(preferredProjectId);
      return;
    }

    if (allProjects.length === 0) {
      setSelectedProject(ALL_PROJECTS);
      return;
    }

    if (!preferredProjectId) {
      setSelectedProject(ALL_PROJECTS);
    }
  }, [allProjects, searchParamKey, searchParams]);

  useEffect(() => {
    if (selectedProject && selectedProject !== ALL_PROJECTS) {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, selectedProject);
      return;
    }
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  }, [selectedProject]);

  const openCreateModal = ({ projectId, status } = {}) => {
    const fallbackProjectId = projectId || (selectedProject !== ALL_PROJECTS ? selectedProject : allProjects[0]?.projectId || '');

    setEditingIssue(null);
    setFormData({
      ...defaultFormState,
      projectId: fallbackProjectId,
      status: status || 'ToDo',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (hasHandledCreateQuery || allProjects.length === 0) {
      return;
    }

    if (searchParams.get('create') === '1') {
      openCreateModal({
        projectId: searchParams.get('projectId') || undefined,
        status: searchParams.get('status') || 'ToDo',
      });
      setHasHandledCreateQuery(true);

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('create');
      nextParams.delete('status');
      setSearchParams(nextParams, { replace: true });
    }
  }, [allProjects, hasHandledCreateQuery, searchParamKey, searchParams, setSearchParams]);

  const openEditModal = (issue) => {
    setEditingIssue(issue);
    setFormData({
      title: issue.title || '',
      description: issue.description || '',
      projectId: issue.projectId || '',
      priority: issue.priority || 'Medium',
      status: issue.status || 'ToDo',
      dueDate: issue.dueDate ? issue.dueDate.split('T')[0] : '',
      assigneeId: issue.assigneeId || '',
    });
    setIsModalOpen(true);
  };

  const toggleAssignee = (assigneeId) => {
    setSelectedAssignees((current) => (
      current.includes(assigneeId)
        ? current.filter((id) => id !== assigneeId)
        : [...current, assigneeId]
    ));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  };

  const handleModalSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...formData,
      description: formData.description.trim(),
    };

    if (!payload.assigneeId) delete payload.assigneeId;
    if (!payload.dueDate) delete payload.dueDate;

    const savedIssue = editingIssue
      ? await editIssue(editingIssue.issueId, payload)
      : await addIssue(payload);

    if (!savedIssue) {
      return;
    }

    setIsModalOpen(false);
    setEditingIssue(null);

    if (!issueMatchesCurrentFilters(savedIssue, filters, selectedAssignees)) {
      showToast('info', 'Issue saved. Current filters are hiding it from the list.');
    }
  };

  const handleAddComment = async (content) => {
    if (!detailIssue?.issueId) {
      return false;
    }

    try {
      setCommentSubmitting(true);
      await addIssueComment(detailIssue.issueId, content);
      await loadIssueDetail(detailIssue.issueId);
      showToast('success', 'Comment added');
      return true;
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to add comment');
      return false;
    } finally {
      setCommentSubmitting(false);
    }
  };

  const SortBtn = ({ field, label }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-[#10B981] transition-colors">
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-[#10B981]' : 'text-gray-500'}`} />
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-[#1E1E2E] text-gray-100" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="bg-[#252537] border-b border-[#33334a] px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#10B981]">Issue Tracker</h1>
            <p className="text-sm text-gray-400 mt-1">Manage and track your team's work</p>
          </div>
          <span className="text-sm text-gray-400">{totalIssues} {totalIssues === 1 ? 'issue' : 'issues'} {loading && '(Loading...)'}</span>
        </div>
      </header>

      <div className="bg-[#252537] border-b border-[#33334a] px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="appearance-none bg-[#1E1E2E] text-gray-300 px-4 py-2 pr-10 rounded-lg border border-[#33334a] hover:border-[#4a4a6a] transition-colors cursor-pointer text-sm">
              {projectOptions.map((project) => <option key={project.value} value={project.value}>{project.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={selectedSprint} onChange={(e) => setSelectedSprint(e.target.value)} disabled={selectedProject === ALL_PROJECTS} className="appearance-none bg-[#1E1E2E] text-gray-300 px-4 py-2 pr-10 rounded-lg border border-[#33334a] hover:border-[#4a4a6a] transition-colors cursor-pointer text-sm disabled:opacity-60">
              {sprintOptions.map((sprint) => <option key={sprint.value} value={sprint.value}>{sprint.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative group">
            <button className="bg-[#1E1E2E] text-gray-300 px-4 py-2 rounded-lg border border-[#33334a] hover:border-[#4a4a6a] transition-colors text-sm">
              Assignee {selectedAssignees.length > 0 && `(${selectedAssignees.length})`}
            </button>
            <div className="absolute top-full left-0 mt-1 bg-[#252537] border border-[#33334a] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[220px]">
              {users.length === 0 && <div className="px-4 py-3 text-sm text-gray-500">No assignees available</div>}
              {users.map((user) => (
                <label key={user.userId} className="flex items-center gap-2 px-4 py-2 hover:bg-[#1E1E2E] cursor-pointer text-sm text-gray-300">
                  <input type="checkbox" checked={selectedAssignees.includes(user.userId)} onChange={() => toggleAssignee(user.userId)} className="w-4 h-4 rounded border-[#33334a] bg-[#1E1E2E] text-[#3B82F6]" />
                  {user.name || user.userId}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#1E1E2E] rounded-lg border border-[#33334a] p-1">
            {priorities.map((priority) => (
              <button key={priority} onClick={() => setSelectedPriority(priority)} className={`px-3 py-1 rounded text-sm transition-colors ${selectedPriority === priority ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:text-gray-300'}`}>{priority}</button>
            ))}
          </div>
          <div className="relative">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="appearance-none bg-[#1E1E2E] text-gray-300 px-4 py-2 pr-10 rounded-lg border border-[#33334a] hover:border-[#4a4a6a] transition-colors cursor-pointer text-sm">
              {statuses.map((status) => <option key={status} value={status}>{statusLabel[status] || status}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={() => openCreateModal()} className="ml-auto bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />New Issue
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-[#252537] rounded-lg border border-[#33334a] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#252537] border-b border-[#33334a]">
                <tr className="text-left text-gray-400 text-sm">
                  <th className="px-6 py-4"><SortBtn field="issueId" label="Issue ID" /></th>
                  <th className="px-6 py-4"><SortBtn field="title" label="Title" /></th>
                  <th className="px-6 py-4"><SortBtn field="priority" label="Priority" /></th>
                  <th className="px-6 py-4"><SortBtn field="status" label="Status" /></th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4"><SortBtn field="assigneeId" label="Assignee" /></th>
                  <th className="px-6 py-4"><SortBtn field="dueDate" label="Due Date" /></th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#33334a]">
                {filteredIssues.map((issue) => (
                  <tr key={issue.issueId || issue._id} onClick={() => setSelectedIssue(issue)} className="hover:bg-[#252537] cursor-pointer transition-colors group">
                    <td className="px-6 py-4"><span className="text-[#10B981] font-mono text-sm">{issue.issueId}</span></td>
                    <td className="px-6 py-4"><span className="text-gray-200">{issue.title}</span></td>
                    <td className="px-6 py-4"><span className={`inline-block px-2 py-1 rounded text-xs border ${priorityColor[issue.priority]}`}>{issue.priority}</span></td>
                    <td className="px-6 py-4"><span className={`inline-block px-2 py-1 rounded text-xs border ${statusColor[issue.status]}`}>{statusLabel[issue.status] || issue.status}</span></td>
                    <td className="px-6 py-4"><span className="text-gray-300 text-sm">{issue.projectName}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#10B981] flex items-center justify-center text-white text-xs">
                          {(issue.assigneeName || 'UN').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-gray-300 text-sm">{issue.assigneeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-gray-400 text-sm">{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'None'}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(issue); }} className="p-1.5 hover:bg-[#1E1E2E] rounded text-[#3B82F6] hover:text-[#2563EB] transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete ${issue.issueId}?`)) {
                              await removeIssue(issue.issueId);
                            }
                          }}
                          className="p-1.5 hover:bg-[#1E1E2E] rounded text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredIssues.length === 0 && <div className="text-center py-12 text-gray-500">No issues found matching the current filters.</div>}
          </div>
        </div>
      </div>

      <IssueDetailPanel
        issue={detailIssue || selectedIssue}
        onClose={() => {
          setSelectedIssue(null);
          setDetailIssue(null);
        }}
        onAddComment={handleAddComment}
        isSubmittingComment={commentSubmitting}
        isLoading={detailLoading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingIssue ? 'Edit Issue' : 'Create New Issue'}>
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))} className="w-full bg-[#1E1E2E] border border-[#33334a] rounded px-3 py-2 text-white text-sm focus:border-[#3B82F6] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))} className="w-full bg-[#1E1E2E] border border-[#33334a] rounded px-3 py-2 text-white text-sm focus:border-[#3B82F6] focus:outline-none min-h-[100px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Project</label>
              <select required value={formData.projectId} onChange={(e) => setFormData((current) => ({ ...current, projectId: e.target.value }))} className="w-full bg-[#1E1E2E] border border-[#33334a] rounded px-3 py-2 text-white text-sm">
                <option value="">Select Project</option>
                {allProjects.map((project) => <option key={project.projectId} value={project.projectId}>{project.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Assignee</label>
              <select value={formData.assigneeId} onChange={(e) => setFormData((current) => ({ ...current, assigneeId: e.target.value }))} className="w-full bg-[#1E1E2E] border border-[#33334a] rounded px-3 py-2 text-white text-sm">
                <option value="">Unassigned</option>
                {users.map((user) => <option key={user.userId} value={user.userId}>{user.name || user.userId}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData((current) => ({ ...current, priority: e.target.value }))} className="w-full bg-[#1E1E2E] border border-[#33334a] rounded px-3 py-2 text-white text-sm">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData((current) => ({ ...current, status: e.target.value }))} className="w-full bg-[#1E1E2E] border border-[#33334a] rounded px-3 py-2 text-white text-sm">
                {statuses.filter((status) => status !== 'All').map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Due Date</label>
              <input type="date" value={formData.dueDate} onChange={(e) => setFormData((current) => ({ ...current, dueDate: e.target.value }))} className="w-full bg-[#1E1E2E] border border-[#33334a] rounded px-3 py-2 text-white text-sm [color-scheme:dark]" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#33334a]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 hover:bg-[#33334a] text-white rounded text-sm transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded text-sm transition-colors">{editingIssue ? 'Save Changes' : 'Create Issue'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
