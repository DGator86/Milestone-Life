function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className ?? ""}`} />;
}

export default function KillListLoading() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 space-y-1.5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="ms-card">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-milestone-line last:border-0"
          >
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
