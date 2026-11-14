import { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import AttendanceRing from '../../components/charts/AttendanceRing';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';
import StatusBadge from '../../components/feedback/StatusBadge';

const STATUS_TONE = {
  present: 'green',
  late: 'amber',
  excused: 'blue',
  absent: 'red',
};

export default function StudentAttendancePage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    setLoading(true);
    attendanceService
      .getMyAttendance(month)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [month]);

  if (loading) return <LoadingSkeleton rows={3} />;

  const monthly = data?.monthlySummary || {};
  const history = data?.history || [];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Attendance</h2>
          <p className="text-xs text-slate-500">Monthly percentage &amp; roll log</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
        />
      </div>

      <div className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs">
        <AttendanceRing percentage={monthly.percentage ?? 0} size={88} />
        <div className="min-w-0 flex-1 text-xs">
          <p className="text-sm font-bold text-slate-900">
            Monthly Rate ({month})
          </p>
          <p className="mt-1 text-slate-600">
            Attended {monthly.numerator ?? 0} out of {monthly.denominator ?? 0}{' '}
            sessions
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Formula: {monthly.formulaDescription || '(present + late) / totalSessions'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge label={`Present ${monthly.presentCount || 0}`} tone="green" />
            <StatusBadge label={`Late ${monthly.lateCount || 0}`} tone="amber" />
            <StatusBadge label={`Absent ${monthly.absentCount || 0}`} tone="red" />
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No attendance sessions recorded"
          description="Your teacher’s marked class sessions will appear here."
        />
      ) : (
        <div className="space-y-2.5">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {item.sessionDate} • {item.subject || item.className}
                </p>
                {item.topic && (
                  <p className="text-[11px] text-slate-500">{item.topic}</p>
                )}
              </div>
              <StatusBadge
                label={item.status}
                tone={STATUS_TONE[item.status] || 'slate'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

