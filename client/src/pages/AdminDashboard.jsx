import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FolderKanban, ScanSearch, AlertTriangle, Network, Edit, UserX, Circle, LayoutDashboard, Shield, History, FileText, Download, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const roleStyles = {
  Admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  Manager: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Developer: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  RepoAnalyst: 'bg-[#43D9AD]/10 text-[#43D9AD] border-[#43D9AD]/20',
  Viewer: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

function RoleBadge({ role }) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${roleStyles[role] || roleStyles.Viewer}`}>{role}</span>
  );
}

function MetricCard({ title, value, icon, trend }) {
  return (
    <div className="bg-[#252537] rounded-lg p-6 border border-[#2E2E42]">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-[#1E1E2E] rounded-lg border border-[#2E2E42]">{icon}</div>
        {trend && <span className={`text-sm ${trend.isPositive ? 'text-[#43D9AD]' : 'text-red-400'}`}>{trend.value}</span>}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-sm text-gray-400">{title}</p>
      </div>
    </div>
  );
}

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', to: '/admin' },
  { icon: Users, label: 'Users', id: 'users', to: '/admin' },
  { icon: FolderKanban, label: 'Projects', id: 'projects', to: '/dashboard' },
  { icon: Shield, label: 'Roles & Permissions', id: 'roles', to: '/roles' },
  { icon: History, label: 'Scan History', id: 'scan-history', to: '/analytics' },
  { icon: FileText, label: 'System Logs', id: 'system-logs', to: '/analytics' },
  { icon: Download, label: 'Export Reports', id: 'export-reports', to: '/export' },
];

export function AdminDashboard() {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState({ totalUsers: 0, activeProjects: 0, scansToday: 0, cyclesDetected: 0 });
  const [loading, setLoading] = useState(true);
  
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [usersRes, projectsRes, analyticsRes] = await Promise.all([
          api.get('/users'),
          api.get('/projects'),
          api.get('/analytics?days=1')
        ]);
        
        const allUsers = usersRes.data.users || [];
        setUsers(allUsers);
        
        const projCount = (projectsRes.data.projects || []).length;
        const scans = analyticsRes.data.totalScans || 0;
        const cycles = analyticsRes.data.avgCyclesDetected ? Math.round(analyticsRes.data.avgCyclesDetected * scans) : 0;
        
        setMetrics({ totalUsers: allUsers.length, activeProjects: projCount, scansToday: scans, cyclesDetected: cycles });
      } catch (err) {
        console.error('Failed to load admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleDeactivate = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.map(u => u.userId === userId || u.id === userId || u._id === userId ? { ...u, isActive: false } : u));
    } catch (err) {
      console.error('Failed to deactivate user', err);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">Dashboard</h1>
        <p className="text-sm text-gray-400">Welcome to File-Map Suite Admin Panel</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-full mt-20 text-[#4F8EF7]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Total Users" value={metrics.totalUsers} icon={<Users className="w-5 h-5 text-[#4F8EF7]" strokeWidth={2} />} trend={{ value: '+12.5%', isPositive: true }} />
            <MetricCard title="Active Projects" value={metrics.activeProjects} icon={<FolderKanban className="w-5 h-5 text-[#43D9AD]" strokeWidth={2} />} trend={{ value: '+8.2%', isPositive: true }} />
            <MetricCard title="Scans Today" value={metrics.scansToday} icon={<ScanSearch className="w-5 h-5 text-[#4F8EF7]" strokeWidth={2} />} trend={{ value: '-3.1%', isPositive: false }} />
            <MetricCard title="Cycles Detected" value={metrics.cyclesDetected} icon={<AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={2} />} trend={{ value: '-25.0%', isPositive: true }} />
          </div>

          <div className="bg-[#252537] rounded-lg border border-[#2E2E42] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2E2E42]">
              <h2 className="text-lg font-semibold text-white">Users Management</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2E2E42]">
                    {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E2E42]">
                  {users.map((user) => {
                    const isActive = user.isActive !== false && user.status !== 'Inactive';
                    const uid = user.userId || user.id || user._id;
                    return (
                    <tr key={uid} className="hover:bg-[#2E2E42]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#43D9AD] flex items-center justify-center border border-[#2E2E42]">
                            <span className="text-white text-xs font-medium">{(user.name || 'U').substring(0, 2).toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-medium text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm text-gray-400">{user.email}</span></td>
                      <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Circle className={`w-2 h-2 fill-current ${isActive ? 'text-[#43D9AD]' : 'text-gray-500'}`} />
                          <span className={`text-sm ${isActive ? 'text-[#43D9AD]' : 'text-gray-500'}`}>{isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 rounded-md bg-[#4F8EF7]/10 hover:bg-[#4F8EF7]/20 text-[#4F8EF7] transition-colors" title="Edit Role">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeactivate(uid)} disabled={!isActive} className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50" title="Deactivate">
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}