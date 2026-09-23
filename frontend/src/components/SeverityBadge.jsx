const STYLES = {
  Critical: 'bg-critical/10 text-critical border-critical/30',
  High: 'bg-high/10 text-high border-high/30',
  Medium: 'bg-medium/10 text-medium border-medium/30',
  Low: 'bg-low/10 text-low border-low/30',
  Info: 'bg-info/10 text-info border-info/30',
};

export default function SeverityBadge({ severity }) {
  const cls = STYLES[severity] || STYLES.Info;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {severity}
    </span>
  );
}
