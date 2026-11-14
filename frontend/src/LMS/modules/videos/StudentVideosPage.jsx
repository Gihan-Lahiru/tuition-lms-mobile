import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Video,
  Play,
  Search,
  Clock,
  BookOpen,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { contentService } from '../../services/contentService';
import { useLMSAuth } from '../../context/LMSAuthContext';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import EmptyState from '../../components/feedback/EmptyState';
import StatusBadge from '../../components/feedback/StatusBadge';
import { extractYouTubeEmbedUrl } from '../../utils/formatters';

export default function StudentVideosPage() {
  const { user } = useLMSAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    contentService
      .listVideos(user?.grade)
      .then((data) => setVideos(data || []))
      .catch(() => toast.error('Failed to load video lessons'))
      .finally(() => setLoading(false));
  }, [user?.grade]);

  if (loading) return <LoadingSkeleton rows={4} />;

  // Extract unique topics for filter pills
  const topics = ['all', ...Array.from(new Set(videos.map((v) => v.topic).filter(Boolean)))];

  const q = search.trim().toLowerCase();
  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      !q ||
      v.title.toLowerCase().includes(q) ||
      (v.description || '').toLowerCase().includes(q) ||
      (v.topic || '').toLowerCase().includes(q);
    const matchesTopic = selectedTopic === 'all' || v.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  return (
    <div className="space-y-4 p-4 antialiased">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-5 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-blue-200">
              <Sparkles className="h-3 w-3 text-amber-300" />
              Recorded Lectures
            </span>
            <h2 className="mt-1.5 text-lg font-black tracking-tight">
              Class Video Lessons
            </h2>
            <p className="mt-0.5 text-xs text-blue-200/90">
              Watch theory explanations, experiment guides &amp; paper revisions
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
            <Video className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by topic or lesson name..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      {/* Topic Filter Pills */}
      {topics.length > 2 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTopic(t)}
              className={`shrink-0 rounded-xl px-3 py-1.5 font-bold transition capitalize ${
                selectedTopic === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'all' ? 'All Lessons' : t}
            </button>
          ))}
        </div>
      )}

      {/* Video Cards Grid */}
      {filteredVideos.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No video lessons found"
          description={
            search
              ? 'Try adjusting your search terms.'
              : 'Video recordings will appear here after teacher upload.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredVideos.map((video) => {
            const embedUrl = extractYouTubeEmbedUrl(video.videoUrl);
            const youtubeId = embedUrl?.split('/embed/')?.[1]?.split('?')?.[0];
            const autoThumb = youtubeId
              ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
              : null;

            return (
              <div
                key={video.id}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs transition hover:shadow-md"
              >
                {/* 16:9 Thumbnail with Overlay Play Button */}
                <div
                  className="relative aspect-video w-full bg-slate-900 cursor-pointer group"
                  onClick={() => setActiveVideo(video)}
                >
                  {autoThumb ? (
                    <img
                      src={autoThumb}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950">
                      <Video className="h-10 w-10 text-white/40" />
                    </div>
                  )}

                  {/* Dark gradient shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Central Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/90 text-white shadow-lg transition-transform duration-200 group-hover:scale-110">
                      <Play className="h-5 w-5 fill-white translate-x-0.5" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                      <Clock className="h-3 w-3" />
                      <span>{video.duration}</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      {video.grade}
                    </span>
                    {video.topic && (
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {video.topic}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {video.title}
                  </h3>

                  {video.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {video.description}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveVideo(video)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Watch Lesson</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-xs"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-slate-950 p-4 shadow-2xl text-white border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-3">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  {activeVideo.topic || 'Video Lesson'}
                </span>
                <h3 className="truncate text-sm font-bold text-white">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="rounded-full bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Responsive Player */}
            {extractYouTubeEmbedUrl(activeVideo.videoUrl) ? (
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/10">
                <iframe
                  className="h-full w-full"
                  src={extractYouTubeEmbedUrl(activeVideo.videoUrl)}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900 p-6 text-center space-y-3">
                <Video className="h-10 w-10 text-blue-400 mx-auto" />
                <p className="text-xs text-slate-300">
                  This video is hosted on an external learning portal.
                </p>
                <a
                  href={activeVideo.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                >
                  <span>Open Video in New Window</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* Video Meta Info */}
            <div className="mt-3 text-xs text-slate-400 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span>Grade: {activeVideo.grade}</span>
                {activeVideo.duration && <span>Duration: {activeVideo.duration}</span>}
              </div>
              {activeVideo.description && (
                <p className="text-slate-300 pt-1 text-[11px] leading-relaxed">
                  {activeVideo.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
