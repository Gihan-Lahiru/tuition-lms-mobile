import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, FileUp, ShieldAlert } from 'lucide-react';
import { contentService } from '../../services/contentService';
import { useLMSAuth } from '../../context/LMSAuthContext';
import LoadingSkeleton from '../../components/feedback/LoadingSkeleton';
import StatusBadge from '../../components/feedback/StatusBadge';
import { formatLKR } from '../../utils/formatters';
import { formatColomboDate } from '../../utils/colomboTime';

export default function StudentFeesPage() {
  const { refreshMe } = useLMSAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState('2500');
  const [month, setMonth] = useState(
    new Date().toLocaleString('en-US', { month: 'long' }),
  );
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const res = await contentService.getMyPayments();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please attach a receipt image or PDF');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('amount', amount);
      formData.append('month', month);
      formData.append('year', String(new Date().getFullYear()));
      await contentService.uploadReceipt(formData);
      toast.success('Receipt submitted for teacher verification');
      setFile(null);
      await load();
      await refreshMe();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Receipt upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={3} />;

  const status = data?.status || {};
  const payments = data?.payments || [];

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Fees &amp; Receipts</h2>
        <p className="text-xs text-slate-500">
          14-day grace rule &amp; private payment verification
        </p>
      </div>

      <div
        className={`rounded-3xl p-5 text-white shadow-sm ${
          status.isLocked
            ? 'bg-gradient-to-br from-rose-600 to-rose-800'
            : status.paymentStatus === 'paid'
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
              : 'bg-gradient-to-br from-amber-500 to-orange-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
            Payment Status
          </span>
          <CreditCard className="h-5 w-5 opacity-90" />
        </div>
        <p className="mt-1 text-2xl font-black capitalize">
          {String(status.paymentStatus || 'unpaid').replace('_', ' ')}
        </p>
        <p className="mt-1 text-xs opacity-90">
          {status.isLocked
            ? '14-day grace period expired. Upload a verified slip to unlock papers and quizzes.'
            : status.paymentStatus === 'paid'
              ? `Active until ${formatColomboDate(status.paymentDueDate)}`
              : `${status.graceDaysRemaining ?? 0} grace day(s) remaining before lock`}
        </p>
      </div>

      {status.isLocked && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Dashboard unlock only happens server-side after teacher approval of your uploaded receipt.
          </span>
        </div>
      )}

      <form
        onSubmit={handleUpload}
        className="rounded-3xl border border-slate-100 bg-white p-4 shadow-xs space-y-3"
      >
        <h3 className="text-sm font-bold text-slate-900">Upload Bank Deposit Slip</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">
              Amount (LKR)
            </label>
            <input
              type="number"
              required
              min={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Month</label>
            <input
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs">
          <span className="flex items-center gap-2 font-semibold text-slate-700">
            <FileUp className="h-4 w-4 text-blue-600" />
            {file ? file.name : 'Choose Receipt (PDF, JPG, PNG)'}
          </span>
          <input
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white disabled:opacity-60"
        >
          {uploading ? 'Uploading Receipt...' : 'Submit Receipt for Approval'}
        </button>
      </form>

      <div className="space-y-2.5">
        <h3 className="text-sm font-bold text-slate-900">Payment History</h3>
        {payments.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 text-xs shadow-xs"
          >
            <div>
              <p className="font-bold text-slate-900">
                {formatLKR(p.amount)} • {p.month} {p.year}
              </p>
              {p.reviewNotes && (
                <p className="text-[11px] text-slate-500">{p.reviewNotes}</p>
              )}
            </div>
            <StatusBadge
              label={p.approvalStatus}
              tone={
                p.approvalStatus === 'approved'
                  ? 'green'
                  : p.approvalStatus === 'rejected'
                    ? 'red'
                    : 'amber'
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

