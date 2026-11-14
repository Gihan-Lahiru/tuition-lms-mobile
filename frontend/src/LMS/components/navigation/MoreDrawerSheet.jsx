import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function MoreDrawerSheet({ open, onClose, title = 'More Tools', items = [] }) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl bg-white px-4 pb-6 pt-3 shadow-sheet max-h-[82%] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50 active:scale-[0.98]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-xs">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {item.label}
                  </p>
                  {item.hint && (
                    <p className="truncate text-[10px] text-slate-500">
                      {item.hint}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

