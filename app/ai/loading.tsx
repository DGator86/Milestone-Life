import AppShell from "@/components/layout/AppShell";

export default function AILoading() {
  return (
    <AppShell user={null as never}>
      <div className="p-4 md:p-6 max-w-2xl animate-pulse">
        <div className="h-7 w-48 bg-gray-100 rounded-lg mb-1" />
        <div className="h-4 w-64 bg-gray-100 rounded mb-6" />
        <div className="space-y-4">
          {[120, 80, 200, 100].map((h, i) => (
            <div key={i} className="ms-card p-5" style={{ height: h }} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
