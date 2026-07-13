'use client';

// Neutral product thumbnail. Mock products have no images, so we fall back to
// initials on an elevated surface (no invented colors). Swaps to the real image
// automatically once GET /api/ivy/inventory/products returns an imageUrl.

export function initialsFor(title: string): string {
  const words = title.trim().split(/\s+/);
  const a = words[0]?.[0] ?? '';
  const b = words[1]?.[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

export default function ProductThumb({
  title,
  imageUrl,
  size = 34,
}: {
  title: string;
  imageUrl: string | null;
  size?: number;
}) {
  return (
    <span
      className="shrink-0 rounded-[8px] border border-border bg-background3 overflow-hidden flex items-center justify-center text-text-tertiary"
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[0.58rem] tracking-[0.02em] font-medium">{initialsFor(title)}</span>
      )}
    </span>
  );
}
