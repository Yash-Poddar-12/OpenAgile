import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileCode, FileText, Image, Scan } from 'lucide-react';
import GraphViewer from '../components/filemap/GraphViewer';
import { useProjects } from '../hooks/useProjects';
import { useScan } from '../hooks/useScan';
import { useToast } from '../context/ToastContext';

export function FileMapPage() {
  const [searchParams] = useSearchParams();
  const searchParamKey = searchParams.toString();
  const { showToast } = useToast();
  const { projects } = useProjects();
  const {
    startScan,
    exportGraph,
    graph,
    metrics,
    scanStatus,
    progress,
    progressMessage,
    error,
    loadScanById,
    loadLatestScanForRepository,
  } = useScan();

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [languages, setLanguages] = useState({ js: true, ts: true, jsx: true, tsx: true });
  const [depth, setDepth] = useState(5);
  const [astEnabled, setAstEnabled] = useState(true);
  const [includePattern, setIncludePattern] = useState('**/*.{js,ts,jsx,tsx}');
  const [excludePattern, setExcludePattern] = useState('**/node_modules/**');
  const [showCycles, setShowCycles] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [animate, setAnimate] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.projectId === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (projects.length === 0 || selectedProjectId) {
      return;
    }

    const projectIdFromQuery = searchParams.get('projectId');
    const initialProject = projectIdFromQuery
      ? projects.find((project) => project.projectId === projectIdFromQuery)
      : projects.find((project) => project.repositoryPath) || projects[0];

    if (initialProject) {
      setSelectedProjectId(initialProject.projectId);
      setRepoPath(searchParams.get('repoPath') || initialProject.repositoryPath || '');
    }
  }, [projects, searchParamKey, searchParams, selectedProjectId]);

  useEffect(() => {
    const repoPathFromQuery = searchParams.get('repoPath');
    const scanIdFromQuery = searchParams.get('scanId');
    const projectIdFromQuery = searchParams.get('projectId');

    if (projectIdFromQuery && projectIdFromQuery !== selectedProjectId && projects.some((project) => project.projectId === projectIdFromQuery)) {
      return;
    }

    const targetRepoPath = repoPathFromQuery || selectedProject?.repositoryPath || '';
    if (targetRepoPath) {
      setRepoPath(targetRepoPath);
    }

    const hydrateGraph = async () => {
      try {
        if (scanIdFromQuery) {
          await loadScanById(scanIdFromQuery);
          return;
        }

        await loadLatestScanForRepository(targetRepoPath);
      } catch (err) {
        showToast('error', 'Failed to load scan data');
      }
    };

    hydrateGraph();
  }, [loadLatestScanForRepository, loadScanById, projects, searchParamKey, searchParams, selectedProject?.repositoryPath, selectedProjectId, showToast]);

  const handleProjectChange = async (projectId) => {
    setSelectedProjectId(projectId);

    const nextProject = projects.find((project) => project.projectId === projectId);
    const nextRepoPath = nextProject?.repositoryPath || '';
    setRepoPath(nextRepoPath);

    await loadLatestScanForRepository(nextRepoPath);
  };

  const handleScan = async () => {
    const trimmedPath = repoPath.trim();
    if (!trimmedPath) {
      showToast('error', 'Repository path is required');
      return;
    }

    await startScan({
      repositoryPath: trimmedPath,
      fileExtensions: Object.keys(languages)
        .filter((extension) => languages[extension])
        .map((extension) => `.${extension}`)
        .join(','),
      maxDepth: depth,
      useAST: astEnabled,
      includePattern,
      excludePattern,
    });
  };

  const currentMetrics = metrics || {
    nodesCount: 0,
    edgesCount: 0,
    cyclesCount: 0,
    fanInTop5: [],
    fanOutTop5: [],
  };

  const isScanning = scanStatus === 'scanning';
  const scanComplete = scanStatus === 'completed' && (graph?.nodes?.length || 0) > 0;

  return (
    <div className="h-full bg-[#1E1E2E] flex flex-1 overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-[260px] bg-[#2A2A3C] border-r border-[#3E3E52] p-4 flex flex-col gap-3 overflow-y-auto">
        <h2 className="text-[#E6E6E8] font-semibold text-lg">Dependency Analyzer</h2>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#A0A0AB]">Project</label>
          <div className="relative">
            <select value={selectedProjectId} onChange={(e) => handleProjectChange(e.target.value)} className="appearance-none w-full px-3 py-2 bg-[#1E1E2E] border border-[#3E3E52] rounded text-sm text-[#E6E6E8] focus:outline-none focus:ring-1 focus:ring-[#4F8EF7]">
              {projects.length === 0 && <option value="">No projects available</option>}
              {projects.map((project) => (
                <option key={project.projectId} value={project.projectId}>{project.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0AB] pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#A0A0AB]">Repository Path</label>
          <input
            type="text"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            placeholder="C:\\Users\\admin\\projects\\my-repo"
            className="px-3 py-2 bg-[#1E1E2E] border border-[#3E3E52] rounded text-sm text-[#E6E6E8] placeholder:text-[#A0A0AB] focus:outline-none focus:ring-1 focus:ring-[#4F8EF7]"
          />
          {selectedProject && !selectedProject.repositoryPath && (
            <p className="text-xs text-[#A0A0AB]">This project has no saved repository path yet. You can still scan by entering a local path here.</p>
          )}
        </div>

        <button onClick={handleScan} disabled={isScanning} className="flex items-center justify-center gap-2 px-4 py-2 bg-[#4F8EF7] hover:bg-[#3D7DE6] text-white rounded transition-colors disabled:opacity-50">
          <Scan className="w-4 h-4" />
          <span className="text-sm">{isScanning ? 'Scanning...' : 'Scan Repository'}</span>
        </button>

        {error && <div className="text-red-400 text-xs mt-2 p-2 bg-red-400/10 border border-red-400/30 rounded">{error}</div>}

        <div className="mt-2">
          <button onClick={() => setIsConfigOpen(!isConfigOpen)} className="flex items-center gap-2 w-full text-left py-2">
            {isConfigOpen ? <ChevronDown className="w-4 h-4 text-[#A0A0AB]" /> : <ChevronRight className="w-4 h-4 text-[#A0A0AB]" />}
            <span className="text-sm text-[#E6E6E8]">Configuration</span>
          </button>
          {isConfigOpen && (
            <div className="flex flex-col gap-4 mt-3 pl-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-[#A0A0AB]">Languages</label>
                {Object.entries(languages).map(([lang, checked]) => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={(e) => setLanguages((current) => ({ ...current, [lang]: e.target.checked }))} className="w-4 h-4 rounded border-[#3E3E52] bg-[#1E1E2E] accent-[#4F8EF7]" />
                    <span className="text-xs text-[#E6E6E8] uppercase">{lang}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-[#A0A0AB]">Depth: {depth}</label>
                <input type="range" min={1} max={10} value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="w-full accent-[#4F8EF7]" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#A0A0AB]">AST Analysis</label>
                <button onClick={() => setAstEnabled((current) => !current)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${astEnabled ? 'bg-[#4F8EF7]' : 'bg-[#3E3E52]'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${astEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-[#A0A0AB]">Include Pattern</label>
                <input type="text" value={includePattern} onChange={(e) => setIncludePattern(e.target.value)} className="px-2 py-1.5 bg-[#1E1E2E] border border-[#3E3E52] rounded text-xs text-[#E6E6E8] focus:outline-none focus:ring-1 focus:ring-[#4F8EF7]" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-[#A0A0AB]">Exclude Pattern</label>
                <input type="text" value={excludePattern} onChange={(e) => setExcludePattern(e.target.value)} className="px-2 py-1.5 bg-[#1E1E2E] border border-[#3E3E52] rounded text-xs text-[#E6E6E8] focus:outline-none focus:ring-1 focus:ring-[#4F8EF7]" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-[#3E3E52] space-y-2">
          {[['Show Cycles', showCycles, setShowCycles], ['Show Labels', showLabels, setShowLabels], ['Animate', animate, setAnimate]].map(([label, value, setter]) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} className="w-4 h-4 rounded bg-[#1E1E2E] border-[#3E3E52] accent-[#4F8EF7]" />
              <span className="text-sm text-[#A0A0AB]">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <GraphViewer graph={graph} scanStatus={scanStatus} progress={progress} progressMessage={progressMessage} />

      <div className="w-[300px] bg-[#2A2A3C] border-l border-[#3E3E52] p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="bg-[#1E1E2E] border border-[#3E3E52] rounded p-4">
          <h3 className="text-sm text-[#E6E6E8] mb-4">Metrics</h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center"><span className="text-xs text-[#A0A0AB]">Total Files</span><span className="text-sm text-[#E6E6E8]">{currentMetrics.nodesCount}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs text-[#A0A0AB]">Total Dependencies</span><span className="text-sm text-[#E6E6E8]">{currentMetrics.edgesCount}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs text-[#A0A0AB]">Cycles Detected</span><span className={`text-sm font-semibold ${currentMetrics.cyclesCount > 0 ? 'text-[#F85149]' : 'text-[#43D9AD]'}`}>{currentMetrics.cyclesCount}</span></div>
          </div>
        </div>
        <div className="bg-[#1E1E2E] border border-[#3E3E52] rounded p-4">
          <h3 className="text-sm text-[#E6E6E8] mb-3">Top 5 Fan-In</h3>
          <div className="flex flex-col gap-2">
            {currentMetrics.fanInTop5.length === 0 && <span className="text-xs text-[#A0A0AB]">No scan metrics yet.</span>}
            {currentMetrics.fanInTop5.map((item, index) => (
              <div key={`${item.file}-${index}`} className="flex justify-between items-center">
                <span className="text-xs text-[#A0A0AB] truncate flex-1">{item.file || item.name}</span>
                <span className="text-xs text-[#4F8EF7] ml-2">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#1E1E2E] border border-[#3E3E52] rounded p-4">
          <h3 className="text-sm text-[#E6E6E8] mb-3">Top 5 Fan-Out</h3>
          <div className="flex flex-col gap-2">
            {currentMetrics.fanOutTop5.length === 0 && <span className="text-xs text-[#A0A0AB]">No scan metrics yet.</span>}
            {currentMetrics.fanOutTop5.map((item, index) => (
              <div key={`${item.file}-${index}`} className="flex justify-between items-center">
                <span className="text-xs text-[#A0A0AB] truncate flex-1">{item.file || item.name}</span>
                <span className="text-xs text-[#43D9AD] ml-2">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#1E1E2E] border border-[#3E3E52] rounded p-4">
          <h3 className="text-sm text-[#E6E6E8] mb-3">Export</h3>
          <div className="flex flex-col gap-2">
            {[['dot', FileCode, '#4F8EF7', 'Export DOT'], ['csv', FileText, '#43D9AD', 'Export CSV'], ['png', Image, '#FF9F40', 'Export PNG']].map(([format, Icon, color, label]) => (
              <button key={format} onClick={() => exportGraph(format)} disabled={!scanComplete} className="flex items-center gap-2 px-3 py-2 bg-[#2A2A3C] hover:bg-[#3E3E52] border border-[#3E3E52] rounded transition-colors disabled:opacity-50">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-xs text-[#E6E6E8]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
