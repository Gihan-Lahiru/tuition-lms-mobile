import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, CheckSquare, Circle, Clock, Send, Square } from 'lucide-react';
import { quizService } from '../../services/quizService';
import { useServerCountdown } from '../../hooks/useServerCountdown';
import { formatCountdown } from '../../utils/formatters';
import ExamActivityMonitor from '../../security/ExamActivityMonitor';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';

const toIdArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export default function QuizPlayerPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const submittedOnceRef = useRef(false);

  useEffect(() => {
    let active = true;
    quizService
      .startOrResumeAttempt(quizId)
      .then((res) => {
        if (!active) return;
        setSession(res);
        setAnswers(res.savedAnswers || {});
        setTabSwitches(res.attempt?.tabSwitchCount || 0);
        if (res.resumed) {
          toast('Resumed your active attempt', { icon: '⏱️' });
        }
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Cannot start quiz');
        navigate('/lms/quizzes', { replace: true });
      })
      .finally(() => setLoading(false));
    return () => {
      active = false;
    };
  }, [quizId, navigate]);

  const submitFinal = useCallback(
    async (isAuto = false) => {
      if (!session?.attempt?.id || submittedOnceRef.current) return;
      submittedOnceRef.current = true;
      setSubmitting(true);
      try {
        const result = await quizService.submitAttempt(session.attempt.id);
        toast.success(
          isAuto ? 'Time up! Quiz auto-submitted.' : 'Quiz submitted successfully!',
        );
        navigate(`/lms/quiz-result/${result.attemptId}`, { replace: true });
      } catch (err) {
        submittedOnceRef.current = false;
        toast.error(err?.response?.data?.message || 'Submission failed');
      } finally {
        setSubmitting(false);
      }
    },
    [session, navigate],
  );

  const remainingSeconds = useServerCountdown({
    expiresAt: session?.attempt?.expiresAt,
    serverNow: session?.attempt?.serverNow,
    onExpire: () => submitFinal(true),
  });

  const handleSelectOption = async (question, optionId) => {
    const isMulti = question.questionType === 'multiple_choice';
    const currentSelected = toIdArray(answers[question.id]);
    const nextIds = isMulti
      ? currentSelected.includes(optionId)
        ? currentSelected.filter((id) => id !== optionId)
        : [...currentSelected, optionId]
      : [optionId];

    setAnswers((prev) => ({ ...prev, [question.id]: nextIds }));
    if (!session?.attempt?.id) return;
    setSaving(true);
    try {
      await quizService.saveAnswers(session.attempt.id, {
        answers: [{ questionId: question.id, selectedOptionIds: nextIds }],
        tabSwitchCount: tabSwitches,
      });
    } catch (err) {
      if (err?.response?.data?.code === 'QUIZ_TIME_EXPIRED') {
        submitFinal(true);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !session) return <LoadingSkeleton rows={4} />;

  const questions = session.questions || [];
  const current = questions[activeIndex];
  const answeredCount = questions.filter((q) => toIdArray(answers[q.id]).length > 0).length;

  return (
    <div className="space-y-4 p-4">
      {/* Sticky Countdown Banner */}
      <div
        className={`flex items-center justify-between rounded-2xl px-4 py-3 text-white shadow-sm ${
          remainingSeconds <= 60 ? 'bg-rose-600 animate-pulse' : 'bg-slate-900'
        }`}
      >
        <div className="min-w-0 pr-2">
          <p className="truncate text-xs font-bold">{session.quiz?.title}</p>
          <p className="text-[11px] text-slate-300">
            {answeredCount}/{questions.length} answered {saving ? '• Saving...' : '• Saved'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-sm font-extrabold tabular-nums">
          <Clock className="h-4 w-4" />
          <span>{formatCountdown(remainingSeconds)}</span>
        </div>
      </div>

      <ExamActivityMonitor
        onTabSwitch={(count) => {
          setTabSwitches(count);
        }}
      />

      {/* Question Number Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {questions.map((q, idx) => {
          const isCurrent = idx === activeIndex;
          const isAnswered = toIdArray(answers[q.id]).length > 0;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-9 min-w-[36px] rounded-xl text-xs font-bold transition ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isAnswered
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Card */}
      {current && (() => {
        const isMulti = current.questionType === 'multiple_choice';
        const selectedIds = toIdArray(answers[current.id]);
        return (
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                Question {activeIndex + 1} of {questions.length}
              </span>
              <span>{current.marks} marks</span>
            </div>
            <div className="mt-1.5">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isMulti
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isMulti
                  ? 'Multiple Choice • Select all that apply'
                  : 'Single Choice • Pick 1 answer'}
              </span>
            </div>
            <h3 className="mt-2 text-base font-bold leading-snug text-slate-900">
              {current.prompt}
            </h3>

            <div className="mt-4 space-y-2.5">
              {(current.options || []).map((opt) => {
                const selected = selectedIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(current, opt.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left text-sm transition active:scale-[0.99] ${
                      selected
                        ? 'border-blue-600 bg-blue-50 font-bold text-blue-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isMulti ? (
                      selected ? (
                        <CheckSquare className="h-5 w-5 shrink-0 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 shrink-0 text-slate-300" />
                      )
                    ) : selected ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Bottom Prev / Next / Submit Controls */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={activeIndex === 0}
          onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
          className="rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 disabled:opacity-40"
        >
          Previous
        </button>

        {activeIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() =>
              setActiveIndex((i) => Math.min(questions.length - 1, i + 1))
            }
            className="rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white"
          >
            Next Question
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => submitFinal(false)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  );
}

