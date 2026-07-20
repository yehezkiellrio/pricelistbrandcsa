type Props = { label: string; value: string | number; hint?: string };
export default function StatCard({ label, value, hint }: Props) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div>;
}
