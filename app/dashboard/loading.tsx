function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-lg animate-pulse ${className ?? ""}`} />;
}

function CardShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`ms-card p-6 ${className ?? ""}`}>
      {children}
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col">
      {/* TopBar skeleton */}
      <div className="sticky top-0 bg-white dark:bg-[#0B1929] border-b border-milestone-line dark:border-white/[0.08] px-6 py-3.5 flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Goal Progress card */}
        <CardShell>
          <div className="flex items-start justify-between mb-5">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <div className="rounded-lg border border-milestone-line p-4 space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-36" />
                      <div className="flex-1 flex justify-between gap-3">
                        {[1, 2, 3, 4, 5].map((k) => (
                          <Skeleton key={k} className="w-7 h-7 rounded-full" />
                        ))}
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardShell>

        {/* Task Health + Momentum */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardShell>
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-3 w-20" /></div>
              <Skeleton className="h-8 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full mb-4" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full mb-1.5 rounded-lg" />
            ))}
          </CardShell>

          <CardShell>
            <Skeleton className="h-3.5 w-24 mb-4" />
            <div className="flex gap-5">
              <Skeleton className="w-[88px] h-[88px] rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-lg" />
                ))}
                <div className="flex gap-1 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <Skeleton key={i} className="flex-1 aspect-square rounded-md" />
                  ))}
                </div>
              </div>
            </div>
          </CardShell>
        </div>
      </div>
    </div>
  );
}
