import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigneeId: '', priority: 'MEDIUM', dueDate: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [error, setError] = useState('');

  const fetchProject = () => {
    api.get(`/projects/${projectId}`)
      .then(res => setProject(res.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProject(); }, [projectId]);

  const isAdmin = project?.myRole === 'ADMIN';

  const createTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tasks', { ...taskForm, projectId });
      setTaskForm({ title: '', description: '', assigneeId: '', priority: 'MEDIUM', dueDate: '' });
      setShowTaskForm(false);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    await api.put(`/tasks/${taskId}`, { status });
    fetchProject();
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    fetchProject();
  };

  const addMember = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/projects/${projectId}/members`, { email: memberEmail });
      setMemberEmail('');
      setShowMemberForm(false);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline text-sm">← Dashboard</button>
        <h1 className="text-xl font-bold">{project?.name}</h1>
        <span className="text-sm text-gray-500">{project?.myRole}</span>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Tasks ({project?.tasks?.length || 0})</h2>
              {isAdmin && (
                <button onClick={() => setShowTaskForm(!showTaskForm)}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
                  + Add Task
                </button>
              )}
            </div>

            {showTaskForm && (
              <form onSubmit={createTask} className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
                <input type="text" placeholder="Task title" required
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                <textarea placeholder="Description (optional)"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="border rounded px-3 py-2 text-sm"
                    value={taskForm.assigneeId} onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {project?.members?.map(m => (
                      <option key={m.userId} value={m.userId}>{m.user.name}</option>
                    ))}
                  </select>
                  <select className="border rounded px-3 py-2 text-sm"
                    value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <input type="date" className="w-full border rounded px-3 py-2 text-sm"
                  value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Create</button>
                  <button type="button" onClick={() => setShowTaskForm(false)} className="text-sm text-gray-500 hover:underline">Cancel</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {project?.tasks?.length === 0 && <p className="text-gray-500 text-sm">No tasks yet.</p>}
              {project?.tasks?.map(task => (
                <div key={task.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        {task.assignee && <span>👤 {task.assignee.name}</span>}
                        {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <select
                        className="text-xs border rounded px-2 py-1"
                        value={task.status}
                        onChange={e => updateTaskStatus(task.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                      {isAdmin && (
                        <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Members ({project?.members?.length || 0})</h2>
              {isAdmin && (
                <button onClick={() => setShowMemberForm(!showMemberForm)}
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">
                  + Add
                </button>
              )}
            </div>

            {showMemberForm && (
              <form onSubmit={addMember} className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
                <input type="email" placeholder="Member email" required
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
                <div className="flex gap-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Add</button>
                  <button type="button" onClick={() => setShowMemberForm(false)} className="text-sm text-gray-500 hover:underline">Cancel</button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-lg shadow divide-y">
              {project?.members?.map(m => (
                <div key={m.id} className="px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{m.user.name}</p>
                    <p className="text-xs text-gray-400">{m.user.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${m.role === 'ADMIN' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const map = { LOW: 'text-green-500', MEDIUM: 'text-yellow-500', HIGH: 'text-red-500' };
  return <span className={map[priority]}>● {priority}</span>;
}
