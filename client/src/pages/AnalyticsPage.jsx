import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Download, Activity, TrendingUp, Database, GitBranch, RefreshCw, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const getRepoLabel = (repoPath, fallback = 'Unknown Repository') => {
  if (typeof repoPath !== 'string' || repoPath.trim().length === 0) {
    return fallback;
  }

  const segments = repoPath.split(/[/\\]/).filter(Boolean);
  return segments[segments.length - 1] || repoPath;
};

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState('7');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [analytics, setAnalytics] = useState({
    totalScans: 0,
    avgCyclesDetected: 0,
    mostScannedRepo: 'None',
    trend: [],
    history: [],
  });

  const fetchAnalytics = async (days = selectedDays, repoPath = selectedRepo) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ days });
      if (repoPath) {
        query.set('repoPath', repoPath);
      }

      const res = await api.get(`/analytics?${query.toString()}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedDays, selectedRepo);
  }, [selectedDays, selectedRepo]);

  const repoOptions = useMemo(() => {
    const uniquePaths = [...new Set((analytics.history || []).map((scan) => scan.repoPath).filter(Boolean))];
    return uniquePaths;
  }, [analytics.history]);

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);

  return (
    <div className="h-full bg-[#1E1E2E]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-[1600px] mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-white text-2xl font-semibold mb-2">Scan History & Analytics</h1>
          <p className="text-[#9ca3af]">Monitor repository scans and track dependency cycles</p>
        </div>

        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <div className="relative">
            <select value={selectedDays} onChange={(e) => setSelectedDays(e.target.value)} className="appearance-none flex items-center gap-2 bg-[#252538] hover:bg-[#2a2a40] border border-[#3a3a50] text-white px-4 py-2.5 pr-10 rounded-lg transition-colors">
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
          </div>
          <div className="relative">
            <select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)} className="appearance-none flex items-center gap-2 bg-[#252538] hover:bg-[#2a2a40] border border-[#3a3a50] text-white px-4 py-2.5 pr-10 rounded-lg transition-colors min-w-[220px]">
              <option value="">All Repositories</option>
              {repoOptions.map((repoPath) => (
                <option key={repoPath} value={repoPath}>{getRepoLabel(repoPath)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
          </div>
          <div className="flex-1" />
          <button onClick={() => fetchAnalytics()} className="flex items-center gap-2 bg-[#252538] hover:bg-[#2a2a40] border border-[#3a3a50] text-white px-4 py-2.5 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button onClick={() => navigate('/export')} className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2.5 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Open Export</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-[#9ca3af]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { title: 'Total Scans', value: analytics.totalScans.toLocaleString(), icon: <Activity className="w-6 h-6" />, color: '#3b82f6' },
                  { title: 'Average Cycles Detected', value: analytics.avgCyclesDetected, icon: <TrendingUp className="w-6 h-6" />, color: '#10b981' },
                  { title: 'Most Scanned Repo', value: getRepoLabel(analytics.mostScannedRepo, 'None'), icon: <Database className="w-6 h-6" />, color: '#8b5cf6' },
              ].map((card) => (
                <div key={card.title} className="bg-[#252538] border border-[#3a3a50] rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[#9ca3af] text-sm mb-2">{card.title}</p>
                      <p className="text-3xl text-white tracking-tight">{card.value}</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: `${card.color}20` }}>
                      <div style={{ color: card.color }}>{card.icon}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#252538] border border-[#3a3a50] rounded-lg p-6 mb-8">
              <h3 className="text-white mb-6 font-semibold">Cycles Detected Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a50" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#3a3a50' }} tickFormatter={(value) => value.slice(5)} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#3a3a50' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#252538', border: '1px solid #3a3a50', borderRadius: '8px', color: '#fff' }} labelStyle={{ color: '#9ca3af' }} />
                  <Line type="monotone" dataKey="cycles" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h3 className="text-white mb-4 font-semibold">Scan History</h3>
            <div className="bg-[#252538] border border-[#3a3a50] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#3a3a50]">
                      <th className="text-left py-4 px-4 text-[#9ca3af] text-sm w-8"></th>
                      <th className="text-left py-4 px-6 text-[#9ca3af] text-sm">Repository</th>
                      <th className="text-left py-4 px-6 text-[#9ca3af] text-sm">Scan Date</th>
                      <th className="text-right py-4 px-6 text-[#9ca3af] text-sm">Files</th>
                      <th className="text-right py-4 px-6 text-[#9ca3af] text-sm">Dependencies</th>
                      <th className="text-right py-4 px-6 text-[#9ca3af] text-sm">Cycles</th>
                      <th className="text-right py-4 px-6 text-[#9ca3af] text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.history.length === 0 ? (
                      <tr><td colSpan="7" className="py-4 text-center text-[#9ca3af]">No scans found</td></tr>
                    ) : analytics.history.map((scan) => (
                      <Fragment key={scan.graphId || scan._id}>
                        <tr className="border-b border-[#3a3a50] hover:bg-[#2a2a40] transition-colors cursor-pointer" onClick={() => toggleRow(scan.graphId || scan._id)}>
                          <td className="py-4 px-4">
                            {expandedRow === (scan.graphId || scan._id) ? <ChevronDown className="w-4 h-4 text-[#9ca3af]" /> : <ChevronRight className="w-4 h-4 text-[#9ca3af]" />}
                          </td>
                          <td className="py-4 px-6"><div className="flex items-center gap-2"><GitBranch className="w-4 h-4 text-[#3b82f6]" /><span className="text-white">{getRepoLabel(scan.repoPath)}</span></div></td>
                          <td className="py-4 px-6 text-[#9ca3af]">{new Date(scan.scannedAt).toLocaleString()}</td>
                          <td className="py-4 px-6 text-right text-white">{(scan.nodesCount || 0).toLocaleString()}</td>
                          <td className="py-4 px-6 text-right text-white">{scan.edgesCount || 0}</td>
                          <td className="py-4 px-6 text-right">
                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded ${(scan.cyclesCount || 0) > 0 ? 'bg-[#ef4444]/10 text-[#ef4444]' : 'bg-[#10b981]/10 text-[#10b981]'}`}>{scan.cyclesCount || 0}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => navigate(`/filemap?scanId=${scan.graphId}&repoPath=${encodeURIComponent(scan.repoPath)}`)} className="p-2 hover:bg-[#3a3a50] rounded transition-colors text-[#3b82f6]" title="View Graph">
                                <GitBranch className="w-4 h-4" />
                              </button>
                              <button onClick={() => navigate(`/filemap?repoPath=${encodeURIComponent(scan.repoPath)}`)} className="p-2 hover:bg-[#3a3a50] rounded transition-colors text-[#10b981]" title="Re-scan from File Map">
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedRow === (scan.graphId || scan._id) && (
                          <tr className="bg-[#2a2a40] border-b border-[#3a3a50]">
                            <td colSpan={7} className="py-6 px-6">
                              <div className="grid grid-cols-4 gap-6 max-w-4xl ml-10">
                                <div><p className="text-[#9ca3af] text-sm mb-1">Repository Path</p><p className="text-sm text-white break-all">{scan.repoPath}</p></div>
                                <div><p className="text-[#9ca3af] text-sm mb-1">Total Files</p><p className="text-2xl text-white">{(scan.nodesCount || 0).toLocaleString()}</p></div>
                                <div><p className="text-[#9ca3af] text-sm mb-1">Dependencies</p><p className="text-2xl text-white">{scan.edgesCount || 0}</p></div>
                                <div><p className="text-[#9ca3af] text-sm mb-1">Status</p><p className="text-xl text-white">{scan.status}</p></div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
