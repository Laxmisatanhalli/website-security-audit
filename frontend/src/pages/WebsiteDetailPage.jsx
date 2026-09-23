import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { websitesApi, scansApi, reportsApi } from '../api/resources';

const REPORT_TYPES = [
  { value: 'executive', label: 'Executive Summary' },
  { value: 'technical', label: 'Technical' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'vulnerability', label: 'Vulnerability' },
  { value: 'remediation', label: 'Remediation' },
];

export default function WebsiteDetailPage() {
  const { id } = useParams();
  const [compareIds, setCompareIds] = useState([]);
  const [reportType, setReportType] = useState('technical');
  const [reportFormat, setReportFormat] = useState('pdf');

  const { data: website } = useQuery({ queryKey: ['websites', id], queryFn: () => websitesApi.get(id) });
  const { data: scans } = useQuery({ queryKey: ['scans'], queryFn: scansApi.list });

  const websiteScans = (scans || [])
    .filter((s) => s.WebsiteId === Number(id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function toggleCompare(scanId) {
    setCompareIds((prev) => {
      if (prev.includes(scanId)) return prev.filter((x) => x !== scanId);
      if (prev.length >= 2) return [prev[1], scanId];
      return [...prev, scanId];
    });
  }

  const latestScanId = websiteScans[0]?.id;

  return (
    <div>
      <Link to="/websites" className="text-sm text-slate-500 hover:underline">&larr; Websites</Link>
      <h1 className="text-xl font-semibold mt-2 mb-1">{website?.name}</h1>
      <p className="text-sm text-slate-500 mb-6">{website?.url}</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <InfoCard label="Security Score" value={website?.securityScore ?? '—'} />
        <InfoCard label="Environment" value={website?.environment} />
        <InfoCard label="Scan Frequency" value={website?.scanFrequency} />
        <InfoCard label="Status" value={website?.status} />
      </div>

      {latestScanId && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium mb-3">Download a report (latest scan)</h3>
          <div className="flex gap-2 items-center">
            <select
              className="border rounded px-3 py-2 text-sm"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <button
              onClick={() => reportsApi.download(latestScanId, reportType, reportFormat)}
              className="bg-slate-900 text-white text-sm px-4 py-2 rounded"
            >
              Download
            </button>
            <button
              onClick={() => reportsApi.downloadTrend(id, reportFormat)}
              className="border text-sm px-4 py-2 rounded"
            >
              Download Trend Report
            </button>
          </div>
        </div>
      )}

      {compareIds.length === 2 && <CompareResult previousId={compareIds[0]} currentId={compareIds[1]} />}

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-sm font-medium">Scan History</h3>
          {compareIds.length === 2 && (
            <button onClick={() => setCompareIds([])} className="text-xs text-slate-500">
              Clear comparison
            </button>
          )}
        </div>
        {!websiteScans.length ? (
          <p className="p-4 text-slate-500 text-sm">No scans yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b bg-slate-50">
                <th className="py-2 px-4">Compare</th>
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Score</th>
                <th className="py-2 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {websiteScans.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 px-4">
                    <input
                      type="checkbox"
                      checked={compareIds.includes(s.id)}
                      onChange={() => toggleCompare(s.id)}
                    />
                  </td>
                  <td className="py-2 px-4">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-4">{s.status}</td>
                  <td className="py-2 px-4">{s.securityScore ?? '—'}</td>
                  <td className="py-2 px-4">
                    <Link to={`/scans/${s.id}`} className="text-slate-900 hover:underline text-xs">
                      View findings
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-lg font-semibold mt-1">{value ?? '—'}</div>
    </div>
  );
}

function CompareResult({ previousId, currentId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['compare', previousId, currentId],
    queryFn: () => scansApi.compare(previousId, currentId),
  });

  if (isLoading) return <p className="text-sm text-slate-500 mb-4">Comparing…</p>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <ResultList title="Resolved" items={data.resolved} tone="text-green-700" />
      <ResultList title="Recurring" items={data.recurring} tone="text-slate-600" />
      <ResultList title="New" items={data.newIssues} tone="text-high" />
    </div>
  );
}

function ResultList({ title, items, tone }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h4 className={`text-sm font-medium mb-2 ${tone}`}>{title} ({items.length})</h4>
      <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
        {items.map((f, i) => (
          <li key={i} className="text-slate-600">{f.module}: {f.issue}</li>
        ))}
      </ul>
    </div>
  );
}
