import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsApi } from '../api/resources';
import { useQuery } from '@tanstack/react-query';
import Icon from './Icon';

const primary = [
  { to: '/dashboard', label: 'Overview', icon: 'grid' },
  { to: '/websites', label: 'Websites', icon: 'globe' },
  { to: '/notifications', label: 'Notifications', icon: 'bell' },
];
const admin = [
  { to: '/users', label: 'Users', icon: 'users' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

function NavItem({ item, badge }) {
  return (
    <NavLink to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
      <Icon name={item.icon} size={17} />
      <span>{item.label}</span>
      {badge > 0 && <span className="nav-badge">{badge > 9 ? '9+' : badge}</span>}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list(), staleTime: 30000 });
  const unread = data?.unreadCount || 0;

  const pageName =
    location.pathname.startsWith('/websites/') ? 'Website details' :
    location.pathname.startsWith('/scans/') ? 'Scan results' :
    location.pathname === '/users' ? 'User management' :
    location.pathname === '/settings' ? 'Settings' :
    location.pathname === '/notifications' ? 'Notifications' :
    location.pathname === '/websites' ? 'Websites' : 'Security overview';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="shield" size={20} /></div>
          <div><div className="brand-name">SecureAudit</div><div className="brand-sub">Website security</div></div>
        </div>

        <div className="side-section">
          <div className="side-label">Workspace</div>
          {primary.map((item) => <NavItem key={item.to} item={item} badge={item.to === '/notifications' ? unread : 0} />)}
        </div>

        {user?.role === 'Administrator' && (
          <div className="side-section">
            <div className="side-label">Administration</div>
            {admin.map((item) => <NavItem key={item.to} item={item} />)}
          </div>
        )}

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">{(user?.username || 'U').slice(0, 1).toUpperCase()}</div>
            <div className="profile-copy"><strong>{user?.username || 'User'}</strong><span>{user?.role || 'Viewer'}</span></div>
            <button className="icon-button subtle" onClick={logout} title="Log out"><Icon name="logout" size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><div className="eyebrow">Security workspace</div><h1>{pageName}</h1></div>
          <div className="top-actions">
            <NavLink to="/notifications" className="top-icon"><Icon name="bell" size={18} />{unread > 0 && <i />}</NavLink>
            <div className="top-user">{user?.username || 'User'}</div>
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
