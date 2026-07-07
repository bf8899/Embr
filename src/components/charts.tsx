// Static, dependency-free SVG charts for the advertiser dashboard. Single-series
// by design (magnitude / change-over-time), so no legend or categorical palette
// is needed — the card title names the series, values are direct-labeled, and
// the lone accent hue is the brand ember. Built to be screenshot/screen-share
// friendly (no hover needed). Text uses ink tokens; only the mark carries color.

type Point = { label: string; value: number };

function niceCeil(n: number): number {
  if (n <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const frac = n / pow;
  const step = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return step * pow;
}

/** Cumulative growth — area + line, one series, end value labeled. */
export function AreaChart({ points }: { points: Point[] }) {
  const W = 720;
  const H = 220;
  const padL = 8;
  const padR = 8;
  const padT = 18;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = niceCeil(Math.max(1, ...points.map((p) => p.value)));
  const n = points.length;

  const x = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / max) * innerH;

  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const area = `${padL},${padT + innerH} ${line} ${padL + innerW},${padT + innerH}`;
  const last = points[n - 1];

  // Sparse x labels: first, middle, last.
  const labelIdx = new Set([0, Math.floor((n - 1) / 2), n - 1]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Cumulative users over time"
    >
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ember-2)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--ember-2)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* recessive gridlines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padL}
          x2={padL + innerW}
          y1={padT + innerH - f * innerH}
          y2={padT + innerH - f * innerH}
          stroke="var(--line)"
          strokeWidth="1"
        />
      ))}

      <polygon points={area} fill="url(#areaFill)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--ember-2)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* end marker + value */}
      <circle cx={x(n - 1)} cy={y(last.value)} r="4" fill="var(--ember-2)" />
      <text
        x={x(n - 1)}
        y={y(last.value) - 10}
        textAnchor="end"
        className="fill-ink"
        fontSize="13"
        fontWeight="600"
      >
        {last.value.toLocaleString()}
      </text>

      {points.map((p, i) =>
        labelIdx.has(i) ? (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            className="fill-ink-faint"
            fontSize="11"
          >
            {p.label}
          </text>
        ) : null
      )}
    </svg>
  );
}

/** Weekly magnitude — bars, one series, non-zero values labeled. */
export function BarChart({ points }: { points: Point[] }) {
  const W = 720;
  const H = 220;
  const padL = 8;
  const padR = 8;
  const padT = 20;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = niceCeil(Math.max(1, ...points.map((p) => p.value)));
  const n = points.length;
  const slot = innerW / n;
  const gap = 6; // ≥2px surface gap between adjacent bars
  const bw = Math.max(4, slot - gap);
  const labelIdx = new Set([0, Math.floor((n - 1) / 2), n - 1]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Weekly interactions"
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padL}
          x2={padL + innerW}
          y1={padT + innerH - f * innerH}
          y2={padT + innerH - f * innerH}
          stroke="var(--line)"
          strokeWidth="1"
        />
      ))}

      {points.map((p, i) => {
        const h = (p.value / max) * innerH;
        const bx = padL + i * slot + (slot - bw) / 2;
        const by = padT + innerH - h;
        return (
          <g key={i}>
            {p.value > 0 && (
              <rect
                x={bx}
                y={by}
                width={bw}
                height={h}
                rx="4"
                fill="var(--ember-2)"
              />
            )}
            {p.value > 0 && (
              <text
                x={bx + bw / 2}
                y={by - 6}
                textAnchor="middle"
                className="fill-ink"
                fontSize="11"
                fontWeight="600"
              >
                {p.value}
              </text>
            )}
            {labelIdx.has(i) && (
              <text
                x={bx + bw / 2}
                y={H - 8}
                textAnchor="middle"
                className="fill-ink-faint"
                fontSize="11"
              >
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Two-part composition — horizontal bar, identity carried by direct labels. */
export function SplitBar({
  segments,
}: {
  segments: { label: string; value: number }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const tones = ["bg-[image:var(--ember-grad)]", "bg-pane-2"];
  const inkTones = ["text-[#1A0A08]", "text-ink-dim"];

  return (
    <div>
      <div className="flex h-9 w-full overflow-hidden rounded-full border border-line">
        {segments.map((s, i) => {
          const pct = (s.value / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={s.label}
              className={`flex items-center justify-center ${tones[i % tones.length]} ${
                i > 0 ? "border-l-2 border-void" : ""
              }`}
              style={{ width: `${pct}%` }}
            >
              {pct > 12 && (
                <span className={`text-xs font-semibold ${inkTones[i % inkTones.length]}`}>
                  {Math.round(pct)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {segments.map((s, i) => (
          <span key={s.label} className="flex items-center gap-2 text-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                i === 0 ? "bg-[image:var(--ember-grad)]" : "bg-pane-2 border border-line"
              }`}
            />
            <span className="text-ink">{s.value.toLocaleString()}</span>
            <span className="text-ink-faint">{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
