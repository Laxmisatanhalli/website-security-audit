import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { websitesApi, scansApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  name: '', url: '', environment: 'Production', scanFrequency: 'Manual', scanType: 'Full',
};

export default function WebsitesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [scanningId, setScanningId] = useState(null);

  const canWrite = user.role === 'Administrator' || user.role === 'Security Analyst';

  const { data: websites, isLoading } = useQuery({ queryKey: ['websites'], queryFn: websitesApi.list });

  const createMutation = useMutation({
    mutationFn: websitesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => websitesApi.setStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['websites'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: websitesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['websites'] }),
  });

  async function handleScan(id) {
    setScanningId(id);
    try {
      await scansApi.start(id);
      queryClient.invalidateQueries({ queryKey: ['websites'] });
    } catch (err) {
      alert(err.response?.data?.message || 'Scan failed to start');
    } finally {
      setScanningId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Websites</h1>
        {canWrite && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-slate-900 text-white text-sm px-4 py-2 rounded"
          >
            {showForm ? 'Cancel' : '+ Add Website'}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="bg-white border rounded-lg p-4 mb-6 grid grid-cols-2 gap-3"
        >
          <input
            placeholder="Name"
            className="border rounded px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            placeholder="https://example.com"
            className="border rounded px-3 py-2 text-sm"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            required
          />
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.environment}
            onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value }))}
          >
            <option>Production</option>
            <option>Staging</option>
            <option>Development</option>
          </select>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.scanFrequency}
            onChange={(e) => setForm((f) => ({ ...f, scanFrequency: e.target.value }))}
          >
            <option>Manual</option>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="col-span-2 bg-slate-900 text-white text-sm rounded py-2 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Adding…' : 'Add website'}
          </button>
          {createMutation.isError && (
            <p className="col-span-2 text-sm text-red-600">
              {createMutation.error.response?.data?.message || 'Failed to add website'}
            </p>
          )}
        </form>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        {isLoading ? (
          <p className="p-4 text-slate-500 text-sm">Loading…</p>
        ) : !websites?.length ? (
          <p className="p-4 text-slate-500 text-sm">No websites yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b bg-slate-50">
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">URL</th>
                <th className="py-2 px-4">Environment</th>
                <th className="py-2 px-4">Score</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Last Scan</th>
                <th className="py-2 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {websites.map((w) => (
                <tr key={w.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 px-4">
                    <Link to={`/websites/${w.id}`} className="text-slate-900 font-medium hover:underline">
                      {w.name}
                    </Link>
                  </td>
                  <td className="py-2 px-4 text-slate-500">{w.url}</td>
                  <td className="py-2 px-4">{w.environment}</td>
                  <td className="py-2 px-4">{w.securityScore ?? '—'}</td>
                  <td className="py-2 px-4">
                    <span className={w.status === 'Enabled' ? 'text-green-700' : 'text-slate-400'}>
                      {w.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-slate-500">
                    {w.lastScanDate ? new Date(w.lastScanDate).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-2 px-4 text-right space-x-2">
                    {canWrite && (
                      <button
                        onClick={() => handleScan(w.id)}
                        disabled={scanningId === w.id || w.status === 'Disabled'}
                        className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded disabled:opacity-40"
                      >
                        {scanningId === w.id ? 'Scanning…' : 'Scan now'}
                      </button>
                    )}
                    {canWrite && (
                      <button
                        onClick={() =>
                          statusMutation.mutate({
                            id: w.id,
                            status: w.status === 'Enabled' ? 'Disabled' : 'Enabled',
                          })
                        }
                        className="text-xs border px-3 py-1.5 rounded"
                      >
                        {w.status === 'Enabled' ? 'Disable' : 'Enable'}
                      </button>
                    )}
                    {user.role === 'Administrator' && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${w.name}?`)) deleteMutation.mutate(w.id);
                        }}
                        className="text-xs text-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
