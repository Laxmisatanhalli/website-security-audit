import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/resources';
import SeverityBadge from '../components/SeverityBadge';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list() });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">
          Notifications {data?.unreadCount ? <span className="text-sm text-slate-500">({data.unreadCount} unread)</span> : null}
        </h1>
        {!!data?.unreadCount && (
          <button onClick={() => markAllReadMutation.mutate()} className="text-sm text-slate-500 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white border rounded-lg divide-y">
        {isLoading ? (
          <p className="p-4 text-slate-500 text-sm">Loading…</p>
        ) : !data?.notifications?.length ? (
          <p className="p-4 text-slate-500 text-sm">No notifications yet.</p>
        ) : (
          data.notifications.map((n) => (
            <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.isRead ? 'bg-slate-50' : ''}`}>
              <SeverityBadge severity={n.severity} />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markReadMutation.mutate(n.id)}
                  className="text-xs text-slate-500 hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
