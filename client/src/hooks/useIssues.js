import { useState, useCallback, useEffect } from 'react';
import { getIssues, deleteIssue, createIssue, updateIssue } from '../services/issueService';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const useIssues = (filters = {}, sort = {}) => {
  const [issues, setIssues] = useState([]);
  const [totalIssues, setTotalIssues] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchIssuesList = useCallback(async () => {
    setLoading(true);
    try {
      const payload = { ...filters };
      if (sort.field && sort.order) {
        payload.sort = `${sort.field}:${sort.order}`;
      }
      
      const res = await getIssues(payload);
      setIssues(res.issues || []);
      setTotalIssues(res.total || 0);
      return res;
    } catch (err) {
      showToast('error', 'Failed to load issues');
      return { issues: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, [
    filters.projectId, filters.sprintId, filters.assigneeId, 
    filters.priority, filters.status, filters.search,
    sort.field, sort.order, showToast
  ]);

  useEffect(() => {
    fetchIssuesList();
  }, [fetchIssuesList]);

  const removeIssue = async (issueId) => {
    try {
      await deleteIssue(issueId);
      await fetchIssuesList();
      showToast('success', 'Issue deleted');
      return true;
    } catch (err) {
      showToast('error', 'Failed to delete issue');
      return false;
    }
  };

  const addIssue = async (data) => {
    try {
      const response = await createIssue(data);
      await fetchIssuesList();
      showToast('success', 'Issue created');
      return response.issue;
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to create issue');
      return null;
    }
  };

  const editIssue = async (id, data) => {
    try {
      const response = await updateIssue(id, data);
      await fetchIssuesList();
      showToast('success', 'Issue updated');
      return response.issue;
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to update issue');
      return null;
    }
  };

  return { issues, totalIssues, loading, fetchIssuesList, removeIssue, addIssue, editIssue };
};

export const useIssueDependencies = (selectedProjectId) => {
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const [pRes, uRes] = await Promise.all([
          api.get('/projects'),
          api.get('/users')
        ]);
        setProjects(pRes.data.projects || []);
        setUsers(uRes.data.users || []);
      } catch (err) {
        showToast('error', 'Failed to load filter options');
      }
    };
    fetchDeps();
  }, [showToast]);

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        if (!selectedProjectId) {
          setSprints([]);
          return;
        }
        const sRes = await api.get(`/sprints?projectId=${selectedProjectId}`);
        setSprints(sRes.data.sprints || []);
      } catch (err) {
        setSprints([]);
      }
    };
    fetchSprints();
  }, [selectedProjectId, showToast]);

  return { projects, sprints, users };
};
