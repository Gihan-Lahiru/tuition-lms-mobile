import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  User,
} from 'lucide-react';
import { messageService } from '../../services/messageService';
import { useLMSAuth } from '../../context/LMSAuthContext';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';
import { formatColomboDateTime } from '../../utils/colomboTime';

export default function StudentMessagesPage() {
  const { user } = useLMSAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    try {
      const data = await messageService.getMyMessages();
      setMessages(data || []);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setSending(true);
    try {
      await messageService.sendMessage(newText.trim());
      toast.success('Message sent to teacher!');
      setNewText('');
      loadMessages();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-4 p-4 antialiased">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-blue-200">
              <Sparkles className="h-3 w-3 text-amber-300" />
              Teacher Support
            </span>
            <h2 className="mt-1.5 text-lg font-black tracking-tight">
              Direct Messages
            </h2>
            <p className="mt-0.5 text-xs text-blue-200/90">
              Ask doubts, lesson questions or request slip approval
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Compose Message Form */}
      <form
        onSubmit={handleSend}
        className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs space-y-3"
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <HelpCircle className="h-4 w-4 text-blue-600" />
          <span>Send a New Message to Teacher</span>
        </div>

        <textarea
          rows={3}
          required
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Type your question, homework doubt, or bank slip inquiry here..."
          className="w-full rounded-2xl border border-slate-200 p-3 text-xs leading-relaxed outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-slate-800"
        />

        <button
          type="submit"
          disabled={sending || !newText.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60 active:scale-[0.99] transition"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{sending ? 'Sending...' : 'Send Message'}</span>
        </button>
      </form>

      {/* Message History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 px-1">
          Your Conversations ({messages.length})
        </h3>

        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Have a question for Mr. Maleesha? Send your first message above."
          />
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs space-y-3"
            >
              {/* Student Message */}
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-xs font-bold">
                  {user?.name?.charAt(0) || 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900">
                      You
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatColomboDateTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 rounded-2xl bg-slate-50 p-2.5 text-xs text-slate-800 leading-relaxed">
                    {msg.message}
                  </p>
                </div>
              </div>

              {/* Status & Teacher Reply */}
              {msg.adminReply ? (
                <div className="flex items-start gap-2.5 pl-6 border-l-2 border-indigo-200">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white text-xs font-bold">
                    T
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-900">
                        Teacher Reply
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Replied
                      </span>
                    </div>
                    <p className="mt-1 rounded-2xl bg-indigo-50/80 p-2.5 text-xs text-indigo-950 font-medium leading-relaxed border border-indigo-100">
                      {msg.adminReply}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-amber-600 font-semibold pr-1">
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  <span>Waiting for teacher review</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
