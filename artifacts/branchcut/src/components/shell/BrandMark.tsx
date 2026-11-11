export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#6366f1" />
      <path d="M8 5v14M8 9c0 3 8 2 8 6v4" stroke="#e7e9ee" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="19" r="1.6" fill="#e7e9ee" />
      <path d="M5 12h3" stroke="#0b0d12" strokeWidth="1.4" />
    </svg>
  );
}
