import { useEffect, useMemo, useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import Modal from '../components/common/Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const permissionMeta = [
  { key: 'fileMapScan', feature: 'File-Map Scan' },
  { key: 'viewProjects', feature: 'View Projects' },
  { key: 'editIssues', feature: 'Edit Issues' },
  { key: 'kanban', feature: 'Kanban' },
  { key: 'export', feature: 'Export' },
  { key: 'adminPanel', feature: 'Admin Panel' },
];

export function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    roleName: '',
    color: '#4F8EF7',
    permissions: {
      fileMapScan: false,
      viewProjects: false,
      editIssues: false,
      kanban: false,
      export: false,
      adminPanel: false,
    },
  });
  const { showToast } = useToast();

  const memberCounts = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
  }, [users]);

  const fetchRoleData = async () => {
    try {
      setLoading(true);
      const [rolesRes, usersRes] = await Promise.all([
        api.get('/roles'),
        api.get('/users'),
      ]);

      setRoles(rolesRes.data.roles || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      showToast('error', 'Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleData();
  }, []);

  const togglePermission = async (roleName, permissionKey, currentValue) => {
    try {
      const response = await api.patch(`/roles/${roleName}`, {
        permissions: {
          [permissionKey]: !currentValue,
        },
      });

      const updatedRole = response.data.role;
      setRoles((current) =>
        current.map((role) => (role.roleName === updatedRole.roleName ? updatedRole : role))
      );
      showToast('success', 'Role permissions updated');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to update permissions');
    }
  };

  const handleCreateRole = async (event) => {
    event.preventDefault();

    try {
      const response = await api.post('/roles', newRole);
      setRoles((current) => [...current, response.data.role]);
      setIsCreateModalOpen(false);
      setNewRole({
        roleName: '',
        color: '#4F8EF7',
        permissions: {
          fileMapScan: false,
          viewProjects: false,
          editIssues: false,
          kanban: false,
          export: false,
          adminPanel: false,
        },
      });
      showToast('success', 'Role created successfully');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to create role');
    }
  };

  return (
    <div className="h-full bg-[#1E1E2E] p-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Roles & Permissions</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />Create Role
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading roles...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => {
              const badgeColor = role.color;
              const permissions = permissionMeta.map(({ key, feature }) => ({
                key,
                feature,
                allowed: Boolean(role.permissions?.[key]),
              }));

              return (
                <div
                  key={role.roleName}
                  className="bg-[#252535] rounded-lg p-6 border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                  style={{ borderColor: role.color }}
                >
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-white">{role.roleName}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: badgeColor, color: '#fff' }}>
                        {memberCounts[role.roleName] || 0} {(memberCounts[role.roleName] || 0) === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="bg-[#1E1E2E] rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left text-xs font-medium text-gray-400 px-3 py-2">Feature</th>
                            <th className="text-center text-xs font-medium text-gray-400 px-3 py-2 w-16">Access</th>
                          </tr>
                        </thead>
                        <tbody>
                          {permissions.map((permission, index) => (
                            <tr key={permission.key} className={index !== permissions.length - 1 ? 'border-b border-gray-800' : ''}>
                              <td className="text-sm text-gray-300 px-3 py-2.5">{permission.feature}</td>
                              <td className="text-center px-3 py-2.5">
                                <button
                                  onClick={() => togglePermission(role.roleName, permission.key, permission.allowed)}
                                  className="hover:scale-110 transition-transform"
                                  title={`Toggle ${permission.feature}`}
                                >
                                  {permission.allowed ? <Check className="inline-block w-4 h-4 text-green-500" /> : <X className="inline-block w-4 h-4 text-red-500" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="w-full bg-[#1E1E2E] text-gray-300 py-2 rounded-md text-sm font-medium border border-gray-700 text-center">
                    Live Permissions
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Role" size="sm">
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Role Name</label>
            <input
              type="text"
              required
              value={newRole.roleName}
              onChange={(event) => setNewRole((current) => ({ ...current, roleName: event.target.value }))}
              className="w-full rounded-lg border border-[#33334a] bg-[#1E1E2E] px-3 py-2 text-sm text-white focus:border-[#4F8EF7] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Accent Color</label>
            <input
              type="color"
              value={newRole.color}
              onChange={(event) => setNewRole((current) => ({ ...current, color: event.target.value }))}
              className="h-10 w-full rounded-lg border border-[#33334a] bg-[#1E1E2E] px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Permissions</label>
            <div className="space-y-2">
              {permissionMeta.map((permission) => (
                <label key={permission.key} className="flex items-center justify-between rounded-lg border border-[#33334a] bg-[#1E1E2E] px-3 py-2 text-sm text-gray-300">
                  <span>{permission.feature}</span>
                  <input
                    type="checkbox"
                    checked={newRole.permissions[permission.key]}
                    onChange={(event) =>
                      setNewRole((current) => ({
                        ...current,
                        permissions: {
                          ...current.permissions,
                          [permission.key]: event.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 accent-[#4F8EF7]"
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="rounded-lg border border-[#33334a] px-4 py-2 text-sm text-gray-300 hover:bg-[#1E1E2E]">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-[#4F8EF7] px-4 py-2 text-sm text-white hover:bg-[#3D7DE6]">
              Create Role
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
