import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { scansApi, reportsApi } from '../api/resources';
import SeverityBadge from '../components/SeverityBadge';
import Icon from '../components/Icon';
import { useState } from 'react';

const ORDER={Critical:0,High:1,Medium:2,Low:3,Info:4};
export default function ScanDetailPage(){
 const {id}=useParams(); const {data:scan,isLoading,isError}=useQuery({queryKey:['scans',id],queryFn:()=>scansApi.get(id),refetchInterval:(query)=>query.state.data?.status==='running'?3000:false}); const [format,setFormat]=useState('pdf');
 if(isLoading)return <div className="empty">Loading scan results…</div>; if(isError||!scan)return <div className="empty">Scan not found.</div>;
 const findings=[...(scan.ScanResults||[])].sort((a,b)=>(ORDER[a.severity]??9)-(ORDER[b.severity]??9));
 const counts=findings.reduce((a,f)=>(a[f.severity]=(a[f.severity]||0)+1,a),{});
 return <div>
  <Link to={`/websites/${scan.WebsiteId}`} className="btn btn-secondary" style={{marginBottom:15}}><span>←</span> Back to website</Link>
  <div className="scan-hero"><div><div className="label">Security audit #{scan.id}</div><h2>{scan.Website?.name||`Website #${scan.WebsiteId}`}</h2><p>{scan.Website?.url||''} · {new Date(scan.createdAt).toLocaleString()}</p></div><div className="scan-score"><strong>{scan.securityScore??'—'}</strong><span>{scan.scoreCategory||scan.status}</span></div></div>
  <div className="stat-grid">
   {['Critical','High','Medium','Low'].map((s,i)=><div className="card stat-card" key={s}><span className={`stat-accent ${i<2?'red':i===2?'amber':'blue'}`}/><div className="stat-label">{s} findings</div><div className="stat-value">{counts[s]||0}</div></div>)}
  </div>
  <div className="card" style={{marginBottom:15}}><div className="card-head"><div><h3 className="card-title">Report</h3><div className="card-sub">Download this scan in your preferred format.</div></div><div style={{display:'flex',gap:8}}><select className="input" style={{width:120}} value={format} onChange={e=>setFormat(e.target.value)}><option value="pdf">PDF</option><option value="excel">Excel</option><option value="csv">CSV</option></select><button className="btn btn-secondary" onClick={()=>reportsApi.download(scan.id,'technical',format)}><Icon name="download" size={14}/>Download</button></div></div></div>
  <div className="card"><div className="card-head"><div><h3 className="card-title">Findings</h3><div className="card-sub">{findings.length} result{findings.length!==1?'s':''} from this audit</div></div></div>
   {!findings.length?<div className="empty"><div className="empty-icon"><Icon name="check"/></div>No security findings were recorded for this scan.</div>:findings.map(f=><div className="finding" key={f.id}><div className="finding-top"><SeverityBadge severity={f.severity}/><div className="finding-body"><div className="finding-module">{f.module}</div><div className="finding-title">{f.issue}</div>{f.recommendation&&<div className="finding-rec"><strong>Recommendation:</strong> {f.recommendation}</div>}</div></div></div>)}
  </div>
 </div>
}


