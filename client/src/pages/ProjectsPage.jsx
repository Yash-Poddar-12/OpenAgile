import { useState } from 'react';
import { FolderKanban, Plus, Archive, ExternalLink, Loader2, RotateCcw, Edit2 } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { Link } from 'react-router-dom';
import Modal from '../components/common/Modal';

function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-[#43D9AD20] text-[#43D9AD]' : 'bg-[#6b728080] text-[#9ca3af]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-[#43D9AD]' : 'bg-[#9ca3af]'}`} />
      {status || 'Unknown'}
    </span>
  );
}

export function ProjectsPage() {
  const {
    projects,
    loading,
    archiveProject,
    reactivateProject,
    updateProject,
    createProject,
  } = useProjects();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', repositoryPath: '' });

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '', repositoryPath: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({ 
      name: project.name || '', 
      description: project.description || '', 
      repositoryPath: project.repositoryPath || '' 
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    let success = false;
    
    if (editingProject) {
      success = await updateProject(editingProject.projectId, formData);
    } else {
      success = await createProject(formData);
    }

    if (success) setIsModalOpen(false);
  };

  return (
    <div className="p-8 space-y-8 pb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Projects Directory</h1>
          <p className="text-sm text-[#9ca3af]">Manage your workspaces, track status, and monitor team velocity.</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 bg-[#4F8EF7] hover:bg-[#3D7DE6] text-white px-4 py-2 rounded-lg transition-all font-medium text-sm shadow-lg shadow-[#4F8EF7]/20 active:scale-95">
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#4F8EF7]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-[#252537] rounded-lg border border-[#3a3a4a] p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#2a2a3e] rounded-full flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-[#9ca3af]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No Projects Found</h2>
          <p className="text-[#9ca3af] max-w-md mb-6">You don't have any active projects in your workspace yet. Create your first project to start tracking your work.</p>
          <button onClick={openCreateModal} className="bg-[#4F8EF7] hover:bg-[#3D7DE6] text-white px-6 py-2.5 rounded-lg transition-colors font-medium cursor-pointer">
            Create First Project
          </button>
        </div>
      ) : (
        <div className="bg-[#252537] rounded-lg border border-[#3a3a4a] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#2a2a3e] border-b border-[#3a3a4a]">
                  {['Project Name', 'Status', 'Repository', 'Created', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-[#9ca3af] text-xs font-semibold uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a3a4a]">
                {projects.map((project) => (
                  <tr key={project.projectId || project._id} className="hover:bg-[#2a2a3e]/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-[#3a3a4a] bg-[#1E1E2E] flex items-center justify-center shadow-inner">
                          <FolderKanban className="w-5 h-5 text-[#4F8EF7]" />
                        </div>
                        <div>
                          <span className="text-white font-medium block text-base group-hover:text-[#4F8EF7] transition-colors">{project.name}</span>
                          <span className="text-xs text-[#9ca3af]">ID: {project.projectId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5"><StatusBadge status={project.status || 'ACTIVE'} /></td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-[#9ca3af] font-mono">{project.repositoryPath || 'No repository linked'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-[#9ca3af]">{new Date(project.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/dashboard`} className="p-2 hover:bg-[#4F8EF7]/10 rounded-md text-[#4F8EF7] transition-colors" title="View Dashboard">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEditModal(project)} className="p-2 hover:bg-gray-500/10 rounded-md text-gray-400 transition-colors" title="Edit Project">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {project.status === 'ACTIVE' ? (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Archive ${project.name}?`)) {
                                await archiveProject(project.projectId);
                              }
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-md text-red-400 transition-colors"
                            title="Archive Project"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => reactivateProject(project.projectId)} className="p-2 hover:bg-green-500/10 rounded-md text-green-400 transition-colors" title="Reactivate Project">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProject ? "Edit Project" : "Create New Project"}>
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Project Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#1E1E2E] border border-[#33334a] rounded px-3 py-2 text-white text-sm focus:border-[#3B82F6] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#1E1E2E] border border-[#33334a] rounded px-3 py-2 text-white text-sm focus:border-[#3B82F6] focus:outline-none min-h-[100px]" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Local Repository Path (Optional)</label>
            <input type="text" value={formData.repositoryPath} onChange={e => setFormData({...formData, repositoryPath: e.target.value})} placeholder="C:\Projects\my-repo" className="w-full bg-[#1E1E2E] border border-[#33334a] rounded px-3 py-2 text-white text-sm font-mono focus:border-[#3B82F6] focus:outline-none" />
            <p className="text-xs text-gray-500 mt-1">Providing this enables the File Map Dependency Analyzer to scan your codebase.</p>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#33334a]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 hover:bg-[#33334a] text-white rounded text-sm transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded text-sm transition-colors">{editingProject ? 'Save Changes' : 'Create Project'}</button>
          </div>
        </form>
      </Modal>    
    </div>
  );
}
