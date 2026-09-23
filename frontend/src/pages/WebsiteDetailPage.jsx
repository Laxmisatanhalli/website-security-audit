import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { websitesApi, scansApi, reportsApi } from '../api/resources';
import { useState } from 'react';
import Icon from '../components/Icon';

export default function WebsiteDetailPage(){
 const {id}=useParams(); const [compare,setCompare]=useState([]); const [type,setType]=useState('technical'); const [format,setFormat]=useState('pdf');
 const {data:website,isLoading:wl}=useQuery({queryKey:['websites',id],queryFn:()=>websitesApi.get(id)});
 const {data:scans=[]}=useQuery({queryKey:['scans'],queryFn:scansApi.list});
 if(wl)return <div className="empty">Loading website…</div>;
 const rows=scans.filter(s=>Number(s.WebsiteId)===Number(id)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
 const latest=rows[0];
 const toggle=x=>setCompare(p=>p.includes(x)?p.filter(v=>v!==x):p.length===2?[p[1],x]:[...p,x]);
 return <div>
  <Link to="/websites" className="btn btn-secondary" style={{marginBottom:15}}>← Websites</Link>
  <div className="page-head"><div><h2 className="page-title">{website?.name}</h2><p className="page-desc">{website?.url}</p></div><div style={{display:'flex',gap:8}}>{latest&&<Link className="btn btn-primary" to={`/scans/${latest.id}`}><Icon name="scan" size={14}/>Latest results</Link>}</div></div>
  <div className="stat-grid"><Stat label="Security score" value={website?.securityScore??'—'} accent={Number(website?.securityScore)<50?'red':Number(website?.securityScore)<75?'amber':'green'}/><Stat label="Environment" value={website?.environment||'—'} accent="blue"/><Stat label="Scan frequency" value={website?.scanFrequency||'Manual'} accent="green"/><Stat label="Status" value={website?.status||'—'} accent={website?.status==='Enabled'?'green':'red'}/></div>
  {latest&&<div className="card" style={{marginBottom:15}}><div className="card-head"><div><h3 className="card-title">Reports</h3><div className="card-sub">Generate a report from the latest scan.</div></div><div style={{display:'flex',gap:8}}><select className="input" style={{width:145}} value={type} onChange={e=>setType(e.target.value)}><option value="technical">Technical</option><option value="executive">Executive</option><option value="vulnerability">Vulnerability</option><option value="remediation">Remediation</option><option value="compliance">Compliance</option></select><select className="input" style={{width:100}} value={format} onChange={e=>setFormat(e.target.value)}><option value="pdf">PDF</option><option value="excel">Excel</option><option value="csv">CSV</option></select><button className="btn btn-secondary" onClick={()=>reportsApi.download(latest.id,type,format)}><Icon name="download" size={14}/>Download</button></div></div></div>}
  {compare.length===2&&<Compare previous={compare[0]} current={compare[1]}/>}
  <div className="card"><div className="card-head"><div><h3 className="card-title">Scan history</h3><div className="card-sub">Select two scans to compare findings.</div></div>{compare.length>0&&<button className="btn btn-secondary" onClick={()=>setCompare([])}>Clear selection</button>}</div><div className="table-wrap"><table><thead><tr><th>Compare</th><th>Date</th><th>Status</th><th>Score</th><th></th></tr></thead><tbody>{rows.length?rows.map(s=><tr key={s.id}><td><input type="checkbox" checked={compare.includes(s.id)} onChange={()=>toggle(s.id)}/></td><td>{new Date(s.createdAt).toLocaleString()}</td><td>{s.status}</td><td><strong>{s.securityScore??'—'}</strong></td><td><Link className="btn btn-secondary" style={{minHeight:30,padding:'0 9px',fontSize:10}} to={`/scans/${s.id}`}>View findings</Link></td></tr>):<tr><td colSpan="5"><div className="empty">No scans have been run for this website.</div></td></tr>}</tbody></table></div></div>
 </div>
}
function Stat({label,value,accent}){return <div className="card stat-card"><span className={`stat-accent ${accent||''}`}/><div className="stat-label">{label}</div><div className="stat-value" style={{fontSize:20}}>{value}</div></div>}
function Compare({previous,current}){const {data,isLoading}=useQuery({queryKey:['compare',previous,current],queryFn:()=>scansApi.compare(previous,current)});if(isLoading)return <div className="alert alert-info">Comparing scans…</div>;if(!data)return null;return <div className="grid-2-equal"><CompareBox title="Resolved" items={data.resolved} cls="green"/><CompareBox title="New findings" items={data.newIssues} cls="red"/></div>}
function CompareBox({title,items,cls}){return <div className="card" style={{padding:17}}><div className="card-title">{title} <span style={{color:cls==='red'?'#c94b52':'#2b8c74'}}>({items?.length||0})</span></div><div style={{marginTop:10}}>{(items||[]).slice(0,8).map((x,i)=><div key={i} className="finding" style={{padding:'9px 0'}}><span className="muted">{x.module}: </span>{x.issue}</div>)}</div></div>}
