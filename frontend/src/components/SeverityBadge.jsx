const styles = {
  Critical: 'severity-critical', High: 'severity-high', Medium: 'severity-medium',
  Low: 'severity-low', Info: 'severity-info',
};
export default function SeverityBadge({ severity = 'Info' }) {
  return <span className={`severity ${styles[severity] || styles.Info}`}><span />{severity}</span>;
}
