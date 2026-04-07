import api from './api';

/**
 * projectService.js
 * API wrapper for project-related endpoints.
 */
export const getProjects = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/projects?${params.toString()}`);
  return response.data;
};

export const createProject = async (data) => {
  const response = await api.post('/projects', data);
  return response.data;
};

export const getProject = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const archiveProject = async (id) => {
  const response = await api.patch(`/projects/${id}/archive`);
  return response.data;
};

export const updateProject = async (id, data) => {
  const response = await api.patch(`/projects/${id}`, data);
  return response.data;
};

export const reactivateProject = async (id) => {
  const response = await api.patch(`/projects/${id}/reactivate`);
  return response.data;
};
