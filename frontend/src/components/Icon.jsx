import React from 'react';

const paths = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></>,
  settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .7 1.8 1.8 0 0 0 0 .2 1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.7l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.7-3H4a1.8 1.8 0 0 1 0-3h.2a1.8 1.8 0 0 0 .7-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.7V3a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3 .7l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .7 3h.2a1.8 1.8 0 0 1 0 3h-.2a1.8 1.8 0 0 0-.7 2.6Z"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></>,
  scan: <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
  logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3M21 19V5a2 2 0 0 0-2-2h-5"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.9-4L3 10"/><path d="M3 4v6h6M4 13a8 8 0 0 0 14.9 4L21 14"/><path d="M21 20v-6h-6"/></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  x: <><path d="M6 6l12 12M18 6 6 18"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
};

export default function Icon({ name, size = 18, strokeWidth = 1.8, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      {paths[name] || paths.shield}
    </svg>
  );
}
