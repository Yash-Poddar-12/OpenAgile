import api from './api';

/**
 * issueService.js
 * API wrapper for issue management.
 */
export const getIssues = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/issues?${params.toString()}`);
  return response.data;
};

export const getIssue = async (id) => {
  const response = await api.get(`/issues/${id}`);
  return response.data;
};

export const createIssue = async (data) => {
  const response = await api.post('/issues', data);
  return response.data;
};

export const updateIssue = async (id, data) => {
  const response = await api.patch(`/issues/${id}`, data);
  return response.data;
};

export const updateStatus = async (id, newStatus) => {
  const response = await api.patch(`/issues/${id}/status`, { newStatus });
  return response.data;
};

export const deleteIssue = async (id) => {
  const response = await api.delete(`/issues/${id}`);
  return response.data;
};

export const addIssueComment = async (id, content) => {
  const response = await api.post(`/issues/${id}/comments`, { content });
  return response.data;
};
