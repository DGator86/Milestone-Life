function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className ?? ""}`} />;
}

export default function GoalsLoading() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6 space-y-1.5">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="space-y-6">
        {["Active", "Completed"].map((section) => (
          <div key={section}>
            <Skeleton className="h-3 w-16 mb-2" />
            <div className="ms-card">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-milestone-line last:border-0"
                >
                  <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
