import { useState, useEffect, useCallback } from 'react';
import { getScanHistory, getScanResults, startScan as requestScan } from '../services/scanService';
import api from '../services/api';
import { useSocketContext } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from './useSocket';

/**
 * useScan hook to orchestrate repository analysis state and polling.
 */
export const useScan = (initialScanId = null) => {
  const [scanId, setScanId] = useState(initialScanId);
  const [scanStatus, setScanStatus] = useState(initialScanId ? 'scanning' : 'idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [graph, setGraph] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  const { joinScan } = useSocketContext();
  const { showToast } = useToast();

  const applyCompletedScan = useCallback((scanGraph) => {
    const nodes = (scanGraph?.nodes || []).map((node) => ({
      ...node,
      label: node.label || node.name || node.id,
    }));
    const links = (scanGraph?.edges || scanGraph?.links || []).map((edge) => ({
      source: typeof edge.source === 'object' ? edge.source.id : edge.source,
      target: typeof edge.target === 'object' ? edge.target.id : edge.target,
    }));

    setGraph({ nodes, links });
    setMetrics({
      fanInTop5: (scanGraph?.fanInTop5 || []).map((item) => ({
        ...item,
        name: item.name || item.file,
        file: item.file || item.name,
      })),
      fanOutTop5: (scanGraph?.fanOutTop5 || []).map((item) => ({
        ...item,
        name: item.name || item.file,
        file: item.file || item.name,
      })),
      nodesCount: scanGraph?.nodesCount || nodes.length,
      edgesCount: scanGraph?.edgesCount || links.length,
      cyclesCount: scanGraph?.cyclesCount || 0,
    });
    setScanStatus('completed');
    setProgress(100);
    setProgressMessage('Scan complete');
    setError(null);
  }, []);

  const handleStartScan = async (config) => {
    try {
      setError(null);
      setGraph(null);
      setMetrics(null);
      setProgress(0);
      setProgressMessage('Initializing scan...');
      setScanStatus('scanning');

      const res = await requestScan(config);
      setScanId(res.scanId);
      joinScan(res.scanId);
    } catch (err) {
      setScanStatus('failed');
      const msg = err.response?.data?.error || 'Failed to start scan';
      setError(msg);
      showToast('error', msg);
    }
  };

  const handleScanProgress = useCallback(({ percent, message }) => {
    setProgress(percent);
    setProgressMessage(message);
  }, []);

  const handleScanComplete = useCallback((data) => {
    applyCompletedScan(data);
    showToast('success', 'Scan completed successfully!');
  }, [applyCompletedScan, showToast]);

  const handleScanFailed = useCallback(({ errorMsg }) => {
    setScanStatus('failed');
    setError(errorMsg || 'Scan failed');
    showToast('error', errorMsg || 'Scan failed');
  }, [showToast]);

  // Socket event listeners via custom hook pattern
  useSocket('scanProgress', handleScanProgress, [], 'scan');
  useSocket('scanComplete', handleScanComplete, [], 'scan');
  useSocket(
    'scanFailed',
    (data) => handleScanFailed({ errorMsg: data.error }),
    [handleScanFailed],
    'scan'
  );

  // Polling fallback loop to assure state is synced if socket hiccups
  useEffect(() => {
    if (!scanId || scanStatus === 'completed' || scanStatus === 'failed') return;

    joinScan(scanId);

    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;
      try {
        const res = await getScanResults(scanId);
        if (res.status === 'COMPLETED' && res.graph) {
          handleScanComplete(res.graph);
          isPolling = false;
        } else if (res.status === 'FAILED') {
          handleScanFailed({ errorMsg: res.error });
          isPolling = false;
        }
      } catch (err) {
        // Safe continuous failure ignoring in poll
      }
    };

    poll(); // Initial check immediately
    const intervalId = setInterval(poll, 3000);

    return () => {
      isPolling = false;
      clearInterval(intervalId);
    };
  }, [scanId, scanStatus, joinScan, handleScanComplete, handleScanFailed]);

  const loadScanById = useCallback(async (targetScanId) => {
    if (!targetScanId) {
      setScanId(null);
      setGraph(null);
      setMetrics(null);
      setScanStatus('idle');
      return null;
    }

    setError(null);
    setProgressMessage('Loading latest scan...');

    const res = await getScanResults(targetScanId);
    setScanId(targetScanId);

    if (res.status === 'COMPLETED' && res.graph) {
      applyCompletedScan(res.graph);
      return res.graph;
    }

    if (res.status === 'FAILED') {
      setGraph(null);
      setMetrics(null);
      setScanStatus('failed');
      setError(res.error || 'Scan failed');
      return null;
    }

    setGraph(null);
    setMetrics(null);
    setProgress(0);
    setScanStatus('scanning');
    joinScan(targetScanId);
    return null;
  }, [applyCompletedScan, joinScan]);

  const loadLatestScanForRepository = useCallback(async (repositoryPath) => {
    const trimmedPath = repositoryPath?.trim();

    if (!trimmedPath) {
      setScanId(null);
      setGraph(null);
      setMetrics(null);
      setScanStatus('idle');
      setProgress(0);
      setProgressMessage('');
      setError(null);
      return null;
    }

    try {
      const history = await getScanHistory({
        days: 3650,
        repositoryPath: trimmedPath,
      });
      const latestScan = (history.scans || [])[0];

      if (!latestScan?.graphId) {
        setScanId(null);
        setGraph(null);
        setMetrics(null);
        setScanStatus('idle');
        setProgress(0);
        setProgressMessage('');
        setError(null);
        return null;
      }

      return await loadScanById(latestScan.graphId);
    } catch (err) {
      setGraph(null);
      setMetrics(null);
      setScanStatus('idle');
      setError(null);
      return null;
    }
  }, [loadScanById]);

  /**
   * Triggers export artifact download (Phase 4 integration).
   */
  const exportGraph = async (format) => {
    if (!scanId || scanStatus !== 'completed') return;
    try {
      const response = await api.post(`/export`, {
        artifacts: [format],
        graphId: scanId
      }, { responseType: 'blob' });

      // Generate download blob link dynamically
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dependency_graph_${scanId.substring(0,8)}.${format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToast('success', `Exported to ${format}`);
    } catch (err) {
      showToast('error', `Failed to export ${format} - Export module not active`);
    }
  };

  return {
    scanId,
    scanStatus,
    progress,
    progressMessage,
    graph,
    metrics,
    error,
    startScan: handleStartScan,
    exportGraph,
    loadScanById,
    loadLatestScanForRepository,
  };
};
