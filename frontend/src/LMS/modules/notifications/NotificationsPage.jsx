import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bell,
  CheckCheck,
  Smartphone,
  CheckCircle2,
  BellRing,
  Send,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { contentService } from '../../services/contentService';
import pushNotificationService from '../../services/pushNotificationService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';
import { formatColomboDateTime } from '../../utils/colomboTime';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState('checking'); // 'checking' | 'unsupported' | 'granted' | 'default' | 'denied'
  const [hasSubscription, setHasSubscription] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const load = async () => {
    try {
      const list = await contentService.listNotifications();
      setItems(list || []);
    } finally {
      setLoading(false);
    }
  };

  const checkPush = async () => {
    if (!pushNotificationService.isSupported()) {
      setPushStatus('unsupported');
      return;
    }
    const perm = pushNotificationService.getPermission();
    setPushStatus(perm);

    const sub = await pushNotificationService.getExistingSubscription();
    setHasSubscription(Boolean(sub));
  };

  useEffect(() => {
    load();
    checkPush();
  }, []);

  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      await pushNotificationService.subscribe();
      toast.success('Lock screen push notifications enabled!');
      setPushStatus('granted');
      setHasSubscription(true);
    } catch (err) {
      toast.error(err?.message || 'Could not enable push notifications');
    } finally {
      setPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setPushLoading(true);
    try {
      await pushNotificationService.unsubscribe();
      toast.success('Push notifications paused');
      setHasSubscription(false);
    } catch (err) {
      toast.error('Failed to unsubscribe');
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    setTestingPush(true);
    try {
      await pushNotificationService.sendTestPush();
      toast.success('Test alert sent! Check your phone notification bar.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to trigger test push');
    } finally {
      setTestingPush(false);
    }
  };

  const markAll = async () => {
    await contentService.markAllNotificationsRead();
    load();
  };

  if (loading) return <LoadingSkeleton rows={3} />;

  const isPushActive = pushStatus === 'granted' && hasSubscription;

  return (
    <div className="space-y-4 p-4 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900">Notifications</h2>
          <p className="text-xs text-slate-500">Class announcements, papers, quizzes &amp; fee updates</p>
        </div>
        {items.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Lock Screen Mobile Push Status Banner */}
      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isPushActive ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
          }`}>
            {isPushActive ? (
              <BellRing className="h-5 w-5 animate-pulse" />
            ) : (
              <Smartphone className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900">
                {isPushActive ? 'Lock-Screen Push Alerts: Active' : 'Lock-Screen Push Notifications'}
              </h3>
              {isPushActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              {isPushActive
                ? 'Your mobile phone will receive real-time push alerts from Sir even when this app is completely closed.'
                : 'Get alerts on your phone screen when Sir publishes new model papers, releases marks, or starts a timed quiz.'}
            </p>

            {/* Action buttons */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!isPushActive ? (
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={pushLoading || pushStatus === 'denied'}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {pushLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  )}
                  <span>Enable Push Notifications</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSendTestPush}
                    disabled={testingPush}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                  >
                    {testingPush ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>Send Test Push to Phone</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisablePush}
                    disabled={pushLoading}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-700 underline px-1 py-1"
                  >
                    Pause Alerts
                  </button>
                </>
              )}

              {pushStatus === 'denied' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Notifications blocked in browser settings. Please allow notifications in site settings.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="Notifications from your tuition classes and Sir will appear here."
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
              className={`rounded-2xl border p-3.5 transition cursor-pointer ${
                n.isRead
                  ? 'border-slate-100 bg-white hover:border-slate-200'
                  : 'border-blue-200 bg-blue-50/70 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">{n.title}</p>
                {!n.isRead && (
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                )}
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
              <p className="mt-1.5 text-[10px] text-slate-400">
                {formatColomboDateTime(n.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
