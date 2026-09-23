import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/resources';
import SeverityBadge from '../components/SeverityBadge';
import Icon from '../components/Icon';
export default function NotificationsPage(){
 const qc=useQueryClient();const {data,isLoading}=useQuery({queryKey:['notifications'],queryFn:()=>notificationsApi.list()});
 const read=useMutation({mutationFn:notificationsApi.markRead,onSuccess:()=>qc.invalidateQueries({queryKey:['notifications']})});
 const all=useMutation({mutationFn:notificationsApi.markAllRead,onSuccess:()=>qc.invalidateQueries({queryKey:['notifications']})});
 return <div><div className="page-head"><div><h2 className="page-title">Notifications</h2><p className="page-desc">Security alerts and scan events from your workspace.</p></div>{data?.unreadCount>0&&<button className="btn btn-secondary" onClick={()=>all.mutate()}>Mark all read</button>}</div>
 <div className="card">{isLoading?<div className="empty">Loading notifications…</div>:!data?.notifications?.length?<div className="empty"><div className="empty-icon"><Icon name="bell"/></div>No notifications yet.</div>:data.notifications.map(n=><div key={n.id} className="finding" style={{background:n.isRead?'#fff':'#fbfcfe'}}><div className="finding-top"><SeverityBadge severity={n.severity}/><div className="finding-body"><div className="finding-title">{n.title}</div><div className="finding-rec" style={{marginTop:5}}>{n.message}</div><div className="muted" style={{fontSize:10,marginTop:6}}>{new Date(n.createdAt).toLocaleString()}</div></div>{!n.isRead&&<button className="btn btn-secondary" style={{minHeight:30,padding:'0 9px',fontSize:10}} onClick={()=>read.mutate(n.id)}>Mark read</button>}</div></div>)}</div></div>
}
