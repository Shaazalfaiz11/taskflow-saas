import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const TaskForm = ({ task, onSubmit, onClose }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!task;

  useEffect(() => {
    if (user?.role === 'admin' && !isEditing) {
      const fetchData = async () => {
        try {
          const [usersRes, projectsRes] = await Promise.all([
            API.get('/users'),
            API.get('/projects')
          ]);
          setUsers(usersRes.data.data);
          setProjects(projectsRes.data.data);
          if (usersRes.data.data.length > 0) setAssignedTo(usersRes.data.data[0].id);
          if (projectsRes.data.data.length > 0) setProjectId(projectsRes.data.data[0].id);
        } catch (err) {
          console.error("Failed to load options");
        }
      };
      fetchData();
    }
  }, [user, isEditing]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'pending');
      setPriority(task.priority || 'medium');
      setAssignedTo(task.assignedTo || '');
      setProjectId(task.projectId || '');
      if (task.dueDate) {
        setDueDate(new Date(task.dueDate).toISOString().split('T')[0]);
      }
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (user?.role === 'admin' && (!assignedTo || !projectId)) {
      setError('Please select a project and assign a user');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
      };

      if (user?.role === 'admin') {
        payload.assignedTo = assignedTo;
        payload.projectId = projectId;
        payload.dueDate = dueDate || null;
      }

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-slate-600' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-strong rounded-2xl p-6 w-full max-w-md animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-surface-900">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-900 transition-colors cursor-pointer border-none bg-transparent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-surface-700 text-sm font-semibold mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="task-title-input"
              className="input-field"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              readOnly={user?.role === 'member'}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-surface-700 text-sm font-semibold mb-1.5">
              Description
            </label>
            <textarea
              id="task-description-input"
              className="input-field min-h-[80px] resize-y"
              placeholder="Add a description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              readOnly={user?.role === 'member'}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-surface-700 text-sm font-semibold mb-2">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    priority === p.value
                      ? p.value === 'low' ? 'bg-slate-100 border-slate-300 text-slate-700 shadow-sm'
                        : p.value === 'medium' ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                        : p.value === 'high' ? 'bg-orange-50 border-orange-300 text-orange-700 shadow-sm'
                        : 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                      : 'bg-white border-surface-200 text-surface-500 hover:border-surface-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {user?.role === 'admin' && (
            <>
              <div>
                <label className="block text-surface-700 text-sm font-semibold mb-1.5">
                  Project <span className="text-red-400">*</span>
                </label>
                <select
                  className="input-field cursor-pointer"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="" disabled>Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-surface-700 text-sm font-semibold mb-1.5">
                  Assign To <span className="text-red-400">*</span>
                </label>
                <select
                  className="input-field cursor-pointer"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="" disabled>Select Team Member</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-surface-700 text-sm font-semibold mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-surface-700 text-sm font-semibold mb-1.5">
              Status
            </label>
            <select
              id="task-status-select"
              className="input-field cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">⏳ Pending</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="completed">✅ Completed</option>
            </select>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="task-submit-button"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditing ? 'Saving...' : 'Creating...'}
                </span>
              ) : (
                isEditing ? 'Save Changes' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
