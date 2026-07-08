// The living Ember flame — gradient fill with a flickering, glowing animation
// (CSS-driven, so this stays a server component). `ignite` adds a one-time
// bloom-in on first paint, used for the hero on the browse page.
export function FlameMark({
  className = "",
  ignite = false,
}: {
  className?: string;
  ignite?: boolean;
}) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 24 24"
        className={`h-full w-full flame-flicker${ignite ? " flame-ignite" : ""}`}
        role="img"
        aria-label="Ember flame"
      >
        <defs>
          <linearGradient id="flameMarkGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFB03A" />
            <stop offset=".55" stopColor="#FF5C39" />
            <stop offset="1" stopColor="#FF2E88" />
          </linearGradient>
        </defs>
        <path
          fill="url(#flameMarkGrad)"
          d="M12 2c.6 3.6-1.4 5.4-3 7.3C7.3 11.2 6 13 6 15.4A6.3 6.3 0 0 0 12.3 22 6 6 0 0 0 18 15.8c0-2.3-1.1-3.9-2.2-5.3-.4 1.3-1.1 2.1-2.1 2.6.5-3.7-.5-8-1.7-11.1z"
        />
        <path
          fill="#FFE1A8"
          opacity=".85"
          d="M12.2 12.5c.4 1.8-.5 2.7-1.3 3.7-.7.8-1.2 1.6-1.2 2.6a2.9 2.9 0 0 0 2.9 3 2.8 2.8 0 0 0 2.7-2.9c0-1.1-.5-1.8-1-2.5-.2.6-.5 1-1 1.2.3-1.7-.3-3.6-1.1-5.1z"
        />
      </svg>
    </div>
  );
}
