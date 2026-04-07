import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const useExport = () => {
  const [loading, setLoading] = useState(true);
  const [recentExports, setRecentExports] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [generating, setGenerating] = useState(false);
  const { showToast } = useToast();

  const fetchExportsData = useCallback(async () => {
    setLoading(true);
    try {
      const [exportsRes, scansRes] = await Promise.all([
        api.get('/export/recent'),
        api.get('/scan/history?days=30')
      ]);
      setRecentExports(exportsRes.data.exports || []);
      setRecentScans((scansRes.data.scans || []).slice(0, 2));
    } catch (err) {
      showToast('error', 'Failed to load export data');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchExportsData();
  }, [fetchExportsData]);

  const generateExport = async (artifacts, projectId) => {
    if (!artifacts || artifacts.length === 0) return;
    
    setGenerating(true);
    try {
      const response = await api.post('/export', {
        artifacts,
        projectId
      }, {
        responseType: 'blob'
      });

      const contentDisposition = response.headers['content-disposition'];
      let filename = `export-${Date.now()}.zip`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast('success', 'Export generated successfully');
      
      const exportsRes = await api.get('/export/recent');
      setRecentExports(exportsRes.data.exports || []);
    } catch (err) {
      showToast('error', 'Failed to generate export');
    } finally {
      setGenerating(false);
    }
  };

  return {
    loading,
    recentExports,
    recentScans,
    generating,
    generateExport,
    fetchExportsData
  };
};
