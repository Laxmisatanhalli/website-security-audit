import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

export default function RegisterPage(){
 const {register}=useAuth(); const navigate=useNavigate(); const [form,setForm]=useState({username:'',email:'',password:''}); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
 const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
 async function submit(e){e.preventDefault();setError('');setLoading(true);try{await register(form);navigate('/dashboard')}catch(err){setError(err.response?.data?.message||'Registration failed.')}finally{setLoading(false)}}
 return <div className="login-shell"><section className="login-brand"><div className="brand-mark"><Icon name="shield" size={22}/></div><h1>Build a clearer security picture.</h1><p>Create a workspace to register websites, run scans, review findings and generate reports.</p><div className="feature-list">{['Start with a website and scan it on demand','Track findings and security scores over time','Download technical and executive reports'].map(x=><div className="feature" key={x}><span><Icon name="check" size={13}/></span>{x}</div>)}</div></section>
 <section className="login-panel"><form className="login-card" onSubmit={submit}><div className="brand-mark"><Icon name="shield" size={18}/></div><h2>Create account</h2><p className="sub">New accounts start with Viewer access.</p>{error&&<div className="alert alert-error">{error}</div>}
 {['username','email','password'].map(k=><div className="form-field" key={k}><label className="form-label">{k[0].toUpperCase()+k.slice(1)}</label><input className="input" type={k==='password'?'password':k==='email'?'email':'text'} value={form[k]} onChange={set(k)} minLength={k==='username'?3:k==='password'?8:undefined} required/></div>)}
 <button className="btn btn-primary" disabled={loading}>{loading?'Creating account…':'Create account'}</button><div className="login-foot">Already have an account? <Link to="/login">Sign in</Link></div></form></section></div>;
}
