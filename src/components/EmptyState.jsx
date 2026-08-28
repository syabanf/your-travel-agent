// Friendly empty state — icon + title + hint + optional action.
//   <EmptyState icon={Inbox} title="No bookings yet" hint="…" action={<button…/>} />
export default function EmptyState({ icon: Icon, title, hint, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-ich-gold/10 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-gold" />
        </div>
      )}
      <p className="font-display font-semibold text-ich-primary">{title}</p>
      {hint && <p className="text-sm text-ich-neutral mt-1 max-w-xs">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
