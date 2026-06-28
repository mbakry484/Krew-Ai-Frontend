'use client';

import { RankedItem } from '../mockReportsData';

/**
 * Ranked frequency list with a proportional bar behind each row. Used for top
 * questions and most-asked products.
 */
export default function RankedList({ items, unit = '' }: { items: RankedItem[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="flex flex-col gap-[0.5rem]">
      {items.map((item, i) => (
        <div key={item.label} className="relative flex items-center gap-3 rounded-[6px] px-[2px] py-[3px]">
          <span className="text-[0.58rem] text-text-tertiary font-mono min-w-[16px]">#{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-[3px]">
              <span className="text-[0.72rem] text-text-secondary truncate">{item.label}</span>
              <span className="text-[0.66rem] text-text-tertiary tabular-nums shrink-0">{item.count}{unit}</span>
            </div>
            <div className="h-[3px] rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-text-tertiary" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
