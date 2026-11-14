import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  BrainCircuit,
  Check,
  CheckSquare,
  Circle,
  Download,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { quizService } from '../../services/quizService';
import {
  downloadSampleQuizTxt,
  parseQuestionsFromClientText,
} from '../../utils/quizTextParser';

function isPreFormattedQuiz(text) {
  const hasNumberedQ = /^\s*(?:Q(?:uestion)?\.?\s*\d+|\d+[\.\)])\s+\S/im.test(text);
  const hasLetteredOpt = /^\s*(?:[*✓])?\s*[A-Ea-e][\.\)\-\:]\s+\S/im.test(text);
  const hasCheckbox = /^\s*\[[xX\s*✓]\]/im.test(text);
  const hasAnswerLine = /^\s*(?:Answers?|Ans|Correct(?:\s*Answers?)?|Key)\s*[:\-]/im.test(text);
  return hasNumberedQ && (hasLetteredOpt || hasCheckbox || hasAnswerLine);
}

// Auto-read Gemini API key from Vite env (set in .env as VITE_GEMINI_API_KEY)
const ENV_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export default function QuizImportModal({ isOpen, onClose, onApplyQuestions }) {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'ai'

  // Text Import state
  const [rawText, setRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [textWarnings, setTextWarnings] = useState([]);

  // AI Generator state
  const [aiText, setAiText] = useState('');
  const [aiFile, setAiFile] = useState(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [questionType, setQuestionType] = useState('mixed');
  // Pre-fill from env key; teacher can override if needed
  const [apiKey, setApiKey] = useState(ENV_GEMINI_KEY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState([]);
  const [engineUsed, setEngineUsed] = useState('');

  if (!isOpen) return null;

  // Handle local text change / live parse
  const handleTextChange = (text) => {
    setRawText(text);
    const { questions, warnings } = parseQuestionsFromClientText(text);
    setParsedPreview(questions);
    setTextWarnings(warnings);
  };

  // Handle .txt file drop or select for text import
  const handleTxtFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result || '';
      handleTextChange(content);
      toast.success(`Loaded text from ${file.name}`);
    };
    reader.readAsText(file);
  };

  // Handle AI generation request
  const handleGenerateAi = async (e) => {
    e.preventDefault();

    const textToProcess = aiText.trim();

    // If no file uploaded and text looks like structured MCQ, parse client-side instantly
    if (!aiFile && textToProcess && isPreFormattedQuiz(textToProcess)) {
      const { questions, warnings } = parseQuestionsFromClientText(textToProcess);
      if (questions.length === 0) {
        toast.error('Could not parse questions. Check the format and try again.');
        return;
      }
      setAiPreview(questions);
      setEngineUsed('txt_parser_auto_detected');
      toast.success(
        `Detected ${questions.length} formatted question(s)! Parsed directly.`,
        { icon: '📋' },
      );
      if (warnings.length > 0) {
        warnings.forEach((w) => toast(w, { icon: '⚠️' }));
      }
      return;
    }

    if (!aiFile && textToProcess.length < 30) {
      toast.error('Please upload a file (.pdf, .txt) or enter at least 30 characters of study notes.');
      return;
    }

    setIsGenerating(true);
    setAiPreview([]);
    try {
      let res;
      if (aiFile) {
        const formData = new FormData();
        formData.append('file', aiFile);
        if (textToProcess) formData.append('text', textToProcess);
        formData.append('questionCount', String(questionCount));
        formData.append('questionType', questionType);
        if (apiKey) formData.append('apiKey', apiKey);
        res = await quizService.generateQuizWithAi(formData);
      } else {
        res = await quizService.generateQuizWithAi({
          text: textToProcess,
          questionCount: Number(questionCount),
          questionType,
          apiKey: apiKey.trim() || undefined,
        });
      }

      const questions = res.questions || [];
      if (questions.length === 0) {
        toast.error('No questions could be generated. Please try providing more content.');
        return;
      }

      setAiPreview(questions);
      setEngineUsed(res.engine || 'curriculum_engine');
      if (res.engine === 'txt_parser_auto_detected') {
        toast.success(`Detected ${questions.length} formatted question(s)! Parsed directly.`, { icon: '📋' });
      } else {
        toast.success(`Generated ${questions.length} question(s)!`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply parsed questions to main quiz builder
  const handleApply = (questions) => {
    if (!questions || questions.length === 0) {
      toast.error('No valid questions to load.');
      return;
    }
    onApplyQuestions(questions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-[430px] flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                AI &amp; Bulk Quiz Assistant
              </h3>
              <p className="text-[11px] text-slate-500">
                Auto-generate or import questions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 border-b-2 py-2 text-xs font-bold transition ${
              activeTab === 'text'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>Import .txt / Paste</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 border-b-2 py-2 text-xs font-bold transition ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <BrainCircuit className="h-3.5 w-3.5" />
              <span>AI Quiz Agent</span>
            </div>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Upload or Paste Questions</span>
                <button
                  type="button"
                  onClick={downloadSampleQuizTxt}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                >
                  <Download className="h-3 w-3" />
                  Sample .txt
                </button>
              </div>

              {/* Upload file input */}
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-3 transition hover:bg-slate-100">
                <Upload className="h-5 w-5 text-slate-400" />
                <span className="mt-1 font-semibold text-slate-600">
                  Select a .txt file
                </span>
                <span className="text-[10px] text-slate-400">
                  Auto-detects questions, choices &amp; correct answers
                </span>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleTxtFileUpload}
                  className="hidden"
                />
              </label>

              <div>
                <p className="mb-1 text-[11px] font-semibold text-slate-500">
                  Or paste formatted text:
                </p>
                <textarea
                  rows={6}
                  placeholder={`1. What is 2 + 2?\nA) 3\n*B) 4\nC) 5\n\n2. Select prime numbers:\n[x] 2\n[x] 3\n[ ] 4`}
                  value={rawText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-3 font-mono text-[11px] leading-relaxed text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Supported formats hint */}
              <div className="rounded-xl bg-blue-50/70 p-2.5 text-[11px] text-blue-900 space-y-1">
                <p className="font-bold">Supported Answer Formats:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-blue-800">
                  <li>Asterisk on option: <code className="font-mono">*B) Answer</code></li>
                  <li>Checkbox: <code className="font-mono">[x] Correct</code> vs <code className="font-mono">[ ] Wrong</code></li>
                  <li>Answer line: <code className="font-mono">Answer: B</code> or <code className="font-mono">Answer: A, C</code></li>
                </ul>
              </div>

              {/* Warnings */}
              {textWarnings.length > 0 && (
                <div className="rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-900">
                  {textWarnings.map((w, idx) => (
                    <p key={idx}>⚠️ {w}</p>
                  ))}
                </div>
              )}

              {/* Parsed Preview */}
              {parsedPreview.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">
                      ✓ {parsedPreview.length} Question(s) Detected
                    </span>
                    <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-900">
                      Ready to Load
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {parsedPreview.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-emerald-100 bg-white p-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900">
                            {idx + 1}. {q.prompt}
                          </p>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {q.questionType === 'multiple_choice' ? 'Multi' : 'Single'}
                          </span>
                        </div>
                        <div className="mt-1.5 space-y-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`flex items-center justify-between rounded-lg px-2 py-1 text-[11px] ${
                                opt.isCorrect
                                  ? 'bg-emerald-100 font-bold text-emerald-900'
                                  : 'text-slate-600'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {opt.isCorrect && <Check className="h-3 w-3 text-emerald-700" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApply(parsedPreview)}
                    className="w-full rounded-2xl bg-emerald-600 py-2.5 font-bold text-white shadow-xs hover:bg-emerald-700"
                  >
                    Apply {parsedPreview.length} Question(s) to Quiz Builder
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <form onSubmit={handleGenerateAi} className="space-y-3">
              {/* File upload (.pdf or .txt) */}
              <div>
                <label className="font-bold text-slate-700">
                  Upload PDF or Text Notes
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:rounded-xl file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {aiFile && (
                    <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                      📄 Selected: {aiFile.name} ({(aiFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>

              {/* Or paste study text */}
              <div>
                <label className="font-bold text-slate-700">
                  Or Paste Lesson Notes / Syllabus
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste study text, lesson notes, textbook chapter, or formulas here..."
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Generator Settings */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600">Question Count</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-1.5 font-semibold text-slate-800"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={8}>8 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600">Question Type</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-1.5 font-semibold text-slate-800"
                  >
                    <option value="mixed">Mixed (Single &amp; Multi)</option>
                    <option value="single_choice">Single Choice Only</option>
                    <option value="multiple_choice">Multiple Choice Only</option>
                  </select>
                </div>
              </div>

              {/* Gemini API Key — auto-filled from env, teacher can override */}
              <div>
                <label className="flex items-center justify-between font-semibold text-slate-600">
                  <span>Gemini API Key</span>
                  {ENV_GEMINI_KEY ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      Gemini AI Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Optional</span>
                  )}
                </label>
                {ENV_GEMINI_KEY ? (
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <span className="text-[11px] font-semibold text-emerald-700">
                      🔑 Google Gemini API key configured
                    </span>
                    <button
                      type="button"
                      onClick={() => setApiKey(apiKey ? '' : ENV_GEMINI_KEY)}
                      className="ml-auto text-[10px] text-slate-400 hover:text-red-500 underline"
                    >
                      {apiKey ? 'Disconnect' : 'Reconnect'}
                    </button>
                  </div>
                ) : (
                  <input
                    type="password"
                    placeholder="Paste your Gemini API key here"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                  />
                )}
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {ENV_GEMINI_KEY
                    ? 'Using Google Gemini 1.5 Flash for intelligent question generation.'
                    : 'Uses built-in curriculum NLP engine if no key is entered.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing Content &amp; Generating Quiz...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Quiz with AI</span>
                  </>
                )}
              </button>

              {/* AI Generated Preview */}
              {aiPreview.length > 0 && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-indigo-950">
                        {engineUsed === 'txt_parser_auto_detected' ? '📋' : '✨'}{' '}
                        {aiPreview.length} AI Question(s) Generated
                      </p>
                      <p className="text-[10px] text-indigo-700">
                        Engine:{' '}
                        {engineUsed === 'google_gemini_ai'
                          ? '🤖 Google Gemini 1.5 Flash'
                          : engineUsed === 'txt_parser_auto_detected'
                          ? '📋 Auto-Parsed (Formatted Text)'
                          : engineUsed === 'txt_parser'
                          ? '📋 TXT Parser'
                          : '🧠 Built-in Curriculum Engine'}
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-900">
                      Generated
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {aiPreview.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-indigo-100 bg-white p-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900">
                            {idx + 1}. {q.prompt}
                          </p>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {q.questionType === 'multiple_choice' ? 'Multi' : 'Single'}
                          </span>
                        </div>
                        <div className="mt-1.5 space-y-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`flex items-center justify-between rounded-lg px-2 py-1 text-[11px] ${
                                opt.isCorrect
                                  ? 'bg-emerald-100 font-bold text-emerald-900'
                                  : 'text-slate-600'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {opt.isCorrect && <Check className="h-3 w-3 text-emerald-700" />}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="mt-1.5 text-[10px] text-slate-500 italic">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApply(aiPreview)}
                    className="w-full rounded-2xl bg-indigo-600 py-2.5 font-bold text-white shadow-xs hover:bg-indigo-700"
                  >
                    Apply {aiPreview.length} Generated Question(s) to Quiz
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

