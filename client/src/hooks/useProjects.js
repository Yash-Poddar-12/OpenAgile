import { useState, useEffect, useCallback } from 'react';
import {
  archiveProject as archiveProjectRequest,
  createProject as createProjectRequest,
  getProjects,
  reactivateProject as reactivateProjectRequest,
  updateProject as updateProjectRequest,
} from '../services/projectService';
import { useToast } from '../context/ToastContext';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProjects();
      setProjects(res.projects || []);
    } catch (err) {
      showToast('error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (projectData) => {
    try {
      await createProjectRequest(projectData);
      await fetchProjects();
      showToast('success', 'Project created successfully');
      return true;
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to create project');
      return false;
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      await updateProjectRequest(projectId, projectData);
      await fetchProjects();
      showToast('success', 'Project updated successfully');
      return true;
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to update project');
      return false;
    }
  };

  const archiveProject = async (projectId) => {
    try {
      await archiveProjectRequest(projectId);
      await fetchProjects();
      showToast('success', 'Project archived');
      return true;
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to archive project');
      return false;
    }
  };

  const reactivateProject = async (projectId) => {
    try {
      await reactivateProjectRequest(projectId);
      await fetchProjects();
      showToast('success', 'Project reactivated');
      return true;
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to reactivate project');
      return false;
    }
  };

  return {
    projects,
    loading,
    refreshProjects: fetchProjects,
    createProject,
    updateProject,
    archiveProject,
    reactivateProject,
  };
};
