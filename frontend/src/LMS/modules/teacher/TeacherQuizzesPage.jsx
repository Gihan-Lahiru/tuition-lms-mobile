import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, CheckSquare, KeyRound, Plus, Sparkles, Users, X } from 'lucide-react';
import { quizService } from '../../services/quizService';
import { contentService } from '../../services/contentService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import StatusBadge from '../../components/feedback/StatusBadge';
import QuizImportModal from './QuizImportModal';

const createEmptyQuestion = () => ({
  prompt: '',
  questionType: 'single_choice',
  marks: 1,
  explanation: '',
  options: [
    { label: '', isCorrect: true },
    { label: '', isCorrect: false },
    { label: '', isCorrect: false },
    { label: '', isCorrect: false },
  ],
});

export default function TeacherQuizzesPage() {
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedAttemptsQuiz, setSelectedAttemptsQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [editingKeyQuiz, setEditingKeyQuiz] = useState(null);
  const [savingKey, setSavingKey] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    classId: '',
    durationMinutes: 15,
    maxAttempts: 1,
    releaseAnswersAfterSubmit: true,
    questions: [createEmptyQuestion()],
  });

  const load = async () => {
    try {
      const [q, c] = await Promise.all([
        quizService.listQuizzes(),
        contentService.getMyClasses(),
      ]);
      setQuizzes(q || []);
      setClasses(c || []);
      if (c?.length && !form.classId) {
        setForm((prev) => ({ ...prev, classId: c[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion()],
    }));
  };

  const handleApplyImportedQuestions = (importedQuestions) => {
    setForm((prev) => ({
      ...prev,
      questions: importedQuestions,
    }));
    setShowBuilder(true);
    toast.success(`Loaded ${importedQuestions.length} questions into Quiz Builder!`);
  };

  const setBuilderQuestionType = (qIdx, nextType) => {
    setForm((prev) => {
      const next = [...prev.questions];
      const q = { ...next[qIdx], questionType: nextType };
      if (nextType === 'single_choice') {
        const firstCorrectIdx = Math.max(
          0,
          q.options.findIndex((o) => o.isCorrect),
        );
        q.options = q.options.map((o, idx) => ({
          ...o,
          isCorrect: idx === firstCorrectIdx,
        }));
      }
      next[qIdx] = q;
      return { ...prev, questions: next };
    });
  };

  const toggleBuilderOptionCorrect = (qIdx, oIdx) => {
    setForm((prev) => {
      const next = [...prev.questions];
      const q = next[qIdx];
      if (q.questionType === 'single_choice') {
        q.options = q.options.map((o, idx) => ({ ...o, isCorrect: idx === oIdx }));
      } else {
        q.options = q.options.map((o, idx) =>
          idx === oIdx ? { ...o, isCorrect: !o.isCorrect } : o,
        );
      }
      next[qIdx] = { ...q };
      return { ...prev, questions: next };
    });
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      const cleanQuestions = form.questions.map((q) => ({
        prompt: q.prompt,
        questionType: q.questionType || 'single_choice',
        marks: Number(q.marks) || 1,
        explanation: q.explanation,
        options: q.options.filter((o) => o.label.trim()),
      }));
      for (let i = 0; i < cleanQuestions.length; i += 1) {
        const q = cleanQuestions[i];
        const correctCount = q.options.filter((o) => o.isCorrect).length;
        if (q.options.length < 2) {
          toast.error(`Question ${i + 1} needs at least 2 options`);
          return;
        }
        if (q.questionType === 'single_choice' && correctCount !== 1) {
          toast.error(`Question ${i + 1} (Single Choice) needs 1 correct option`);
          return;
        }
        if (q.questionType === 'multiple_choice' && correctCount < 1) {
          toast.error(`Question ${i + 1} needs at least 1 correct option`);
          return;
        }
      }

      await quizService.createQuiz({
        ...form,
        durationMinutes: Number(form.durationMinutes),
        maxAttempts: Number(form.maxAttempts),
        isPublished: true,
        questions: cleanQuestions,
      });
      toast.success('Quiz published for students!');
      setShowBuilder(false);
      setForm((prev) => ({
        ...prev,
        title: '',
        questions: [createEmptyQuestion()],
      }));
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create quiz');
    }
  };

  const viewAttempts = async (quiz) => {
    setSelectedAttemptsQuiz(quiz);
    const list = await quizService.listQuizAttemptsForTeacher(quiz.id);
    setAttempts(list || []);
  };

  const openAnswerKeyEditor = async (quiz) => {
    try {
      const details = await quizService.getQuiz(quiz.id);
      setEditingKeyQuiz(details);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load quiz questions');
    }
  };

  const setEditorQuestionType = (qIdx, nextType) => {
    setEditingKeyQuiz((prev) => {
      if (!prev) return prev;
      const questions = [...prev.questions];
      const q = { ...questions[qIdx], questionType: nextType };
      if (nextType === 'single_choice') {
        const firstCorrectIdx = Math.max(
          0,
          q.options.findIndex((o) => o.isCorrect),
        );
        q.options = q.options.map((o, idx) => ({
          ...o,
          isCorrect: idx === firstCorrectIdx,
        }));
      }
      questions[qIdx] = q;
      return { ...prev, questions };
    });
  };

  const toggleEditorOptionCorrect = (qIdx, oIdx) => {
    setEditingKeyQuiz((prev) => {
      if (!prev) return prev;
      const questions = [...prev.questions];
      const q = questions[qIdx];
      const nextOptions =
        (q.questionType || 'single_choice') === 'single_choice'
          ? q.options.map((o, idx) => ({ ...o, isCorrect: idx === oIdx }))
          : q.options.map((o, idx) =>
              idx === oIdx ? { ...o, isCorrect: !o.isCorrect } : o,
            );
      questions[qIdx] = { ...q, options: nextOptions };
      return { ...prev, questions };
    });
  };

  const handleSaveAnswerKey = async () => {
    if (!editingKeyQuiz) return;
    for (let i = 0; i < editingKeyQuiz.questions.length; i += 1) {
      const q = editingKeyQuiz.questions[i];
      const correctCount = (q.options || []).filter((o) => o.isCorrect).length;
      const qType = q.questionType || 'single_choice';
      if (qType === 'single_choice' && correctCount !== 1) {
        toast.error(`Q${i + 1} (Single Choice) must have 1 correct answer`);
        return;
      }
      if (qType === 'multiple_choice' && correctCount < 1) {
        toast.error(`Q${i + 1} needs at least 1 correct answer`);
        return;
      }
    }

    setSavingKey(true);
    try {
      await quizService.updateAnswerKey(editingKeyQuiz.id, {
        questions: editingKeyQuiz.questions.map((q) => ({
          questionId: q.id,
          questionType: q.questionType || 'single_choice',
          correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
        })),
      });
      toast.success('Answer key updated & attempts re-scored!');
      if (selectedAttemptsQuiz?.id === editingKeyQuiz.id) {
        viewAttempts(selectedAttemptsQuiz);
      }
      setEditingKeyQuiz(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update answer key');
    } finally {
      setSavingKey(false);
    }
  };

  const handleToggleRelease = async (quiz) => {
    await quizService.updateQuizSettings(quiz.id, {
      releaseAnswersAfterSubmit: !quiz.releaseAnswersAfterSubmit,
    });
    toast.success('Answer visibility updated');
    load();
  };

  if (loading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Quiz Manager</h2>
          <p className="text-xs text-slate-500">Build timed MCQs &amp; review scores</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI / Import</span>
          </button>
          <button
            type="button"
            onClick={() => setShowBuilder((v) => !v)}
            className="inline-flex items-center gap-1 rounded-2xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs"
          >
            <Plus className="h-4 w-4" />
            {showBuilder ? 'Close' : 'New Quiz'}
          </button>
        </div>
      </div>

      {showBuilder && (
        <form
          onSubmit={handleCreateQuiz}
          className="rounded-3xl border border-blue-100 bg-white p-4 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Create MCQ Quiz</h3>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
            >
              <Sparkles className="h-3 w-3" />
              <span>AI / .TXT Import</span>
            </button>
          </div>
          <input
            required
            placeholder="Quiz title (e.g. Trigonometry Quick Check)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={180}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              placeholder="Minutes"
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
            />
          </div>

          {form.questions.map((q, qIdx) => {
            const isMulti = q.questionType === 'multiple_choice';
            return (
              <div key={qIdx} className="rounded-2xl bg-slate-50 p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-700">Question {qIdx + 1}</p>
                  <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setBuilderQuestionType(qIdx, 'single_choice')}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        !isMulti
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600'
                      }`}
                    >
                      Single Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuilderQuestionType(qIdx, 'multiple_choice')}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        isMulti
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600'
                      }`}
                    >
                      Multiple Choice
                    </button>
                  </div>
                </div>

                <input
                  required
                  placeholder="Question prompt"
                  value={q.prompt}
                  onChange={(e) => {
                    const next = [...form.questions];
                    next[qIdx].prompt = e.target.value;
                    setForm({ ...form, questions: next });
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                />

                <p className="text-[11px] font-semibold text-emerald-700">
                  {isMulti
                    ? 'Tap checkboxes to choose 1 or more correct answers:'
                    : 'Tap circle to choose the 1 correct answer:'}
                </p>

                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBuilderOptionCorrect(qIdx, oIdx)}
                      aria-label={`Mark option ${oIdx + 1} correct`}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-xl border px-2 py-1.5 text-[11px] font-bold transition ${
                        opt.isCorrect
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center border ${
                          isMulti ? 'rounded-sm' : 'rounded-full'
                        } ${
                          opt.isCorrect
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {opt.isCorrect && <Check className="h-3 w-3" />}
                      </span>
                      Correct
                    </button>
                    <input
                      required={oIdx < 2}
                      placeholder={`Option ${oIdx + 1}`}
                      value={opt.label}
                      onChange={(e) => {
                        const next = [...form.questions];
                        next[qIdx].options[oIdx].label = e.target.value;
                        setForm({ ...form, questions: next });
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                ))}
              </div>
            );
          })}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addQuestion}
              className="flex-1 rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700"
            >
              + Add Question
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white"
            >
              Publish Quiz
            </button>
          </div>
        </form>
      )}

      {editingKeyQuiz && (
        <div className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                Teacher Answer Key
              </p>
              <h3 className="text-sm font-extrabold text-slate-900">
                {editingKeyQuiz.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setEditingKeyQuiz(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {(editingKeyQuiz.questions || []).map((q, qIdx) => {
              const isMulti = (q.questionType || 'single_choice') === 'multiple_choice';
              return (
                <div key={q.id} className="rounded-2xl bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800">
                      Q{qIdx + 1}. {q.prompt}
                    </p>
                  </div>
                  <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditorQuestionType(qIdx, 'single_choice')}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                        !isMulti ? 'bg-blue-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Single Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorQuestionType(qIdx, 'multiple_choice')}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                        isMulti ? 'bg-blue-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Multiple Choice
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {(q.options || []).map((opt, oIdx) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleEditorOptionCorrect(qIdx, oIdx)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                          opt.isCorrect
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                            isMulti ? 'rounded-sm' : 'rounded-full'
                          } ${
                            opt.isCorrect
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {opt.isCorrect && <Check className="h-3 w-3" />}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={savingKey}
            onClick={handleSaveAnswerKey}
            className="w-full rounded-2xl bg-emerald-600 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {savingKey ? 'Saving & Re-scoring...' : 'Save Correct Answers'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-blue-600">
                  {quiz.className}
                </p>
                <h3 className="text-sm font-bold text-slate-900">{quiz.title}</h3>
              </div>
              <StatusBadge
                label={quiz.isPublished ? 'Published' : 'Draft'}
                tone={quiz.isPublished ? 'green' : 'slate'}
              />
            </div>
            <p className="text-xs text-slate-500">
              {quiz.questionCount} questions • {quiz.totalMarks} marks •{' '}
              {quiz.attemptCount} attempt(s)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleToggleRelease(quiz)}
                className="rounded-xl bg-slate-100 py-2 text-[11px] font-bold text-slate-700"
              >
                Keys: {quiz.releaseAnswersAfterSubmit ? 'Shown' : 'Hidden'}
              </button>
              <button
                type="button"
                onClick={() => openAnswerKeyEditor(quiz)}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-50 py-2 text-[11px] font-bold text-emerald-700"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Answer Key
              </button>
              <button
                type="button"
                onClick={() => viewAttempts(quiz)}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-50 py-2 text-[11px] font-bold text-indigo-700"
              >
                <Users className="h-3.5 w-3.5" />
                Attempts
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedAttemptsQuiz && (
        <div className="rounded-3xl border border-indigo-200 bg-white p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Attempts: {selectedAttemptsQuiz.title}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedAttemptsQuiz(null)}
              className="text-xs font-bold text-slate-500"
            >
              Close
            </button>
          </div>
          {attempts.length === 0 ? (
            <p className="text-xs text-slate-500">No student attempts yet.</p>
          ) : (
            attempts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{a.studentName}</p>
                  <p className="text-[11px] text-slate-500">
                    {a.status} • Tab switches: {a.tabSwitchCount}
                  </p>
                </div>
                <span className="font-extrabold text-blue-700">
                  {a.score}/{a.maxScore} ({a.percentage}%)
                </span>
              </div>
            ))
          )}
        </div>
      )}

      <QuizImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onApplyQuestions={handleApplyImportedQuestions}
      />
    </div>
  );
}

