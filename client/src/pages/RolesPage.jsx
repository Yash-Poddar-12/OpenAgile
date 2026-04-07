import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';

const initialRoles = [
  {
    name: 'Admin', memberCount: 3, color: '#EF4444', badgeColor: '#DC2626',
    permissions: [
      { feature: 'File-Map Scan', allowed: true }, { feature: 'View Projects', allowed: true },
      { feature: 'Edit Issues', allowed: true }, { feature: 'Kanban', allowed: true },
      { feature: 'Export', allowed: true }, { feature: 'Admin Panel', allowed: true },
    ],
  },
  {
    name: 'Project Manager', memberCount: 8, color: '#8B5CF6', badgeColor: '#7C3AED',
    permissions: [
      { feature: 'File-Map Scan', allowed: true }, { feature: 'View Projects', allowed: true },
      { feature: 'Edit Issues', allowed: true }, { feature: 'Kanban', allowed: true },
      { feature: 'Export', allowed: true }, { feature: 'Admin Panel', allowed: false },
    ],
  },
  {
    name: 'Developer', memberCount: 24, color: '#10B981', badgeColor: '#059669',
    permissions: [
      { feature: 'File-Map Scan', allowed: true }, { feature: 'View Projects', allowed: true },
      { feature: 'Edit Issues', allowed: true }, { feature: 'Kanban', allowed: true },
      { feature: 'Export', allowed: false }, { feature: 'Admin Panel', allowed: false },
    ],
  },
  {
    name: 'RepoAnalyst', memberCount: 5, color: '#F59E0B', badgeColor: '#D97706',
    permissions: [
      { feature: 'File-Map Scan', allowed: true }, { feature: 'View Projects', allowed: true },
      { feature: 'Edit Issues', allowed: false }, { feature: 'Kanban', allowed: true },
      { feature: 'Export', allowed: true }, { feature: 'Admin Panel', allowed: false },
    ],
  },
  {
    name: 'Viewer', memberCount: 15, color: '#6B7280', badgeColor: '#4B5563',
    permissions: [
      { feature: 'File-Map Scan', allowed: false }, { feature: 'View Projects', allowed: true },
      { feature: 'Edit Issues', allowed: false }, { feature: 'Kanban', allowed: true },
      { feature: 'Export', allowed: false }, { feature: 'Admin Panel', allowed: false },
    ],
  },
];

export function RolesPage() {
  const [roles, setRoles] = useState(initialRoles);

  const togglePermission = (roleIdx, featIdx) => {
    setRoles(prev => prev.map((role, ri) => ri !== roleIdx ? role : {
      ...role,
      permissions: role.permissions.map((p, fi) => fi !== featIdx ? p : { ...p, allowed: !p.allowed }),
    }));
  };

  return (
    <div className="h-full bg-[#1E1E2E] p-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Roles & Permissions</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium">
            <Plus className="w-5 h-5" />Create Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, roleIdx) => (
            <div key={role.name} className="bg-[#252535] rounded-lg p-6 border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
              style={{ borderColor: role.color }}>
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg text-white">{role.name}</h3>
                  <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: role.badgeColor, color: '#fff' }}>
                    {role.memberCount} {role.memberCount === 1 ? 'member' : 'members'}
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
                      {role.permissions.map((perm, featIdx) => (
                        <tr key={perm.feature} className={featIdx !== role.permissions.length - 1 ? 'border-b border-gray-800' : ''}>
                          <td className="text-sm text-gray-300 px-3 py-2.5">{perm.feature}</td>
                          <td className="text-center px-3 py-2.5">
                            <button onClick={() => togglePermission(roleIdx, featIdx)} className="hover:scale-110 transition-transform" title="Toggle permission">
                              {perm.allowed ? <Check className="inline-block w-4 h-4 text-green-500" /> : <X className="inline-block w-4 h-4 text-red-500" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <button className="w-full bg-[#1E1E2E] hover:bg-[#2A2A3E] text-gray-300 py-2 rounded-md text-sm font-medium transition-colors border border-gray-700">
                Edit Permissions
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}