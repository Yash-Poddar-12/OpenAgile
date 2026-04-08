import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FolderKanban, ScanSearch, AlertTriangle, Network, Edit, UserX, Circle, Loader2 } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

const roleStyles = {
  Admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  ProjectManager: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
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

export function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [metrics, setMetrics] = useState({ totalUsers: 0, activeProjects: 0, scansToday: 0, cyclesDetected: 0 });
  const [loading, setLoading] = useState(true);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [isSavingRole, setIsSavingRole] = useState(false);
  const { showToast } = useToast();

  const roleNames = useMemo(() => roles.map((role) => role.roleName), [roles]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, projectsRes, analyticsRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/projects'),
        api.get('/analytics?days=1'),
        api.get('/roles'),
      ]);

      const allUsers = usersRes.data.users || [];
      const allRoles = rolesRes.data.roles || [];
      setUsers(allUsers);
      setRoles(allRoles);

      const projCount = (projectsRes.data.projects || []).length;
      const scans = analyticsRes.data.totalScans || 0;
      const cycles = analyticsRes.data.avgCyclesDetected
        ? Math.round(analyticsRes.data.avgCyclesDetected * scans)
        : 0;

      setMetrics({
        totalUsers: allUsers.length,
        activeProjects: projCount,
        scansToday: scans,
        cyclesDetected: cycles,
      });
    } catch (err) {
      showToast('error', 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeactivate = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      setUsers((current) =>
        current.map((user) =>
          user.userId === userId || user.id === userId || user._id === userId
            ? { ...user, isActive: false }
            : user
        )
      );
      showToast('success', 'User deactivated');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to deactivate user');
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role || '');
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (event) => {
    event.preventDefault();
    if (!selectedUser || !selectedRole) return;

    try {
      setIsSavingRole(true);
      const response = await api.patch(`/users/${selectedUser.userId}/role`, { role: selectedRole });
      const updatedUser = response.data.user;
      setUsers((current) =>
        current.map((user) => (user.userId === updatedUser.userId ? updatedUser : user))
      );
      setIsRoleModalOpen(false);
      showToast('success', 'User role updated');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to update user role');
    } finally {
      setIsSavingRole(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">Dashboard</h1>
        <p className="text-sm text-gray-400">Welcome to File-Map Suite Admin Panel</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to="/roles" className="rounded-lg border border-[#2E2E42] bg-[#252537] px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white">
          Roles & Permissions
        </Link>
        <Link to="/dashboard" className="rounded-lg border border-[#2E2E42] bg-[#252537] px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white">
          PM Dashboard View
        </Link>
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
                    {['Name', 'Email', 'Role', 'Status', 'Actions'].map((heading) => (
                      <th key={heading} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{heading}</th>
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
                            <button
                              onClick={() => openRoleModal(user)}
                              className="p-1.5 rounded-md bg-[#4F8EF7]/10 hover:bg-[#4F8EF7]/20 text-[#4F8EF7] transition-colors"
                              title="Edit Role"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeactivate(uid)}
                              disabled={!isActive}
                              className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                              title="Deactivate"
                            >
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

      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="Update User Role" size="sm">
        <form onSubmit={handleSaveRole} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">User</label>
            <div className="rounded-lg border border-[#33334a] bg-[#1E1E2E] px-3 py-2 text-white text-sm">
              {selectedUser?.name} {selectedUser?.email ? `(${selectedUser.email})` : ''}
            </div>
          </div>
          <div>
            <label htmlFor="role-select" className="block text-sm text-gray-400 mb-2">Role</label>
            <select
              id="role-select"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className="w-full rounded-lg border border-[#33334a] bg-[#1E1E2E] px-3 py-2 text-sm text-white focus:border-[#4F8EF7] focus:outline-none"
              required
            >
              <option value="">Select role</option>
              {roleNames.map((roleName) => (
                <option key={roleName} value={roleName}>{roleName}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsRoleModalOpen(false)} className="rounded-lg border border-[#33334a] px-4 py-2 text-sm text-gray-300 hover:bg-[#1E1E2E]">
              Cancel
            </button>
            <button type="submit" disabled={isSavingRole} className="rounded-lg bg-[#4F8EF7] px-4 py-2 text-sm text-white hover:bg-[#3D7DE6] disabled:opacity-60">
              {isSavingRole ? 'Saving...' : 'Save Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
