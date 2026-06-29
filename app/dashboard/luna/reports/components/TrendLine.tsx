'use client';

import { TrendSeries } from '../mockReportsData';

/**
 * Lightweight multi-series SVG line chart. Pure presentational — no deps.
 * Used for sentiment-over-time and issue-categories-over-time. Also handles
 * a single series (sparkline) when `series.length === 1`.
 */
export default function TrendLine({
  labels,
  series,
  height = 120,
  showLegend = true,
  showAxis = true,
  yMax,
}: {
  labels: string[];
  series: TrendSeries[];
  height?: number;
  showLegend?: boolean;
  showAxis?: boolean;
  yMax?: number;
}) {
  const W = 320;
  const H = height;
  const padX = 8;
  const padY = 10;
  const max = yMax ?? Math.max(1, ...series.flatMap((s) => s.values));
  const n = labels.length;

  const x = (i: number) => (n <= 1 ? padX : padX + (i * (W - padX * 2)) / (n - 1));
  const y = (v: number) => padY + (1 - v / max) * (H - padY * 2);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="trend chart">
        {/* baseline grid */}
        {showAxis &&
          [0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={padX} x2={W - padX} y1={padY + f * (H - padY * 2)} y2={padY + f * (H - padY * 2)} stroke="var(--border)" strokeWidth="1" />
          ))}
        {series.map((s) => {
          const d = s.values
            .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
            .join(' ');
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill={s.color} />
              ))}
            </g>
          );
        })}
      </svg>

      {showAxis && (
        <div className="flex justify-between mt-1">
          {labels.map((l, i) => (
            <span key={i} className="text-[0.55rem] text-text-tertiary">{l}</span>
          ))}
        </div>
      )}

      {showLegend && series.length > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-[5px]">
              <span className="w-[8px] h-[8px] rounded-full" style={{ background: s.color }} />
              <span className="text-[0.62rem] text-text-secondary">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
