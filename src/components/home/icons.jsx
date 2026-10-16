const PATHS = {
  pin: <><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M8 3v4M16 3v4" /></>,
  wallet: <><rect x="3.5" y="6" width="17" height="13" rx="3" /><path d="M3.5 10h17M16 14.5h.01" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" /><path d="M16 5.2a3 3 0 0 1 0 5.6M18.5 14.8c1.4.6 2.3 1.9 2.7 4.2" /></>,
  chevDown: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  warn: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17.2v.01" /></>,
  sliders: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.2-4.2" /></>,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z" />,
  image: <><rect x="4" y="5" width="16" height="14" rx="3" /><circle cx="9" cy="10" r="1.5" /><path d="M4 17l5-5 4 4 2-2 5 5" /></>,
}

// Icon trang trí của DS handoff (class tp-icon): luôn aria-hidden.
export function HIcon({ name, size, className = '' }) {
  const cls = ['tp-icon', size ? `tp-icon--${size}` : '', className].filter(Boolean).join(' ')
  return <svg className={cls} viewBox="0 0 24 24" aria-hidden="true">{PATHS[name]}</svg>
}
