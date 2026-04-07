import api from './api';

export const startScan = async (config) => {
  const response = await api.post('/scan', config);
  return response.data;
};

export const getScanResults = async (scanId) => {
  const response = await api.get(`/scan/${scanId}/results`);
  return response.data;
};

export const getScanHistory = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/scan/history?${params.toString()}`);
  return response.data;
};
