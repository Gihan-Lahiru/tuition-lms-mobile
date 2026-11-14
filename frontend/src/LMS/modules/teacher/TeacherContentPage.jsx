import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, FileUp, Video, XCircle, Trash2, ExternalLink } from 'lucide-react';
import { contentService } from '../../services/contentService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import StatusBadge from '../../components/feedback/StatusBadge';
import { formatLKR } from '../../utils/formatters';

export default function TeacherContentPage() {
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState([]);
  const [papers, setPapers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [paperForm, setPaperForm] = useState({
    title: '',
    grade: 'Grade 10',
    type: 'Past Paper',
    topic: '',
    year: '2026',
  });
  const [paperFile, setPaperFile] = useState(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    videoUrl: '',
    grade: 'Grade 10',
    topic: 'General Theory',
    duration: '25 mins',
  });

  const load = async () => {
    try {
      const [rec, pap, vid] = await Promise.all([
        contentService.listAllReceipts(),
        contentService.listPapers(),
        contentService.listVideos(),
      ]);
      setReceipts(rec || []);
      setPapers(pap || []);
      setVideos(vid || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const uploadPaper = async (e) => {
    e.preventDefault();
    if (!paperFile) {
      toast.error('Attach a PDF file');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('file', paperFile);
      Object.entries(paperForm).forEach(([k, v]) => fd.append(k, v));
      await contentService.uploadPaper(fd);
      toast.success('Paper uploaded');
      setPaperFile(null);
      setPaperForm({ ...paperForm, title: '' });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    }
  };

  const addVideo = async (e) => {
    e.preventDefault();
    try {
      await contentService.createVideo(videoForm);
      toast.success('Video lesson published');
      setVideoForm({
        title: '',
        videoUrl: '',
        grade: 'Grade 10',
        topic: 'General Theory',
        duration: '25 mins',
      });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save video');
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Delete this video lesson?')) return;
    try {
      await contentService.deleteVideo(id);
      toast.success('Video removed');
      load();
    } catch {
      toast.error('Failed to delete video');
    }
  };

  const reviewReceipt = async (id, approve) => {
    try {
      if (approve) {
        await contentService.approveReceipt(id, 'Approved via Teacher LMS');
        toast.success('Receipt approved & student unlocked');
      } else {
        await contentService.rejectReceipt(id, 'Slip unclear — re-upload');
        toast.success('Receipt rejected');
      }
      load();
    } catch {
      toast.error('Could not update receipt');
    }
  };

  if (loading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Content &amp; Fee Approvals
        </h2>
        <p className="text-xs text-slate-500">
          Upload papers, publish videos &amp; verify bank slips
        </p>
      </div>

      {/* Receipt Approval Queue */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs space-y-2.5">
        <h3 className="text-sm font-bold text-slate-900">
          Student Fee Receipts ({receipts.length})
        </h3>
        {receipts.map((r) => (
          <div key={r.id} className="rounded-2xl bg-slate-50 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">
                  {r.studentName} • {formatLKR(r.amount)}
                </p>
                <p className="text-[11px] text-slate-500">
                  {r.month} {r.year}
                </p>
              </div>
              <StatusBadge
                label={r.approvalStatus}
                tone={
                  r.approvalStatus === 'approved'
                    ? 'green'
                    : r.approvalStatus === 'rejected'
                      ? 'red'
                      : 'amber'
                }
              />
            </div>
            {r.approvalStatus === 'pending' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => reviewReceipt(r.id, true)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-1.5 font-bold text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => reviewReceipt(r.id, false)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-600 py-1.5 font-bold text-white"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload Watermarked PDF Paper */}
      <form
        onSubmit={uploadPaper}
        className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs space-y-2.5"
      >
        <h3 className="text-sm font-bold text-slate-900">Upload Past Paper PDF</h3>
        <input
          required
          placeholder="Paper title"
          value={paperForm.title}
          onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            required
            placeholder="Grade (e.g. Grade 10)"
            value={paperForm.grade}
            onChange={(e) => setPaperForm({ ...paperForm, grade: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
          />
          <input
            placeholder="Year (e.g. 2026)"
            value={paperForm.year}
            onChange={(e) => setPaperForm({ ...paperForm, year: e.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
          />
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs">
          <span className="flex items-center gap-2 font-semibold text-slate-700">
            <FileUp className="h-4 w-4 text-blue-600" />
            {paperFile ? paperFile.name : 'Choose PDF file'}
          </span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setPaperFile(e.target.files?.[0] || null)}
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white"
        >
          Upload Paper ({papers.length} total)
        </button>
      </form>

      {/* Add Video Lesson */}
      <form
        onSubmit={addVideo}
        className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Video className="h-4 w-4 text-indigo-600" />
            <span>Publish Video Lesson</span>
          </div>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
            {videos.length} Published
          </span>
        </div>

        <input
          required
          placeholder="Video title (e.g. Algebra Complete Revision)"
          value={videoForm.title}
          onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
        />

        <input
          required
          placeholder="YouTube URL or Embed link"
          value={videoForm.videoUrl}
          onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
        />

        <div className="grid grid-cols-3 gap-2">
          <select
            value={videoForm.grade}
            onChange={(e) => setVideoForm({ ...videoForm, grade: e.target.value })}
            className="rounded-xl border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700"
          >
            {['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <input
            placeholder="Topic"
            value={videoForm.topic}
            onChange={(e) => setVideoForm({ ...videoForm, topic: e.target.value })}
            className="rounded-xl border border-slate-200 px-2 py-2 text-xs"
          />

          <input
            placeholder="Duration (e.g. 45m)"
            value={videoForm.duration}
            onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
            className="rounded-xl border border-slate-200 px-2 py-2 text-xs"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
        >
          Publish Video Lesson
        </button>
      </form>

      {/* Published Videos List */}
      {videos.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs space-y-2.5">
          <h3 className="text-sm font-bold text-slate-900">
            Published Video Lessons ({videos.length})
          </h3>
          <div className="space-y-2">
            {videos.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate font-bold text-slate-900">{v.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {v.grade} {v.topic ? `• ${v.topic}` : ''} {v.duration ? `• ${v.duration}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={v.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    title="Open Video URL"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(v.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                    title="Delete Video"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

