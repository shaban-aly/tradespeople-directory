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
