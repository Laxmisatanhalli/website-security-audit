import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi, websitesApi, scansApi } from '../api/resources';
import Icon from '../components/Icon';

const COLORS={Critical:'#c94b52',High:'#d5744e',Medium:'#bd922d',Low:'#5b86bd',Info:'#8893a3'};
function Stat({label,value,accent,note}){return <div className="card stat-card"><span className={`stat-accent ${accent||''}`}/><div className="stat-label">{label}</div><div className="stat-value">{value??'—'}</div>{note&&<div className="stat-note">{note}</div>}</div>}
function Card({title,sub,children,action}){return <div className="card"><div className="card-head"><div><h3 className="card-title">{title}</h3>{sub&&<div className="card-sub">{sub}</div>}</div>{action}</div>{children}</div>}
export default function DashboardPage(){
 const overview=useQuery({queryKey:['dashboard','overview'],queryFn:dashboardApi.overview});
 const risk=useQuery({queryKey:['dashboard','risk'],queryFn:dashboardApi.riskDistribution});
 const cats=useQuery({queryKey:['dashboard','cats'],queryFn:dashboardApi.vulnerabilityCategories});
 const trend=useQuery({queryKey:['dashboard','trend'],queryFn:()=>dashboardApi.scoreTrend()});
 const ssl=useQuery({queryKey:['dashboard','ssl'],queryFn:dashboardApi.sslExpiryTimeline});
 const monthly=useQuery({queryKey:['dashboard','monthly'],queryFn:dashboardApi.monthlyScanSummary});
 const websites=useQuery({queryKey:['websites'],queryFn:websitesApi.list});
 const scans=useQuery({queryKey:['scans'],queryFn:scansApi.list});
 const o=overview.data;
 const riskData=Object.entries(risk.data||{}).filter(([,v])=>v>0).map(([name,value])=>({name,value}));
 const trendData=(trend.data||[]).slice(-10).map(x=>({date:new Date(x.date).toLocaleDateString(undefined,{month:'short',day:'numeric'}),score:x.score}));
 const recent=(scans.data||[]).slice(0,5);
 return <div>
  <div className="page-head"><div><h2 className="page-title">Security overview</h2><p className="page-desc">A quick view of your websites, audit activity and current exposure.</p></div><Link to="/websites" className="btn btn-primary"><Icon name="scan" size={15}/>Manage scans</Link></div>
  <div className="stat-grid">
   <Stat label="Websites" value={o?.totalWebsites} accent="blue" note="Registered targets"/>
   <Stat label="Total scans" value={o?.totalScans} accent="green" note="Audits completed"/>
   <Stat label="Average score" value={o?.averageSecurityScore??'—'} accent="green" note="Across scored websites"/>
   <Stat label="SSL alerts" value={o?.sslExpiryAlerts??0} accent={o?.sslExpiryAlerts?'red':'green'} note="Expiring within 30 days"/>
   <Stat label="Critical" value={o?.criticalFindings??0} accent="red" note="Immediate attention"/>
   <Stat label="High" value={o?.highFindings??0} accent="red" note="High-severity findings"/>
   <Stat label="Medium" value={o?.mediumFindings??0} accent="amber" note="Review recommended"/>
   <Stat label="Low" value={o?.lowFindings??0} accent="blue" note="Lower-severity findings"/>
  </div>
  <div className="grid-2">
   <Card title="Risk distribution" sub="Findings across all completed scans"><div className="chart-wrap">{riskData.length?<ResponsiveContainer><PieChart><Pie data={riskData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={92} paddingAngle={3}>{riskData.map(x=><Cell key={x.name} fill={COLORS[x.name]}/>)}</Pie><Tooltip/><LegendFallback data={riskData}/></PieChart></ResponsiveContainer>:<div className="empty">No findings to display yet.</div>}</div></Card>
   <Card title="Security score trend" sub="Recent completed scans"><div className="chart-wrap">{trendData.length?<ResponsiveContainer><LineChart data={trendData} margin={{left:-18,right:8,top:10,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4"/><XAxis dataKey="date" tick={{fontSize:10,fill:'#8994a4'}} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} tick={{fontSize:10,fill:'#8994a4'}} axisLine={false} tickLine={false}/><Tooltip/><Line type="monotone" dataKey="score" stroke="#2f9b82" strokeWidth={2.5} dot={{r:3,fill:'#2f9b82'}}/></LineChart></ResponsiveContainer>:<div className="empty">Run a scan to build the trend.</div>}</div></Card>
  </div>
  <div className="grid-2-equal">
   <Card title="Recent scans" sub="Latest audit activity" action={<Link to="/websites" className="card-sub">View websites →</Link>}>
    <div className="table-wrap"><table><thead><tr><th>Website</th><th>Status</th><th>Score</th><th>Date</th></tr></thead><tbody>{recent.length?recent.map(s=><tr key={s.id}><td><strong>{s.Website?.name||`Website #${s.WebsiteId}`}</strong><div className="url">{s.Website?.url}</div></td><td><span className="status-pill"><span>●</span>{s.status}</span></td><td><strong>{s.securityScore??'—'}</strong></td><td className="muted">{new Date(s.createdAt).toLocaleDateString()}</td></tr>):<tr><td colSpan="4"><div className="empty">No scans yet.</div></td></tr>}</tbody></table></div>
   </Card>
   <Card title="Vulnerability categories" sub="Most common actionable modules"><div className="chart-wrap">{(cats.data||[]).length?<ResponsiveContainer><BarChart data={(cats.data||[]).slice(0,7)} layout="vertical" margin={{left:5,right:12}}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#edf0f4"/><XAxis type="number" allowDecimals={false} hide/><YAxis type="category" dataKey="module" width={105} tick={{fontSize:9,fill:'#778397'}}/><Tooltip/><Bar dataKey="count" fill="#6b8fc2" radius={[0,4,4,0]} barSize={13}/></BarChart></ResponsiveContainer>:<div className="empty">No vulnerability data yet.</div>}</div></Card>
  </div>
  <Card title="SSL certificate timeline" sub="Certificate status for registered websites">
   <div className="table-wrap"><table><thead><tr><th>Website</th><th>Expires</th><th>Days remaining</th><th>Status</th></tr></thead><tbody>{(ssl.data||[]).length?(ssl.data||[]).slice(0,6).map(r=><tr key={r.websiteId}><td><strong>{r.name}</strong><div className="url">{r.url}</div></td><td>{new Date(r.sslExpiryDate).toLocaleDateString()}</td><td>{r.daysRemaining}</td><td><span className={`status-pill ${r.status!=='Valid'?'off':''}`}>{r.status}</span></td></tr>):<tr><td colSpan="4"><div className="empty">No SSL expiry data available.</div></td></tr>}</tbody></table></div>
  </Card>
 </div>
}
function LegendFallback({data}){return <div style={{position:'absolute',right:'12%',top:'40%',fontSize:10,color:'#6f7b8d'}}>{data.map(x=><div key={x.name} style={{marginBottom:5}}><span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:COLORS[x.name],marginRight:6}}/>{x.name}: {x.value}</div>)}</div>}
