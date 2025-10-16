export function Logo(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="256"
      height="256"
      aria-labelledby="titleA descA"
      role="img"
      viewBox="0 0 128 128"
      className={props.className}
    >
      <title>CoinMate</title>
      <defs>
        <linearGradient id="gradA" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <filter id="softA" width="140%" height="140%" x="-20%" y="-20%">
          <feDropShadow
            dx="0"
            dy="4"
            floodColor="#000"
            floodOpacity="0.12"
            stdDeviation="6"
          />
        </filter>
      </defs>
      <g filter="url(#softA)">
        <circle
          cx="64"
          cy="64"
          r="44"
          fill="url(#gradA)"
          stroke="#047857"
          strokeWidth="2"
        />
        <circle
          cx="64"
          cy="64"
          r="34"
          fill="none"
          stroke="#6ee7b7"
          strokeWidth="4"
          opacity="0.6"
        />
      </g>
      <path
        fill="none"
        stroke="#064e3b"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="6"
        d="m40 72 12-24 12 24 12-24 12 24"
      />
    </svg>
  );
}
