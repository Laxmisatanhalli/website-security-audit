import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScanProgress } from '../context/ScanProgressContext';

function ElapsedBar({ startedAt, estimatedDurationMs }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, []);
  const elapsed = Date.now() - startedAt;
  const pct = Math.min(92, Math.round((elapsed / estimatedDurationMs) * 100)); // never claim 100% until actually done
  return (
    <div style={{ height: 4, background: '#e5e9ef', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: '#2fb493', transition: 'width .5s linear' }} />
    </div>
  );
}

export default function ScanProgressBanner() {
  const { activeScans, estimatedDurationMs } = useScanProgress();
  if (!activeScans.length) return null;

  return (
    <div style={{ padding: '10px 34px 0' }}>
      {activeScans.map((s) => (
        <div key={s.id} className="card" style={{ padding: '10px 16px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
            <span><strong>Scanning {s.websiteName}…</strong> this keeps running while you use other pages</span>
            <Link to={`/scans/${s.id}`} className="btn btn-secondary" style={{ minHeight: 28, padding: '0 10px', fontSize: 11 }}>
              View
            </Link>
          </div>
          <ElapsedBar startedAt={s.startedAt} estimatedDurationMs={estimatedDurationMs} />
        </div>
      ))}
    </div>
  );
}