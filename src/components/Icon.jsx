// Line icons (24×24, stroke = currentColor). Use instead of emojis.
const P = {
  // categories
  carpet: 'M4 4h16v16H4zM8 8h8v8H8zM12 8v8M8 12h8M4 2v2M8 2v2M12 2v2M16 2v2M20 2v2M4 20v2M8 20v2M12 20v2M16 20v2M20 20v2',
  shawl: 'M4 3h16l-2 7-6 2-6-2zM6 10l-1 11M18 10l1 11M9 12l-.5 9M15 12l.5 9',
  gem: 'M6 3h12l4 6-10 12L2 9zM2 9h20M12 21 8 9l4-6 4 6z',
  box: 'M21 8 12 3 3 8v8l9 5 9-5zM12 12 3 8m9 4 9-4m-9 4v9',
  // actions & misc
  printer: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  x: 'M18 6 6 18M6 6l12 12',
  check: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3',
  pin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
}

export default function Icon({ name, size = 16, className, style }) {
  return (
    <svg className={'icon ' + (className || '')} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, verticalAlign: '-0.15em', ...style }}>
      <path d={P[name] || P.box} />
    </svg>
  )
}
