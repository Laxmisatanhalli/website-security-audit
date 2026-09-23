import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm border">
        <h1 className="text-xl font-semibold mb-1">Create an account</h1>
        <p className="text-sm text-slate-500 mb-6">
          New accounts start as Viewer; an Administrator can upgrade your role.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          className="w-full border rounded px-3 py-2 mb-4 text-sm"
          value={form.username}
          onChange={update('username')}
          minLength={3}
          maxLength={50}
          required
        />

        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          className="w-full border rounded px-3 py-2 mb-4 text-sm"
          value={form.email}
          onChange={update('email')}
          required
        />

        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2 mb-6 text-sm"
          value={form.password}
          onChange={update('password')}
          minLength={8}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white rounded py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-sm text-slate-500 mt-4 text-center">
          Already have an account? <Link to="/login" className="text-slate-900 underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
