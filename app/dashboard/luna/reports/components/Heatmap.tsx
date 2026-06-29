'use client';

import { HeatmapBlock } from '../mockReportsData';

/**
 * Day × hour-bucket heatmap of DM volume. Intensity is the cell value scaled to
 * the grid max; near-black at peak, faint border at zero. Each cell has a title
 * for hover and an accessible label.
 */
export default function Heatmap({ data }: { data: HeatmapBlock }) {
  const max = Math.max(1, ...data.grid.flat());

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `34px repeat(${data.buckets.length}, minmax(28px, 1fr))` }}>
        {/* header row */}
        <div />
        {data.buckets.map((b) => (
          <div key={b} className="text-[0.5rem] text-text-tertiary text-center pb-1">{b}</div>
        ))}

        {/* body */}
        {data.days.map((day, di) => (
          <div key={day} className="contents">
            <div className="text-[0.55rem] text-text-tertiary flex items-center pr-1">{day}</div>
            {data.grid[di].map((v, bi) => {
              const intensity = v / max; // 0..1
              return (
                <div
                  key={bi}
                  title={`${day} ${data.buckets[bi]} — ${v} DMs`}
                  aria-label={`${day} ${data.buckets[bi]}: ${v} DMs`}
                  className="aspect-square rounded-[3px] border border-border"
                  style={{
                    background:
                      v === 0
                        ? 'transparent'
                        : `color-mix(in srgb, var(--text-primary) ${Math.round(12 + intensity * 78)}%, transparent)`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[0.55rem] text-text-tertiary">less</span>
        <div className="flex gap-[2px]">
          {[0.15, 0.4, 0.65, 0.9].map((f) => (
            <span
              key={f}
              className="w-[10px] h-[10px] rounded-[2px] border border-border"
              style={{ background: `color-mix(in srgb, var(--text-primary) ${Math.round(f * 90)}%, transparent)` }}
            />
          ))}
        </div>
        <span className="text-[0.55rem] text-text-tertiary">more</span>
      </div>
    </div>
  );
}
