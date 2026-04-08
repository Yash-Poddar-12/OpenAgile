import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const usePMDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, iRes, uRes] = await Promise.all([
        api.get('/projects'),
        api.get('/issues'),
        api.get('/users/active').catch(() => ({ data: { users: [] } }))
      ]);

      const allProjects = pRes.data.projects || [];
      const allIssues = iRes.data.issues || [];
      const allUsers = uRes.data.users || [];
      const sprintResponses = await Promise.all(
        allProjects.map((project) =>
          api.get(`/sprints?projectId=${project.projectId}`)
            .then((response) => ({ projectId: project.projectId, sprints: response.data.sprints || [] }))
            .catch(() => ({ projectId: project.projectId, sprints: [] }))
        )
      );

      const sprintLookup = new Map(
        sprintResponses.map(({ projectId, sprints }) => [projectId, sprints])
      );

      const hydratedProjects = allProjects.map((project) => {
        const projectIssues = allIssues.filter((issue) => issue.projectId === project.projectId);
        const projectSprints = sprintLookup.get(project.projectId) || [];
        const activeSprint = projectSprints.find((sprint) => sprint.status === 'ACTIVE');
        const latestSprint = projectSprints[projectSprints.length - 1] || null;

        return {
          ...project,
          issueCount: projectIssues.length,
          openIssueCount: projectIssues.filter((issue) => issue.status !== 'Done').length,
          sprintName: activeSprint?.name || latestSprint?.name || 'No sprint',
        };
      });

      setProjects(hydratedProjects);
      setIssues(allIssues);
      setUsers(allUsers);

      const activeProjects = hydratedProjects.filter(p => p.status === 'ACTIVE');
      if (activeProjects.length > 0) {
        const logPromises = activeProjects.slice(0, 3).map(p => 
          api.get(`/activity?projectId=${p.projectId}`).catch(() => null)
        );
        const logResults = await Promise.all(logPromises);
        let mergedLogs = [];
        logResults.forEach(res => {
          if (res?.data?.logs) {
            mergedLogs = [...mergedLogs, ...res.data.logs];
          }
        });
        
        mergedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setActivities(mergedLogs.slice(0, 10));
      } else {
        setActivities([]);
      }
    } catch (err) {
      showToast('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const createProject = async (projectData) => {
    try {
      await api.post('/projects', projectData);
      showToast('success', 'Project created successfully');
      fetchDashboardData();
      return true;
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to create project');
      return false;
    }
  };

  const archiveProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to archive this project?")) return;
    try {
      await api.patch(`/projects/${projectId}/archive`);
      showToast('success', 'Project archived');
      fetchDashboardData();
    } catch (err) {
      showToast('error', 'Failed to archive project');
    }
  };

  const reactivateProject = async (projectId) => {
    try {
      await api.patch(`/projects/${projectId}/reactivate`);
      showToast('success', 'Project reactivated');
      fetchDashboardData();
    } catch (err) {
      showToast('error', 'Failed to reactivate project');
    }
  };

  const editProject = async (projectId, projectData) => {
    try {
      await api.patch(`/projects/${projectId}`, projectData);
      showToast('success', 'Project updated successfully');
      fetchDashboardData();
      return true;
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to update project');
      return false;
    }
  };

  return { 
    projects, 
    issues, 
    users,
    activities, 
    loading, 
    createProject, 
    archiveProject,
    reactivateProject,
    editProject,
    refreshData: fetchDashboardData
  };
};
