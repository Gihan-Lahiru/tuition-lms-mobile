import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Award, CalendarCheck, Send } from 'lucide-react';
import { contentService } from '../../services/contentService';
import { resultService } from '../../services/resultService';
import { attendanceService } from '../../services/attendanceService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import { todayColomboISODate } from '../../utils/colomboTime';

export default function TeacherMarksAttendancePage() {
  const [tab, setTab] = useState('marks');
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classId, setClassId] = useState('');
  const [termId, setTermId] = useState('');
  const [roster, setRoster] = useState([]);
  const [markDrafts, setMarkDrafts] = useState({});

  const [sessionDate, setSessionDate] = useState(todayColomboISODate());
  const [topic, setTopic] = useState('');
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [attendanceDrafts, setAttendanceDrafts] = useState({});

  useEffect(() => {
    Promise.all([contentService.getMyClasses(), resultService.listTerms()])
      .then(([cls, t]) => {
        setClasses(cls || []);
        setTerms(t || []);
        if (cls?.length) setClassId(cls[0].id);
        if (t?.length) setTermId(t[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadClassWorkspace = async () => {
    if (!classId) return;
    const [rList, sheet, sessList] = await Promise.all([
      contentService.getClassRoster(classId),
      termId ? resultService.getClassSheet(classId, termId) : Promise.resolve({ rows: [] }),
      attendanceService.getClassSessions(classId),
    ]);
    setRoster(rList || []);

    const mDraft = {};
    for (const row of sheet.rows || []) {
      mDraft[row.studentId] = {
        status: row.status,
        marks: row.marks ?? '',
        remarks: row.remarks || '',
      };
    }
    for (const st of rList || []) {
      if (!mDraft[st.id]) {
        mDraft[st.id] = { status: 'not_graded', marks: '', remarks: '' };
      }
    }
    setMarkDrafts(mDraft);

    setSessions(sessList || []);
    if (sessList?.length) {
      const first = sessList[0];
      setActiveSessionId(first.id);
      const aDraft = {};
      for (const st of rList || []) {
        const rec = (first.records || []).find((r) => r.studentId === st.id);
        aDraft[st.id] = rec?.status || 'present';
      }
      setAttendanceDrafts(aDraft);
    } else {
      setActiveSessionId('');
      const aDraft = {};
      for (const st of rList || []) aDraft[st.id] = 'present';
      setAttendanceDrafts(aDraft);
    }
  };

  useEffect(() => {
    loadClassWorkspace();
  }, [classId, termId]);

  const saveMarks = async (publish = false) => {
    try {
      const payload = roster.map((st) => {
        const d = markDrafts[st.id] || { status: 'not_graded', marks: '' };
        return {
          studentId: st.id,
          status: d.status,
          marks: d.status === 'graded' ? Number(d.marks) : null,
          maxMarks: 100,
          remarks: d.remarks || '',
          isPublished: publish,
        };
      });
      await resultService.saveResults({ termId, classId, results: payload });
      toast.success(publish ? 'Marks saved & published to students' : 'Draft marks saved');
      loadClassWorkspace();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save marks');
    }
  };

  const createAttendanceSession = async (e) => {
    e.preventDefault();
    try {
      const created = await attendanceService.createSession({
        classId,
        sessionDate,
        topic,
      });
      toast.success('Attendance session created');
      setTopic('');
      await loadClassWorkspace();
      setActiveSessionId(created.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not create session');
    }
  };

  const saveAttendanceRoll = async () => {
    if (!activeSessionId) {
      toast.error('Create or select a session first');
      return;
    }
    try {
      const records = roster.map((st) => ({
        studentId: st.id,
        status: attendanceDrafts[st.id] || 'present',
      }));
      await attendanceService.saveSessionRecords(activeSessionId, records);
      toast.success('Attendance roll saved');
      loadClassWorkspace();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save attendance');
    }
  };

  if (loading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Marks &amp; Attendance
        </h2>
        <p className="text-xs text-slate-500">Enter term marks &amp; mark roll</p>
      </div>

      <select
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold"
      >
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 rounded-2xl bg-slate-200/70 p-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setTab('marks')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 ${
            tab === 'marks' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          Term Marks
        </button>
        <button
          type="button"
          onClick={() => setTab('attendance')}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 ${
            tab === 'attendance'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <CalendarCheck className="h-3.5 w-3.5" />
          Attendance
        </button>
      </div>

      {tab === 'marks' ? (
        <div className="space-y-3">
          <select
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.year})
              </option>
            ))}
          </select>

          <div className="space-y-2.5">
            {roster.map((st) => {
              const d = markDrafts[st.id] || {
                status: 'not_graded',
                marks: '',
                remarks: '',
              };
              return (
                <div
                  key={st.id}
                  className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {st.name}
                    </span>
                    <select
                      value={d.status}
                      onChange={(e) =>
                        setMarkDrafts({
                          ...markDrafts,
                          [st.id]: { ...d, status: e.target.value },
                        })
                      }
                      className="rounded-xl border border-slate-200 px-2 py-1 text-[11px] font-semibold"
                    >
                      <option value="graded">Graded</option>
                      <option value="absent">Absent</option>
                      <option value="not_graded">Not Graded</option>
                    </select>
                  </div>
                  {d.status === 'graded' && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0..100"
                        value={d.marks}
                        onChange={(e) =>
                          setMarkDrafts({
                            ...markDrafts,
                            [st.id]: { ...d, marks: e.target.value },
                          })
                        }
                        className="w-24 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold"
                      />
                      <input
                        placeholder="Remarks"
                        value={d.remarks}
                        onChange={(e) =>
                          setMarkDrafts({
                            ...markDrafts,
                            [st.id]: { ...d, remarks: e.target.value },
                          })
                        }
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => saveMarks(false)}
              className="rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => saveMarks(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white"
            >
              <Send className="h-3.5 w-3.5" />
              Save &amp; Publish
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <form
            onSubmit={createAttendanceSession}
            className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs space-y-2.5"
          >
            <p className="text-xs font-bold text-slate-900">New Roll Session</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
              <input
                placeholder="Lesson topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-2 text-xs font-bold text-white"
            >
              Create Session
            </button>
          </form>

          {sessions.length > 0 && (
            <div className="space-y-2.5">
              <select
                value={activeSessionId}
                onChange={(e) => {
                  const id = e.target.value;
                  setActiveSessionId(id);
                  const found = sessions.find((s) => s.id === id);
                  const draft = {};
                  for (const st of roster) {
                    const rec = (found?.records || []).find(
                      (r) => r.studentId === st.id,
                    );
                    draft[st.id] = rec?.status || 'present';
                  }
                  setAttendanceDrafts(draft);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sessionDate} {s.topic ? `• ${s.topic}` : ''}
                  </option>
                ))}
              </select>

              {roster.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 text-xs shadow-xs"
                >
                  <span className="font-bold text-slate-900">{st.name}</span>
                  <div className="flex gap-1">
                    {['present', 'late', 'excused', 'absent'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() =>
                          setAttendanceDrafts({
                            ...attendanceDrafts,
                            [st.id]: code,
                          })
                        }
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${
                          attendanceDrafts[st.id] === code
                            ? code === 'present'
                              ? 'bg-emerald-600 text-white'
                              : code === 'late'
                                ? 'bg-amber-500 text-white'
                                : code === 'excused'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {code.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={saveAttendanceRoll}
                className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white"
              >
                Save Class Attendance
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

