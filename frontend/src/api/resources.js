import api from './client';

export const websitesApi = {
  list: () => api.get('/websites').then((r) => r.data.websites),
  get: (id) => api.get(`/websites/${id}`).then((r) => r.data.website),
  create: (data) => api.post('/websites', data).then((r) => r.data.website),
  update: (id, data) => api.put(`/websites/${id}`, data).then((r) => r.data.website),
  remove: (id) => api.delete(`/websites/${id}`),
  setStatus: (id, status) => api.patch(`/websites/${id}/status`, { status }).then((r) => r.data.website),
};

export const scansApi = {
  start: (websiteId) => api.post('/scans', { websiteId }).then((r) => r.data),
  list: () => api.get('/scans').then((r) => r.data.scans),
  get: (id) => api.get(`/scans/${id}`).then((r) => r.data.scan),
  compare: (previousId, currentId) =>
    api.get('/scans/compare', { params: { previousId, currentId } }).then((r) => r.data),
};

export const dashboardApi = {
  overview: () => api.get('/dashboard/overview').then((r) => r.data),
  upcomingScans: () => api.get('/dashboard/upcoming-scans').then((r) => r.data.upcoming),
  riskDistribution: () => api.get('/dashboard/charts/risk-distribution').then((r) => r.data.distribution),
  vulnerabilityCategories: () =>
    api.get('/dashboard/charts/vulnerability-categories').then((r) => r.data.categories),
  scoreTrend: (websiteId) =>
    api.get('/dashboard/charts/score-trend', { params: { websiteId } }).then((r) => r.data.trend),
  sslExpiryTimeline: () => api.get('/dashboard/charts/ssl-expiry-timeline').then((r) => r.data.timeline),
  monthlyScanSummary: () => api.get('/dashboard/charts/monthly-scan-summary').then((r) => r.data.summary),
};

// Reports return file blobs, not JSON — triggers a browser download.
export const reportsApi = {
  download: async (scanId, type, format) => {
    const response = await api.get(`/reports/${scanId}`, {
      params: { type, format },
      responseType: 'blob',
    });
    downloadBlob(response, `${type}-report-${scanId}`, format);
  },
  downloadTrend: async (websiteId, format) => {
    const response = await api.get(`/reports/trend/${websiteId}`, {
      params: { format },
      responseType: 'blob',
    });
    downloadBlob(response, `trend-report-${websiteId}`, format);
  },
};

function downloadBlob(response, filenameBase, format) {
  const ext = { pdf: 'pdf', excel: 'xlsx', csv: 'csv' }[format] || format;
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenameBase}.${ext}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const notificationsApi = {
  list: (unreadOnly = false) =>
    api.get('/notifications', { params: { unreadOnly } }).then((r) => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const usersApi = {
  list: () => api.get('/users').then((r) => r.data.users),
  create: (data) => api.post('/users', data).then((r) => r.data.user),
  update: (id, data) => api.put(`/users/${id}`, data).then((r) => r.data.user),
  remove: (id) => api.delete(`/users/${id}`),
  resetPassword: (id) => api.patch(`/users/${id}/reset-password`).then((r) => r.data),
};

export const settingsApi = {
  get: () => api.get('/settings').then((r) => r.data.settings ?? r.data),
  update: (data) => api.put('/settings', data).then((r) => r.data.settings ?? r.data),
};
