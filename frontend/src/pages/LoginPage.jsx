import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier,setIdentifier]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  async function submit(e){
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(identifier.includes('@') ? {email:identifier,password} : {username:identifier,password}); navigate('/dashboard'); }
    catch(err){setError(err.response?.data?.message || 'Unable to sign in. Check your credentials.');}
    finally{setLoading(false);}
  }
  return <div className="login-shell">
    <section className="login-brand">
      <div className="brand-mark"><Icon name="shield" size={22}/></div>
      <h1>Know what is exposed before attackers do.</h1>
      <p>SecureAudit scans websites for security weaknesses, organizes findings by severity, and turns technical results into clear remediation actions.</p>
      <div className="feature-list">
        {['Security headers and configuration checks','SSL, DNS, CMS and information-disclosure checks','Reports with findings and remediation guidance'].map(x=><div className="feature" key={x}><span><Icon name="check" size={13}/></span>{x}</div>)}
      </div>
    </section>
    <section className="login-panel">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark"><Icon name="shield" size={18}/></div>
        <h2>Welcome back</h2>
        <p className="sub">Sign in to your security workspace.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-field"><label className="form-label">Username or email</label><input className="input" value={identifier} onChange={e=>setIdentifier(e.target.value)} required autoComplete="username"/></div>
        <div className="form-field"><label className="form-label">Password</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></div>
        <button className="btn btn-primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        <div className="login-foot">No account? <Link to="/register">Create one</Link></div>
      </form>
    </section>
  </div>;
}
