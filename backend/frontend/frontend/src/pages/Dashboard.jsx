import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/dashboard'), api.get('/projects')])
      .then(([statsRes, projectsRes]) => {
        setStats(statsRes.data);
        setProjects(projectsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">TaskManager</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name} ({user?.role})</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Projects" value={stats?.totalProjects} color="blue" />
          <StatCard label="Assigned Tasks" value={stats?.totalAssignedTasks} color="green" />
          <StatCard label="Overdue" value={stats?.overdueTasks} color="red" />
          <StatCard label="Done" value={stats?.statusCounts?.DONE || 0} color="purple" />
        </div>

        {/* Projects */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">My Projects</h3>
          {user?.role === 'ADMIN' && (
            <Link to="/projects/new" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
              + New Project
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <p className="text-gray-500">No projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                <h4 className="font-semibold text-gray-800">{p.name}</h4>
                {p.description && <p className="text-sm text-gray-500 mt-1 truncate">{p.description}</p>}
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  <span>{p._count?.tasks || 0} tasks</span>
                  <span>{p._count?.members || 0} members</span>
                  <span className="ml-auto text-blue-500 font-medium">{p.myRole}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Recent Tasks */}
        {stats?.recentTasks?.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">My Recent Tasks</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {stats.recentTasks.map(task => (
                <div key={task.id} className="px-4 py-3 border-b last:border-0 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-gray-400">{task.project?.name}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value ?? 0}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    TODO: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    DONE: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${map[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
