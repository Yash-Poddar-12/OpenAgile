import api from './api';

export const getAnalytics = async (days = 7, repoId = '') => {
  const params = new URLSearchParams();
  if (days) params.append('days', days);
  if (repoId) params.append('repoId', repoId);
  const response = await api.get(`/analytics?${params.toString()}`);
  return response.data;
};
