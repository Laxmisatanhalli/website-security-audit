import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/resources';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  if (isLoading || !form) return <p className="text-slate-500">Loading…</p>;

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }}
        className="bg-white border rounded-lg p-6 max-w-lg space-y-4"
      >
        <Field label="Scan timeout (seconds)">
          <input
            type="number"
            min={5}
            className="border rounded px-3 py-2 text-sm w-full"
            value={form.scanTimeoutSeconds}
            onChange={update('scanTimeoutSeconds')}
          />
        </Field>

        <Field label="Scan retries">
          <input
            type="number"
            min={0}
            max={5}
            className="border rounded px-3 py-2 text-sm w-full"
            value={form.scanRetries}
            onChange={update('scanRetries')}
          />
        </Field>

        <Field label="Scheduler interval (minutes)">
          <input
            type="number"
            min={1}
            className="border rounded px-3 py-2 text-sm w-full"
            value={form.schedulerIntervalMinutes}
            onChange={update('schedulerIntervalMinutes')}
          />
        </Field>

        <Field label="SSL expiry check hour (UTC, 0-23)">
          <input
            type="number"
            min={0}
            max={23}
            className="border rounded px-3 py-2 text-sm w-full"
            value={form.sslCheckHourUtc}
            onChange={update('sslCheckHourUtc')}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.emailNotificationsEnabled}
            onChange={update('emailNotificationsEnabled')}
          />
          Email notifications enabled
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.inAppNotificationsEnabled}
            onChange={update('inAppNotificationsEnabled')}
          />
          In-app notifications enabled
        </label>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="bg-slate-900 text-white text-sm rounded py-2 px-4 disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Saving…' : 'Save settings'}
        </button>
        {updateMutation.isSuccess && <p className="text-sm text-green-700">Saved.</p>}
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}
