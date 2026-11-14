import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  Play,
  Search,
  Video,
  X,
} from 'lucide-react';
import { contentService } from '../../services/contentService';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';
import StatusBadge from '../../components/feedback/StatusBadge';
import { extractYouTubeEmbedUrl } from '../../utils/formatters';

export default function StudyHubPage() {
  const [tab, setTab] = useState('papers');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    Promise.all([
      contentService.listPapers(),
      contentService.listNotes(),
      contentService.listVideos(),
    ])
      .then(([p, n, v]) => {
        setPapers(p || []);
        setNotes(n || []);
        setVideos(v || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const openWatermarkedPdf = async (kind, item, inline = true) => {
    try {
      const res =
        kind === 'paper'
          ? await contentService.downloadPaperBlob(item.id, inline)
          : await contentService.downloadNoteBlob(item.id, inline);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (inline) {
        setPreviewTitle(item.title);
        setPreviewPdfUrl(url);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.title.replace(/\s+/g, '_')}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        toast.success('Watermarked PDF downloaded');
      }
    } catch {
      toast.error('Could not load watermarked PDF');
    }
  };

  const closePdf = () => {
    if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
    setPreviewPdfUrl(null);
  };

  if (loading) return <LoadingSkeleton rows={4} />;

  const q = search.trim().toLowerCase();
  const filteredPapers = papers.filter(
    (p) =>
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.topic || '').toLowerCase().includes(q) ||
      (p.year || '').includes(q),
  );
  const filteredNotes = notes.filter(
    (n) =>
      !q ||
      n.title.toLowerCase().includes(q) ||
      (n.topic || '').toLowerCase().includes(q),
  );
  const filteredVideos = videos.filter(
    (v) =>
      !q ||
      v.title.toLowerCase().includes(q) ||
      (v.topic || '').toLowerCase().includes(q),
  );

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Study Library</h2>
        <p className="text-xs text-slate-500">
          Watermarked past papers, study notes &amp; video lessons
        </p>
      </div>

      {/* Mobile Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search topic, year, or paper..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* Segmented App Tabs */}
      <div className="grid grid-cols-3 rounded-2xl bg-slate-200/70 p-1 text-xs font-bold">
        {[
          { key: 'papers', label: `Papers (${filteredPapers.length})` },
          { key: 'notes', label: `Notes (${filteredNotes.length})` },
          { key: 'videos', label: `Videos (${filteredVideos.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl py-2 transition ${
              tab === t.key ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'papers' && (
        <div className="space-y-3">
          {filteredPapers.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No past papers found"
              description="Try clearing your search or check back after class upload."
            />
          ) : (
            filteredPapers.map((p) => (
              <div
                key={p.id}
                className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge label={p.type || 'Paper'} tone="blue" />
                      {p.year && <StatusBadge label={p.year} tone="slate" />}
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-slate-900">
                      {p.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.grade} {p.topic ? `• ${p.topic}` : ''}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {p.downloads || 0} dl
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openWatermarkedPdf('paper', p, true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-200"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => openWatermarkedPdf('paper', p, false)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-3">
          {filteredNotes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No notes uploaded"
              description="Lesson notes for your grade will appear here."
            />
          ) : (
            filteredNotes.map((n) => (
              <div
                key={n.id}
                className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs"
              >
                <StatusBadge label={n.topic || 'Note'} tone="indigo" />
                <h3 className="mt-2 text-sm font-bold text-slate-900">{n.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{n.grade}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openWatermarkedPdf('note', n, true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Read Note
                  </button>
                  <button
                    type="button"
                    onClick={() => openWatermarkedPdf('note', n, false)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 py-2.5 text-xs font-bold text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'videos' && (
        <div className="space-y-3">
          {filteredVideos.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No video lessons yet"
              description="Recorded revision lessons will appear here."
            />
          ) : (
            filteredVideos.map((v) => (
              <div
                key={v.id}
                className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <StatusBadge label={v.duration || 'Video'} tone="amber" />
                    <h3 className="mt-2 text-sm font-bold text-slate-900">{v.title}</h3>
                    {v.description && (
                      <p className="mt-1 text-xs text-slate-600">{v.description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVideo(v)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-2.5 text-xs font-bold text-white"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Watch Lesson
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* In-App Watermarked PDF Viewer Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 p-3">
          <div className="flex items-center justify-between rounded-t-2xl bg-slate-900 px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{previewTitle}</p>
              <p className="text-[11px] text-blue-300">
                Watermarked for your student account
              </p>
            </div>
            <button
              type="button"
              onClick={closePdf}
              className="rounded-full bg-white/10 p-2 hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <iframe
            src={previewPdfUrl}
            title={previewTitle}
            className="h-full w-full flex-1 rounded-b-2xl bg-white"
          />
        </div>
      )}

      {/* Video Player Bottom Sheet / Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 p-0 sm:p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="w-full max-w-[418px] rounded-t-3xl sm:rounded-3xl bg-white p-4 shadow-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3">
              <h3 className="truncate pr-2 text-sm font-bold text-slate-900">
                {activeVideo.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {extractYouTubeEmbedUrl(activeVideo.videoUrl) ? (
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-900">
                <iframe
                  className="h-full w-full"
                  src={extractYouTubeEmbedUrl(activeVideo.videoUrl)}
                  title={activeVideo.title}
                  allowFullScreen
                />
              </div>
            ) : (
              <a
                href={activeVideo.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl bg-blue-600 py-3 text-center text-sm font-bold text-white"
              >
                Open Video Link
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

