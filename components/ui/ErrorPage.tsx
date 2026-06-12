"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <div className="w-16 h-16 rounded-full bg-milestone-red-dim flex items-center justify-center">
        <AlertCircle size={28} className="text-milestone-red" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          {"An unexpected error occurred. Please try again."}
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 bg-milestone-blue text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
      >
        <RefreshCcw size={14} />
        Try again
      </button>
    </div>
  );
}
