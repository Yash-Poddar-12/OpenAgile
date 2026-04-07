import { useEffect, useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';
import { useExport } from '../hooks/useExport';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const exportOptions = [
  { id: 'dep-graph-dot', name: 'Dependency Graph', fileType: 'DOT', generatorType: 'DOT', sizeEstimate: '~45 KB' },
  { id: 'dep-graph-png', name: 'Dependency Graph', fileType: 'PNG', generatorType: 'PNG', sizeEstimate: '~2.3 MB' },
  { id: 'issue-list', name: 'Issue List', fileType: 'CSV', generatorType: 'CSV', sizeEstimate: '~128 KB' },
  { id: 'sprint-report', name: 'Sprint Report', fileType: 'PDF', generatorType: 'SPRINT_PDF', sizeEstimate: '~890 KB' },
  { id: 'comparison-report', name: 'Comparison Report', fileType: 'PDF', generatorType: 'COMPARISON', sizeEstimate: '~1.2 MB' },
  { id: 'srs-document', name: 'SRS Document', fileType: 'DOCX', generatorType: 'DOCX', sizeEstimate: '~456 KB' },
  { id: 'full-package', name: 'Full Package', fileType: 'ZIP', generatorType: 'FULL_ZIP', sizeEstimate: '~5.8 MB' },
];

const getTypeBadgeColor = (type) => {
  const map = { PDF: 'bg-red-500/20 text-red-300', PNG: 'bg-purple-500/20 text-purple-300', CSV: 'bg-green-500/20 text-green-300', ZIP: 'bg-blue-500/20 text-blue-300', DOT: 'bg-yellow-500/20 text-yellow-300', DOCX: 'bg-cyan-500/20 text-cyan-300' };
  return map[type.toUpperCase()] || 'bg-gray-500/20 text-gray-300';
};

export function ExportPage() {
  const [selectedOptions, setSelectedOptions] = useState(new Set());
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const { recentExports, recentScans, generating: isGenerating, generateExport } = useExport();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        const nextProjects = res.data.projects || [];
        setProjects(nextProjects);
        if (nextProjects.length > 0) {
          setProjectId(nextProjects[0].projectId);
        }
      } catch (err) {
        showToast('error', 'Failed to load projects');
      }
    };

    fetchProjects();
  }, [showToast]);

  const toggleOption = (id) => {
    const next = new Set(selectedOptions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOptions(next);
  };

  const handleGenerate = async () => {
    if (selectedOptions.size === 0) {
      showToast('error', 'Please select at least one artifact to export.');
      return;
    }

    const types = Array.from(selectedOptions)
      .map((id) => exportOptions.find((option) => option.id === id)?.generatorType)
      .filter(Boolean);

    await generateExport(types, projectId || undefined);
  };

  const comparisonSummary = useMemo(() => {
    const [latest, previous] = recentScans || [];
    return {
      latest,
      previous,
      fileDelta: (latest?.nodesCount || 0) - (previous?.nodesCount || 0),
      dependencyDelta: (latest?.edgesCount || 0) - (previous?.edgesCount || 0),
      cycleDelta: (latest?.cyclesCount || 0) - (previous?.cyclesCount || 0),
    };
  }, [recentScans]);

  return (
    <div className="h-full bg-[#1E1E2E] text-white p-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Export and Reports</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#252535] rounded-lg p-6 border border-gray-700/50">
            <h2 className="text-xl font-medium mb-6">Select Artifacts to Export</h2>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Project</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full bg-[#2A2A3C] border border-gray-700/50 rounded-lg px-4 py-3 text-white">
                {projects.length === 0 && <option value="">No projects available</option>}
                {projects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>{project.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3 mb-6">
              {exportOptions.map((option) => (
                <label key={option.id} className="flex items-center justify-between p-4 bg-[#2A2A3C] rounded-lg cursor-pointer hover:bg-[#2F2F42] transition-colors">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={selectedOptions.has(option.id)} onChange={() => toggleOption(option.id)} className="w-4 h-4 rounded border-gray-600 bg-[#1E1E2E] text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer" />
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getTypeBadgeColor(option.fileType)}`}>{option.fileType}</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{option.sizeEstimate}</span>
                </label>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <FileDown className="w-5 h-5" />
              {isGenerating ? 'Generating...' : 'Generate Export'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-[#252535] rounded-lg p-6 border border-gray-700/50">
              <h2 className="text-xl font-medium mb-6">Recent Exports</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Filename</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Types</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Generated At</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-400">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExports.length === 0 ? (
                      <tr><td colSpan="4" className="py-6 text-center text-gray-500">No recent exports found</td></tr>
                    ) : recentExports.map((item) => (
                      <tr key={item.exportId || item.id || item._id} className="border-b border-gray-700/50 hover:bg-[#2A2A3C] transition-colors">
                        <td className="py-3 px-2 text-sm">{item.filename || `export-${(item.exportId || '').substring(0, 8)}.zip`}</td>
                        <td className="py-3 px-2 text-sm text-gray-400">{(item.artifactTypes || []).join(', ') || item.format || 'Archive'}</td>
                        <td className="py-3 px-2 text-sm text-gray-400">{new Date(item.generatedAt || item.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-2 text-sm text-gray-400">{item.size || `${((item.sizeBytes || 0) / 1024).toFixed(1)} KB`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#252535] rounded-lg p-6 border border-gray-700/50">
              <h2 className="text-xl font-medium mb-6">Comparison Report Preview</h2>
              {!comparisonSummary.latest ? (
                <div className="text-sm text-gray-500">Run at least one repository scan to preview comparison metrics here.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#2A2A3C] rounded-lg p-4 border border-gray-700/30">
                      <div className="text-sm text-gray-400 mb-3">Previous Scan</div>
                      <div className="space-y-3">
                        <div><div className="text-2xl font-semibold" style={{ color: '#6EEDC5' }}>{comparisonSummary.previous?.nodesCount ?? 0}</div><div className="text-xs text-gray-500">Files</div></div>
                        <div><div className="text-2xl font-semibold" style={{ color: '#6EEDC5' }}>{comparisonSummary.previous?.edgesCount ?? 0}</div><div className="text-xs text-gray-500">Dependencies</div></div>
                        <div><div className="text-2xl font-semibold" style={{ color: '#6EEDC5' }}>{comparisonSummary.previous?.cyclesCount ?? 0}</div><div className="text-xs text-gray-500">Cycles</div></div>
                      </div>
                    </div>
                    <div className="bg-[#2A2A3C] rounded-lg p-4 border border-gray-700/30">
                      <div className="text-sm text-gray-400 mb-3">Latest Scan</div>
                      <div className="space-y-3">
                        <div><div className="text-2xl font-semibold text-blue-400">{comparisonSummary.latest.nodesCount ?? 0}</div><div className="text-xs text-gray-500">Files</div></div>
                        <div><div className="text-2xl font-semibold text-blue-400">{comparisonSummary.latest.edgesCount ?? 0}</div><div className="text-xs text-gray-500">Dependencies</div></div>
                        <div><div className="text-2xl font-semibold text-blue-400">{comparisonSummary.latest.cyclesCount ?? 0}</div><div className="text-xs text-gray-500">Cycles</div></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div><div className="text-lg font-semibold text-green-400">{comparisonSummary.fileDelta >= 0 ? '+' : ''}{comparisonSummary.fileDelta}</div><div className="text-xs text-gray-500">Files Delta</div></div>
                      <div><div className="text-lg font-semibold text-green-400">{comparisonSummary.dependencyDelta >= 0 ? '+' : ''}{comparisonSummary.dependencyDelta}</div><div className="text-xs text-gray-500">Dependencies Delta</div></div>
                      <div><div className={`text-lg font-semibold ${comparisonSummary.cycleDelta <= 0 ? 'text-green-400' : 'text-red-400'}`}>{comparisonSummary.cycleDelta >= 0 ? '+' : ''}{comparisonSummary.cycleDelta}</div><div className="text-xs text-gray-500">Cycles Delta</div></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
