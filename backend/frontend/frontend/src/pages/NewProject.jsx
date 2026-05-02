import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4">
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline text-sm">← Dashboard</button>
      </nav>
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">New Project</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <input type="text" placeholder="Project name" required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <textarea placeholder="Description (optional)" rows={3}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
}
