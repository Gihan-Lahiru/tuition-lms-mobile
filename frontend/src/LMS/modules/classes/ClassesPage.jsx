import { useEffect, useState } from 'react';
import { Calendar, MapPin, Megaphone, School } from 'lucide-react';
import { contentService } from '../../services/contentService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';
import StatusBadge from '../../components/feedback/StatusBadge';
import { formatLKR } from '../../utils/formatters';
import { formatColomboDateTime } from '../../utils/colomboTime';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      contentService.getMyClasses(),
      contentService.getAnnouncements(),
    ])
      .then(([cls, ann]) => {
        setClasses(cls || []);
        setAnnouncements(ann || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">My Classes</h2>
        <p className="text-xs text-slate-500">
          Enrolled subjects, schedule, and announcements
        </p>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={School}
          title="No classes found"
          description="Contact your teacher to enroll in your grade classes."
        />
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <StatusBadge label={c.grade} tone="blue" />
                  <h3 className="mt-2 text-sm font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.subject}</p>
                </div>
                {c.fee && (
                  <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800">
                    {formatLKR(c.fee)}/mo
                  </span>
                )}
              </div>
              {c.description && (
                <p className="mt-2 text-xs text-slate-600">{c.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  {c.day || 'Weekly'} {c.time ? `• ${c.time}` : ''}
                </span>
                {c.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    {c.location}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {announcements.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Megaphone className="h-4 w-4 text-blue-600" />
            <span>Recent Announcements</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-900">{a.title}</p>
                <p className="mt-1 text-xs text-slate-600">{a.content}</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {formatColomboDateTime(a.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

