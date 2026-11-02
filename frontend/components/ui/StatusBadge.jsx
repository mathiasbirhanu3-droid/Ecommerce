const STYLES = {
  pending: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  suspended: 'bg-danger/15 text-danger',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STYLES[status] || 'bg-raised text-ink/60'}`}>
      {status}
    </span>
  );
}