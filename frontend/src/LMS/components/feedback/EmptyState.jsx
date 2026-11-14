export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

