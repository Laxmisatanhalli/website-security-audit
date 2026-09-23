import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../api/resources';

const SEVERITY_COLORS = {
  Critical: '#7a0d0d', High: '#c0392b', Medium: '#d68910', Low: '#2e86c1', Info: '#7f8c8d',
};

function StatCard({ label, value, tone }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${tone || ''}`}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-medium text-slate-700 mb-3">{title}</h3>
      <div style={{ width: '100%', height: 260 }}>{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const overview = useQuery({ queryKey: ['dashboard', 'overview'], queryFn: dashboardApi.overview });
  const riskDist = useQuery({ queryKey: ['dashboard', 'risk'], queryFn: dashboardApi.riskDistribution });
  const vulnCats = useQuery({ queryKey: ['dashboard', 'vuln-cats'], queryFn: dashboardApi.vulnerabilityCategories });
  const scoreTrend = useQuery({ queryKey: ['dashboard', 'score-trend'], queryFn: () => dashboardApi.scoreTrend() });
  const sslTimeline = useQuery({ queryKey: ['dashboard', 'ssl'], queryFn: dashboardApi.sslExpiryTimeline });
  const monthly = useQuery({ queryKey: ['dashboard', 'monthly'], queryFn: dashboardApi.monthlyScanSummary });

  const o = overview.data;

  const riskData = riskDist.data
    ? Object.entries(riskDist.data)
        .filter(([, count]) => count > 0)
        .map(([severity, count]) => ({ severity, count }))
    : [];

  const scoreTrendData = (scoreTrend.data || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString(),
    score: d.score,
  }));

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      {overview.isLoading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Websites" value={o?.totalWebsites ?? '—'} />
          <StatCard label="Total Scans" value={o?.totalScans ?? '—'} />
          <StatCard label="Critical Findings" value={o?.criticalFindings ?? 0} tone="text-critical" />
          <StatCard label="High Findings" value={o?.highFindings ?? 0} tone="text-high" />
          <StatCard label="Medium Findings" value={o?.mediumFindings ?? 0} tone="text-medium" />
          <StatCard label="Low Findings" value={o?.lowFindings ?? 0} tone="text-low" />
          <StatCard label="Avg Security Score" value={o?.averageSecurityScore ?? '—'} />
          <StatCard label="SSL Expiry Alerts" value={o?.sslExpiryAlerts ?? 0} tone={o?.sslExpiryAlerts ? 'text-high' : ''} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Risk Distribution">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={riskData} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={90} label>
                {riskData.map((entry) => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vulnerability Categories">
          <ResponsiveContainer>
            <BarChart data={vulnCats.data || []} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="module" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2e86c1" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Security Score Trend">
          <ResponsiveContainer>
            <LineChart data={scoreTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#1e8449" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Scan Summary">
          <ResponsiveContainer>
            <BarChart data={monthly.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#7f8c8d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-3">SSL Expiry Timeline</h3>
        {sslTimeline.isLoading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : (sslTimeline.data || []).length === 0 ? (
          <p className="text-slate-500 text-sm">No SSL certificates expiring soon.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2">Website</th>
                <th className="py-2">Expires</th>
                <th className="py-2">Days Remaining</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {sslTimeline.data.map((row) => (
                <tr key={row.websiteId} className="border-b last:border-0">
                  <td className="py-2">{row.name}</td>
                  <td className="py-2">{new Date(row.sslExpiryDate).toLocaleDateString()}</td>
                  <td className="py-2">{row.daysRemaining}</td>
                  <td className="py-2">
                    <span
                      className={
                        row.status === 'Expired'
                          ? 'text-critical'
                          : row.status === 'Expiring Soon'
                          ? 'text-high'
                          : 'text-slate-500'
                      }
                    >
                      {row.status}
                    </span>
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
