import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Reply,
  CheckCircle2,
  Clock,
  User,
  Send,
  Sparkles,
} from 'lucide-react';
import { messageService } from '../../services/messageService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';
import { formatColomboDateTime } from '../../utils/colomboTime';

export default function TeacherMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'replied'

  const loadMessages = async () => {
    try {
      const data = await messageService.getAllMessages();
      setMessages(data || []);
    } catch {
      toast.error('Failed to load student messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleReply = async (messageId) => {
    const text = replies[messageId]?.trim();
    if (!text) {
      toast.error('Please enter a reply');
      return;
    }
    setSubmittingId(messageId);
    try {
      await messageService.replyMessage(messageId, text);
      toast.success('Reply delivered to student!');
      setReplies((prev) => ({ ...prev, [messageId]: '' }));
      loadMessages();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <LoadingSkeleton rows={4} />;

  const pendingCount = messages.filter((m) => !m.adminReply).length;
  const filtered = messages.filter((m) => {
    if (filter === 'pending') return !m.adminReply;
    if (filter === 'replied') return Boolean(m.adminReply);
    return true;
  });

  return (
    <div className="space-y-4 p-4 antialiased">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-indigo-200">
              <Sparkles className="h-3 w-3 text-amber-300" />
              Student Support Center
            </span>
            <h2 className="mt-1.5 text-lg font-black tracking-tight">
              Student Messages
            </h2>
            <p className="mt-0.5 text-xs text-indigo-200/90">
              Reply to student questions, homework doubts &amp; payment inquiries
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-3 rounded-2xl bg-slate-200/70 p-1 text-xs font-bold">
        {[
          { key: 'all', label: `All (${messages.length})` },
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'replied', label: `Replied (${messages.length - pendingCount})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`rounded-xl py-2 transition ${
              filter === t.key
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Message Cards List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages found"
          description="Student inquiries and support requests will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs space-y-3"
            >
              {/* Student Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold text-xs">
                    {msg.student?.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {msg.student?.name || 'Student'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {msg.student?.grade || 'Grade'} • {formatColomboDateTime(msg.createdAt)}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    msg.adminReply
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {msg.adminReply ? 'Replied' : 'Awaiting Reply'}
                </span>
              </div>

              {/* Student Message Content */}
              <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-800 leading-relaxed font-medium">
                {msg.message}
              </div>

              {/* Existing Reply if any */}
              {msg.adminReply && (
                <div className="rounded-2xl bg-indigo-50/70 p-3 border border-indigo-100 space-y-1">
                  <span className="text-[10px] font-bold text-indigo-900 uppercase">
                    Your Reply:
                  </span>
                  <p className="text-xs text-indigo-950 font-medium">
                    {msg.adminReply}
                  </p>
                </div>
              )}

              {/* Inline Reply Input Box */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder={msg.adminReply ? 'Send another reply...' : 'Type your reply to student...'}
                  value={replies[msg.id] || ''}
                  onChange={(e) =>
                    setReplies((prev) => ({ ...prev, [msg.id]: e.target.value }))
                  }
                  className="flex-1 rounded-2xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition text-slate-800"
                />
                <button
                  type="button"
                  disabled={submittingId === msg.id || !replies[msg.id]?.trim()}
                  onClick={() => handleReply(msg.id)}
                  className="inline-flex items-center gap-1 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition"
                >
                  <Send className="h-3 w-3" />
                  <span>{submittingId === msg.id ? '...' : 'Reply'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
