import { useState, useEffect } from 'react';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const TeamMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const [usersRes, tasksRes] = await Promise.all([
          API.get('/users'),
          API.get('/tasks')
        ]);
        
        const users = usersRes.data.data;
        const tasks = tasksRes.data.data.tasks;

        // Enrich users with task stats
        const enriched = users.map(u => {
          const userTasks = tasks.filter(t => t.assignedTo === u.id);
          return {
            ...u,
            totalTasks: userTasks.length,
            completedTasks: userTasks.filter(t => t.status === 'completed').length,
            inProgressTasks: userTasks.filter(t => t.status === 'in-progress').length,
            pendingTasks: userTasks.filter(t => t.status === 'pending').length,
          };
        });

        setMembers(enriched);
      } catch (err) {
        console.error('Failed to load team members');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900">Team Members</h1>
          <p className="text-surface-500 mt-1 text-sm">Manage your team and view workload distribution</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-surface-500 text-sm font-medium">Loading team...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 animate-fade-in">
              <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-surface-100">
                <p className="text-3xl font-extrabold text-surface-900">{members.length}</p>
                <p className="text-surface-500 text-xs mt-1 font-semibold uppercase tracking-wider">Total Members</p>
              </div>
              <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-surface-100">
                <p className="text-3xl font-extrabold text-primary-600">{members.filter(m => m.role === 'admin').length}</p>
                <p className="text-surface-500 text-xs mt-1 font-semibold uppercase tracking-wider">Admins</p>
              </div>
              <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-surface-100">
                <p className="text-3xl font-extrabold text-emerald-500">{members.filter(m => m.role === 'member').length}</p>
                <p className="text-surface-500 text-xs mt-1 font-semibold uppercase tracking-wider">Members</p>
              </div>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-primary-500/20">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-surface-900 font-bold text-base">{member.name}</h3>
                      <p className="text-surface-500 text-xs">{member.email}</p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="mb-4">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      member.role === 'admin'
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {member.role}
                    </span>
                  </div>

                  {/* Task Stats */}
                  <div className="grid grid-cols-4 gap-2 pt-4 border-t border-surface-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-surface-900">{member.totalTasks}</p>
                      <p className="text-[10px] text-surface-500 font-medium uppercase">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-500">{member.pendingTasks}</p>
                      <p className="text-[10px] text-surface-500 font-medium uppercase">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary-600">{member.inProgressTasks}</p>
                      <p className="text-[10px] text-surface-500 font-medium uppercase">Active</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-500">{member.completedTasks}</p>
                      <p className="text-[10px] text-surface-500 font-medium uppercase">Done</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {member.totalTasks > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-surface-500 font-medium mb-1">
                        <span>Completion</span>
                        <span>{Math.round((member.completedTasks / member.totalTasks) * 100)}%</span>
                      </div>
                      <div className="w-full bg-surface-100 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${(member.completedTasks / member.totalTasks) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TeamMembers;
