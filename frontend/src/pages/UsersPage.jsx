import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/resources';

const ROLES = ['Administrator', 'Security Analyst', 'Viewer'];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Viewer' });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setForm({ username: '', email: '', password: '', role: 'Viewer' });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => usersApi.update(id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const resetMutation = useMutation({
    mutationFn: usersApi.resetPassword,
    onSuccess: (data) => alert(`Temporary password: ${data.temporaryPassword ?? '(check server response)'}`),
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Users</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
        className="bg-white border rounded-lg p-4 mb-6 grid grid-cols-4 gap-3"
      >
        <input
          placeholder="Username"
          className="border rounded px-3 py-2 text-sm"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          required
        />
        <input
          placeholder="Email"
          type="email"
          className="border rounded px-3 py-2 text-sm"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <input
          placeholder="Password"
          type="password"
          className="border rounded px-3 py-2 text-sm"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
        <select
          className="border rounded px-3 py-2 text-sm"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
        >
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="col-span-4 bg-slate-900 text-white text-sm rounded py-2 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creating…' : 'Create user'}
        </button>
      </form>

      <div className="bg-white border rounded-lg overflow-hidden">
        {isLoading ? (
          <p className="p-4 text-slate-500 text-sm">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b bg-slate-50">
                <th className="py-2 px-4">Username</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4">Role</th>
                <th className="py-2 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2 px-4">{u.username}</td>
                  <td className="py-2 px-4 text-slate-500">{u.email}</td>
                  <td className="py-2 px-4">
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={u.role}
                      onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                    >
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-4 text-right space-x-3">
                    <button onClick={() => resetMutation.mutate(u.id)} className="text-xs text-slate-500 hover:underline">
                      Reset password
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete ${u.username}?`)) deleteMutation.mutate(u.id); }}
                      className="text-xs text-red-600"
                    >
                      Delete
                    </button>
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
