import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { scansApi } from '../api/resources';
import SeverityBadge from '../components/SeverityBadge';

const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 };

export default function ScanDetailPage() {
  const { id } = useParams();
  const { data: scan, isLoading } = useQuery({ queryKey: ['scans', id], queryFn: () => scansApi.get(id) });

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (!scan) return <p className="text-slate-500">Scan not found.</p>;

  const findings = [...(scan.ScanResults || [])].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  const grouped = findings.reduce((acc, f) => {
    (acc[f.module] ||= []).push(f);
    return acc;
  }, {});

  return (
    <div>
      <Link to={`/websites/${scan.WebsiteId}`} className="text-sm text-slate-500 hover:underline">
        &larr; Back to website
      </Link>
      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Scan #{scan.id}</h1>
          <p className="text-sm text-slate-500">{new Date(scan.createdAt).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">{scan.securityScore ?? '—'}</div>
          <div className="text-sm text-slate-500">{scan.scoreCategory}</div>
        </div>
      </div>

      {Object.entries(grouped).map(([module, items]) => (
        <div key={module} className="bg-white border rounded-lg mb-4 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b text-sm font-medium">{module}</div>
          <ul className="divide-y">
            {items.map((f) => (
              <li key={f.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <SeverityBadge severity={f.severity} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">{f.issue}</p>
                    {f.recommendation && (
                      <p className="text-xs text-slate-500 mt-1">{f.recommendation}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
