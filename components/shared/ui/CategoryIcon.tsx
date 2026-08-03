const paths: Record<string, React.ReactNode> = {
  plumbing: (
    <>
      <path d="M13.4 6.6a4 4 0 0 1 0 5.7L7.1 18.5a1.9 1.9 0 0 1-2.6-2.6l6.2-6.3a4 4 0 0 1 2.7-3z" />
      <path d="M12.5 7.5l3.3-3.3a1.9 1.9 0 0 1 2.6 2.6l-3.3 3.3" />
    </>
  ),
  electrical: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
  carpentry: (
    <>
      <path d="M3 14h12" />
      <path d="M15 14h2l2-2" />
      <path d="M3 14l2-2 2 2 2-2 2 2 2-2 2 2" />
    </>
  ),
  hvac: (
    <>
      <path d="M12 3v18" />
      <path d="m12 12-7-4.2M12 12l7-4.2M12 12l-7 4.2M12 12l7 4.2" />
      <path d="M12 3l-1.5 2M12 3l1.5 2" />
      <path d="M5 7.8l2.5-.5M5 7.8l.7 2.5" />
      <path d="M19 7.8l-2.5-.5M19 7.8l-.7 2.5" />
      <path d="M5 16.2l2.5.5M5 16.2l.7-2.5" />
      <path d="M19 16.2l-2.5.5M19 16.2l-.7-2.5" />
    </>
  ),
  painting: (
    <>
      <rect x="3" y="5" width="13" height="4" rx="1" />
      <path d="M6 9v8a2 2 0 0 0 2 2h1" />
    </>
  ),
  tiling: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M12 3v18M3 12h18" />
    </>
  ),
  aluminum: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M13 4v16M3 12h10" />
    </>
  ),
  metalwork: (
    <>
      <path d="M3 19h18" />
      <path d="M5 19v-7a7 7 0 0 1 7-7h4" />
      <path d="M16 5v14" />
      <path d="M16 12l4 1 1 6h-4" />
    </>
  ),
  masonry: (
    <>
      <rect x="3" y="4" width="8" height="4" rx="0.5" />
      <rect x="13" y="4" width="8" height="4" rx="0.5" />
      <rect x="3" y="10" width="8" height="4" rx="0.5" />
      <rect x="13" y="10" width="8" height="4" rx="0.5" />
      <rect x="3" y="16" width="8" height="4" rx="0.5" />
      <rect x="13" y="16" width="8" height="4" rx="0.5" />
    </>
  ),
  marble: (
    <>
      <path d="M6 3h12l3 5-9 13L3 8z" />
      <path d="M3 8h18" />
    </>
  ),
  glass: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M12 3v18M3 12h18" />
      <path d="M7 7l2 2" />
    </>
  ),
  welding: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3 1.07-1.2 2.4-1.5 3-2 1.4 1.6 3 4.3 3 7a5 5 0 1 1-10 0c0-.9.15-1.7.5-2.5" />
  ),
  locksmith: (
    <>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="16" r="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0" />
    </>
  ),
  mechanic: (
    <>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  appliances: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="8" cy="7" r="1.5" />
      <path d="M17 15a5 5 0 0 1-10 0" />
    </>
  ),
  upholstery: (
    <>
      <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      <path d="M4 10a2 2 0 0 0-1 3.7V19h18v-5.3A2 2 0 0 0 20 10a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2z" />
    </>
  ),
  cleaning: (
    <>
      <path d="M6 7h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
      <path d="M10 7V5a2 2 0 0 1 4 0v2" />
    </>
  ),
  pest: (
    <>
      <path d="m8 2 1.88 1.88M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3 3 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4" />
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </>
  ),
  moving: (
    <>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </>
  ),
  elevator: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <rect x="7" y="6" width="10" height="12" rx="0.5" />
      <path d="M12 6v12" />
    </>
  ),
  satellite: (
    <>
      <path d="M4 20a12 12 0 0 1 16 0" />
      <path d="M12 20v-7" />
      <path d="M12 13h.01" />
    </>
  ),
  security: (
    <>
      <path d="M5 8a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h6l7 3V5l-7 3z" />
      <circle cx="8" cy="11" r="2" />
    </>
  ),
  roofing: (
    <>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  garden: (
    <>
      <path d="M12 22v-9" />
      <path d="M12 13a4.5 4.5 0 0 0-4.5-4.5c0 2.8 2 4.5 4.5 4.5z" />
      <path d="M12 11a3.5 3.5 0 0 1 3.5-3.5c0 2.2-1.6 3.5-3.5 3.5z" />
    </>
  ),
  parquet: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="1" />
      <path d="M3 12h18" />
      <path d="M9 12v6M15 6v6" />
    </>
  ),
  kitchen: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M4 14h16" />
      <circle cx="8" cy="9" r="1" />
      <circle cx="16" cy="9" r="1" />
      <path d="M8 18h8" />
    </>
  ),
  bathroom: (
    <>
      <path d="M10 4 8 6" />
      <path d="M17 19v2" />
      <path d="M2 12h20" />
      <path d="M7 19v2" />
      <path d="M9 5 7.62 3.62A2.12 2.12 0 0 0 4 5v10" />
      <path d="M7 19h10a4 4 0 0 0 4-4v-1H3v1a4 4 0 0 0 4 4Z" />
    </>
  ),
  handyman: (
    <>
      <path d="M10 12V9h4v3" />
      <rect x="3" y="12" width="18" height="8" rx="1" />
      <path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
    </>
  ),
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name] ?? <circle cx="12" cy="12" r="9" />}
    </svg>
  );
}
