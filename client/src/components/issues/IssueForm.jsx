import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { createIssue } from '../../services/issueService';
import api from '../../services/api';

const IssueForm = ({ onClose, onSuccess, initialProjectId }) => {
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: initialProjectId || '',
    sprintId: '',
    assigneeId: '',
    priority: 'Medium',
    dueDate: '',
  });

  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]); // In a real app, filter active project members
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    if (formData.projectId) {
      fetchSprints(formData.projectId);
    } else {
      setSprints([]);
    }
  }, [formData.projectId]);

  const fetchFormData = async () => {
    try {
      const pRes = await api.get('/projects');
      setProjects(pRes.data.projects || []);
      
      const uRes = await api.get('/users/active');
      setUsers(uRes.data.users || []);
    } catch (err) {
      showToast('error', 'Failed to fetch form dependencies');
    }
  };

  const fetchSprints = async (pId) => {
    try {
      const sRes = await api.get(`/sprints?projectId=${pId}`);
      setSprints(sRes.data.sprints || []);
    } catch (err) {
      // It's okay if it fails
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.projectId) {
      showToast('error', 'Title and Project are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = { ...formData };
      
      // Clean up empty optional fields
      if (!payload.sprintId) delete payload.sprintId;
      if (!payload.assigneeId) delete payload.assigneeId;
      if (!payload.dueDate) delete payload.dueDate;

      const res = await createIssue(payload);
      showToast('success', 'Issue created');
      if (onSuccess) onSuccess(res.issue);
      if (onClose) onClose();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to create issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-white">Title *</label>
        <input 
          autoFocus
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full bg-[#1A1A2E] border border-border rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue"
          placeholder="Issue title"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-white">Description</label>
        <textarea 
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full bg-[#1A1A2E] border border-border rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue resize-none"
          placeholder="Detailed description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white">Project *</label>
          <select 
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            required
            className="w-full bg-[#1A1A2E] border border-border rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue"
          >
            <option value="">Select a project...</option>
            {projects.map(p => (
              <option key={p.projectId} value={p.projectId}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white">Sprint</label>
          <select 
            name="sprintId"
            value={formData.sprintId}
            onChange={handleChange}
            disabled={!formData.projectId}
            className="w-full bg-[#1A1A2E] border border-border rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue disabled:opacity-50"
          >
            <option value="">No sprint</option>
            {sprints.map(s => (
              <option key={s.sprintId} value={s.sprintId}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white">Assignee</label>
          <select 
            name="assigneeId"
            value={formData.assigneeId}
            onChange={handleChange}
            className="w-full bg-[#1A1A2E] border border-border rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue"
          >
            <option value="">Unassigned</option>
            {users.map(u => (
              <option key={u.userId} value={u.userId}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white">Priority</label>
          <select 
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full bg-[#1A1A2E] border border-border rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-sm font-medium text-white">Due Date</label>
          <input 
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full md:w-1/2 bg-[#1A1A2E] border border-border rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        {onClose && (
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm text-white bg-transparent border border-border rounded-lg hover:bg-page transition"
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-6 py-2 text-sm text-white bg-blue rounded-lg hover:brightness-110 transition disabled:opacity-70 flex items-center gap-2"
        >
          {isSubmitting ? 'Creating...' : 'Create Issue'}
        </button>
      </div>
    </form>
  );
};

export default IssueForm;
