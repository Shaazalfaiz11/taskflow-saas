import { useAuth } from '../context/AuthContext';

const priorityConfig = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  medium: { label: 'Medium', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  high: { label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  urgent: { label: 'Urgent', color: 'bg-red-50 text-red-600 border-red-200' },
};

const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const { user } = useAuth();
  const statusConfig = {
    pending: {
      badge: 'badge-pending',
      icon: '⏳',
      next: 'in-progress',
      nextLabel: 'Start',
    },
    'in-progress': {
      badge: 'badge-in-progress',
      icon: '🔄',
      next: 'completed',
      nextLabel: 'Complete',
    },
    completed: {
      badge: 'badge-completed',
      icon: '✅',
      next: 'pending',
      nextLabel: 'Reopen',
    },
  };

  const config = statusConfig[task.status] || statusConfig.pending;
  const pConfig = priorityConfig[task.priority] || priorityConfig.medium;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-fade-in group flex flex-col h-full ${isOverdue ? 'border-red-200 hover:border-red-300' : 'border-surface-200 hover:border-primary-300'}`}>
      {/* Priority + Status Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${pConfig.color}`}>
          {pConfig.label}
        </span>
        <span className={`badge ${config.badge} text-[11px]`}>
          {config.icon} {task.status}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-surface-900 font-bold text-base leading-snug line-clamp-2 mb-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-surface-500 text-sm leading-relaxed mb-4 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
        {task.project && (
          <span className="text-[11px] bg-surface-50 text-surface-600 border border-surface-200 px-2 py-1 rounded-md font-medium">
            📁 {task.project.name}
          </span>
        )}
        {task.assignee && (
          <span className="text-[11px] bg-primary-50 text-primary-700 border border-primary-100 px-2 py-1 rounded-md font-medium">
            👤 {task.assignee.name}
          </span>
        )}
        {task.dueDate && (
          <span className={`text-[11px] px-2 py-1 rounded-md font-medium border ${isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 'bg-surface-50 text-surface-600 border-surface-200'}`}>
            📅 {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-100">
        <span className="text-surface-400 text-[11px] font-medium">
          {formatDate(task.createdAt)}
        </span>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Status toggle */}
          <button
            onClick={() => onStatusChange(task.id, config.next)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors cursor-pointer border-none font-semibold"
            title={`Mark as ${config.next}`}
          >
            {config.nextLabel}
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary-600 transition-colors cursor-pointer border-none bg-transparent"
            title="Edit task"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete */}
          {user?.role === 'admin' && (
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent"
              title="Delete task"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
