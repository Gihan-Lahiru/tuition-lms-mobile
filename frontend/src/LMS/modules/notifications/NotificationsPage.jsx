import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { contentService } from '../../services/contentService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';
import { formatColomboDateTime } from '../../utils/colomboTime';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await contentService.listNotifications();
      setItems(list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    await contentService.markAllNotificationsRead();
    load();
  };

  if (loading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Notifications</h2>
          <p className="text-xs text-slate-500">Quizzes, marks, grades &amp; fee updates</p>
        </div>
        {items.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="Notifications from your tuition classes will appear here."
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((n) => (
            <div
              key={n.id}
              onClick={async () => {
                if (!n.isRead) {
                  await contentService.markNotificationRead(n.id);
                  load();
                }
              }}
              className={`rounded-2xl border p-3.5 transition ${
                n.isRead
                  ? 'border-slate-100 bg-white'
                  : 'border-blue-200 bg-blue-50/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">{n.title}</p>
                {!n.isRead && (
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                )}
              </div>
              <p className="mt-1 text-xs text-slate-600">{n.message}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {formatColomboDateTime(n.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

