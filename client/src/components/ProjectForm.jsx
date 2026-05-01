import { useState } from 'react';
import API from '../api/axios';

const ProjectForm = ({ isOpen, onClose, onProjectCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await API.post('/projects', { name, description });
      onProjectCreated(res.data.data);
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-surface-200">
          <h2 className="text-xl font-bold text-surface-900">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-900 transition-colors cursor-pointer border-none bg-transparent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="project-name" className="block text-surface-700 text-sm font-semibold mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                id="project-name"
                className="input-field"
                placeholder="E.g., Website Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="project-desc" className="block text-surface-700 text-sm font-semibold mb-1.5">
                Description (Optional)
              </label>
              <textarea
                id="project-desc"
                className="input-field min-h-[100px] resize-y"
                placeholder="Brief description of the project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary py-2 px-6"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
