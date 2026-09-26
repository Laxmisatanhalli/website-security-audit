import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { scansApi } from '../api/resources';

const ScanProgressContext = createContext(null);
const POLL_MS = 3000;
const ESTIMATED_DURATION_MS = 45000; // just for the progress bar animation

export function ScanProgressProvider({ children }) {
  const [activeScans, setActiveScans] = useState([]); // { id, websiteId, websiteName, startedAt }
  const timers = useRef({});
  const qc = useQueryClient();

  const refreshLists = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['websites'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['scans'] });
  }, [qc]);

  const stopTracking = useCallback((scanId) => {
    clearInterval(timers.current[scanId]);
    delete timers.current[scanId];
    setActiveScans((prev) => prev.filter((s) => s.id !== scanId));
  }, []);

  const poll = useCallback((scanId) => {
    timers.current[scanId] = setInterval(async () => {
      try {
        const scan = await scansApi.get(scanId);
        if (scan.status !== 'running') {
          stopTracking(scanId);
          refreshLists();
          qc.invalidateQueries({ queryKey: ['scans', String(scanId)] });
        }
      } catch {
        stopTracking(scanId); // e.g. scan was deleted, stop trying
      }
    }, POLL_MS);
  }, [refreshLists, stopTracking, qc]);

  const startScan = useCallback(async (websiteId, websiteName) => {
    const { scan } = await scansApi.start(websiteId);
    setActiveScans((prev) => [...prev, { id: scan.id, websiteId, websiteName, startedAt: Date.now() }]);
    poll(scan.id);
    refreshLists();
    return scan;
  }, [poll, refreshLists]);

  useEffect(() => () => Object.values(timers.current).forEach(clearInterval), []);

  return (
    <ScanProgressContext.Provider value={{ activeScans, startScan, estimatedDurationMs: ESTIMATED_DURATION_MS }}>
      {children}
    </ScanProgressContext.Provider>
  );
}

export function useScanProgress() {
  const ctx = useContext(ScanProgressContext);
  if (!ctx) throw new Error('useScanProgress must be used within ScanProgressProvider');
  return ctx;
}