import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WebsitesPage from './pages/WebsitesPage';
import WebsiteDetailPage from './pages/WebsiteDetailPage';
import ScanDetailPage from './pages/ScanDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/websites" element={<WebsitesPage />} />
      <Route path="/websites/:id" element={<WebsiteDetailPage />} />
      <Route path="/scans/:id" element={<ScanDetailPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/users" element={<ProtectedRoute roles={['Administrator']}><UsersPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute roles={['Administrator']}><SettingsPage /></ProtectedRoute>} />
    </Route>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
