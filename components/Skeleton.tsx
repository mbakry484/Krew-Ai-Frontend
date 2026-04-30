export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-background3 rounded-[6px] ${className}`} />;
}
