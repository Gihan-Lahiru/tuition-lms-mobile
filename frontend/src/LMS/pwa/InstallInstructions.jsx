import { Share, PlusSquare, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../context/PWAInstallContext';

export default function InstallInstructions() {
  const { showInstructions, setShowInstructions, isIOS } = usePWAInstall();

  if (!showInstructions) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-[2px] p-0">
      <div className="w-full rounded-t-3xl bg-white p-5 shadow-sheet max-h-[85%] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Install MW Tuition LMS
              </h3>
              <p className="text-xs text-slate-500">
                {isIOS ? 'iPhone & iPad (Safari)' : 'Android & Desktop Chrome'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInstructions(false)}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close install guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-700">
          {isIOS ? (
            <>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                <Share className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-900">1. Tap Safari Share</p>
                  <p className="text-xs text-slate-600">
                    Open this page in Safari and tap the Share icon at the bottom bar.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                <PlusSquare className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-900">
                    2. Add to Home Screen
                  </p>
                  <p className="text-xs text-slate-600">
                    Scroll down, tap &ldquo;Add to Home Screen&rdquo;, then confirm &ldquo;Add&rdquo;.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
              <p className="font-semibold text-slate-900 text-sm">
                Quick Install Steps
              </p>
              <p>1. Tap the browser menu (⋮) or address-bar Install icon.</p>
              <p>2. Select &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;.</p>
              <p>
                3. Launch <strong>MW LMS</strong> anytime in full-screen mobile app mode.
              </p>
            </div>
          )}

          <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            Privacy note: For security, exam answers, marks, fee receipts, and watermarked PDFs are never cached publicly in shared browser storage.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInstructions(false)}
          className="mt-5 w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

