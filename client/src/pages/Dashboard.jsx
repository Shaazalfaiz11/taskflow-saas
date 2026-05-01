import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import ProjectForm from '../components/ProjectForm';

const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const searchTimeout = useRef(null);

  const fetchTasks = useCallback(async () => {
    try {
      setError('');
      const params = {};
      if (filter === 'overdue') {
        params.overdue = 'true';
      } else if (filter !== 'all') {
        params.status = filter;
      }
      if (projectFilter !== 'all') {
        params.projectId = projectFilter;
      }
      if (priorityFilter !== 'all') {
        params.priority = priorityFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await API.get('/tasks', { params });
      setTasks(res.data.data.tasks);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, projectFilter, priorityFilter, searchQuery]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data.data);
    } catch (err) {
      console.error('Failed to load projects');
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await API.get('/activity?limit=8');
      setActivityLogs(res.data.data.logs);
    } catch (err) {
      console.error('Failed to load activity');
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'admin') {
      fetchProjects();
      fetchActivity();
    }
  }, [fetchTasks, fetchProjects, fetchActivity, user?.role]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    // Debounce handled by useCallback dependency
  };

  const handleCreateTask = async (taskData) => {
    await API.post('/tasks', taskData);
    fetchTasks();
    fetchActivity();
    addToast('Task created successfully!', 'success');
  };

  const handleUpdateTask = async (taskData) => {
    await API.put(`/tasks/${editingTask.id}`, taskData);
    setEditingTask(null);
    fetchTasks();
    fetchActivity();
    addToast('Task updated successfully!', 'success');
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      fetchTasks();
      fetchActivity();
      addToast('Task deleted successfully', 'success');
    } catch {
      setError('Failed to delete task');
      addToast('Failed to delete task', 'error');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await API.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
      fetchActivity();
      addToast(`Task marked as ${newStatus}`, 'success');
    } catch {
      setError('Failed to update status');
      addToast('Failed to update status', 'error');
    }
  };

  const openEditForm = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const statusFilters = [
    { key: 'all', label: 'All Tasks' },
    { key: 'pending', label: '⏳ Pending' },
    { key: 'in-progress', label: '🔄 In Progress' },
    { key: 'completed', label: '✅ Completed' },
    { key: 'overdue', label: '⚠️ Overdue' },
  ];

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-10">
        {/* Welcome + Search Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-surface-900">
              Welcome back, <span className="text-primary-600">{user?.name}</span>
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              {stats.total === 0 ? 'No tasks yet — create one to get started' : `You have ${stats.pending + stats.inProgress} active tasks`}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search-tasks"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all placeholder-surface-400"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400 hover:text-surface-600 cursor-pointer bg-transparent border-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-8 animate-fade-in">
          <div className="bg-white rounded-2xl p-4 sm:p-5 text-center shadow-sm border border-surface-100 hover:shadow-md transition-shadow">
            <p className="text-2xl sm:text-3xl font-extrabold text-surface-900">{stats.total}</p>
            <p className="text-surface-500 text-[11px] mt-1 font-semibold uppercase tracking-wider">Total</p>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 text-center shadow-sm border border-surface-100 hover:shadow-md transition-shadow">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-500">{stats.pending}</p>
            <p className="text-surface-500 text-[11px] mt-1 font-semibold uppercase tracking-wider">Pending</p>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 text-center shadow-sm border border-surface-100 hover:shadow-md transition-shadow">
            <p className="text-2xl sm:text-3xl font-extrabold text-primary-600">{stats.inProgress}</p>
            <p className="text-surface-500 text-[11px] mt-1 font-semibold uppercase tracking-wider">In Progress</p>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 text-center shadow-sm border border-surface-100 hover:shadow-md transition-shadow">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-500">{stats.completed}</p>
            <p className="text-surface-500 text-[11px] mt-1 font-semibold uppercase tracking-wider">Completed</p>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 text-center shadow-sm border border-surface-100 hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-primary-600">{completionRate}%</p>
            <p className="text-surface-500 text-[11px] mt-1 font-semibold uppercase tracking-wider">Done Rate</p>
            <div className="w-full bg-surface-100 rounded-full h-1 mt-2">
              <div className="bg-gradient-to-r from-primary-500 to-emerald-500 h-1 rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 mb-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Status Filters */}
              {statusFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    filter === f.key
                      ? 'bg-primary-100 text-primary-700 shadow-sm border border-primary-200'
                      : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50 hover:text-surface-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <div className="h-5 w-px bg-surface-200 hidden sm:block mx-0.5"></div>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-surface-700 border border-surface-200 cursor-pointer hover:bg-surface-50 focus:outline-none"
              >
                <option value="all">All Priority</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">⚪ Low</option>
              </select>

              {/* Project Filter */}
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-surface-700 border border-surface-200 cursor-pointer hover:bg-surface-50 focus:outline-none"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <div className="h-5 w-px bg-surface-200 hidden sm:block mx-0.5"></div>

              {/* View Mode Toggle */}
              <div className="flex bg-surface-100 rounded-lg p-0.5 border border-surface-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-900'}`}
                  title="Grid View"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'kanban' ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-900'}`}
                  title="Kanban Board"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="btn-ghost text-xs"
                >
                  <svg className="w-3.5 h-3.5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Project
                </button>
              )}

              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowForm(true);
                  }}
                  id="create-task-button"
                  className="btn-primary text-xs"
                >
                  <svg className="w-3.5 h-3.5 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Task
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-slide-down">
            {error}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tasks Section */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-surface-500 text-sm font-medium">Loading tasks...</p>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4 shadow-sm border border-surface-200">
                  <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-surface-900 mb-1">
                  {filter !== 'all' || searchQuery ? 'No tasks found' : 'No tasks yet'}
                </h3>
                <p className="text-surface-500 text-sm mb-5">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : filter !== 'all'
                    ? `You don't have any ${filter} tasks.`
                    : user?.role === 'admin' ? 'Create your first task to get started!' : 'You have no assigned tasks yet.'}
                </p>
                {filter === 'all' && !searchQuery && user?.role === 'admin' && (
                  <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Task
                  </button>
                )}
              </div>
            ) : (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {tasks.map((task, index) => (
                    <div key={task.id} style={{ animationDelay: `${index * 40}ms` }}>
                      <TaskCard
                        task={task}
                        onEdit={openEditForm}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 items-start w-full min-h-[500px]">
                  {['pending', 'in-progress', 'completed'].map((statusColumn) => (
                    <div key={statusColumn} className="flex-1 min-w-[300px] bg-surface-100/60 rounded-2xl p-4 border border-surface-200 flex flex-col">
                      <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="font-bold text-surface-900 capitalize flex items-center gap-2 text-sm">
                          {statusColumn === 'pending' ? '⏳ Pending' : statusColumn === 'in-progress' ? '🔄 In Progress' : '✅ Completed'}
                          <span className="bg-white text-surface-600 text-xs py-0.5 px-2 rounded-full border border-surface-200 font-semibold">
                            {tasks.filter(t => t.status === statusColumn).length}
                          </span>
                        </h3>
                      </div>
                      <div className="flex flex-col gap-3">
                        {tasks.filter(t => t.status === statusColumn).map((task, index) => (
                          <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 40}ms` }}>
                            <TaskCard
                              task={task}
                              onEdit={openEditForm}
                              onDelete={handleDeleteTask}
                              onStatusChange={handleStatusChange}
                            />
                          </div>
                        ))}
                        {tasks.filter(t => t.status === statusColumn).length === 0 && (
                          <div className="text-center py-8 bg-white/50 rounded-xl border-2 border-dashed border-surface-300">
                            <p className="text-surface-400 text-xs font-medium">No tasks here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Activity Feed Sidebar - Admin only */}
          {user?.role === 'admin' && activityLogs.length > 0 && (
            <div className="lg:w-72 shrink-0 animate-fade-in">
              <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-4 sticky top-24">
                <h3 className="text-sm font-bold text-surface-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex gap-2.5 group">
                      <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-primary-600">
                          {log.user?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-surface-700 leading-relaxed">
                          <span className="font-semibold">{log.user?.name || 'Unknown'}</span>{' '}
                          <span className="text-surface-500">{log.details}</span>
                        </p>
                        <p className="text-[10px] text-surface-400 mt-0.5 font-medium">{timeAgo(log.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={closeForm}
        />
      )}

      {/* Project Form Modal */}
      <ProjectForm
        isOpen={showProjectForm}
        onClose={() => setShowProjectForm(false)}
        onProjectCreated={() => {
          fetchProjects();
          addToast('Project created successfully!', 'success');
        }}
      />
    </div>
  );
};

export default Dashboard;
