"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-milestone-bg dark:bg-[#07111F] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-milestone-blue flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white font-semibold text-xl leading-none">M</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 dark:text-white/50 mb-6 leading-relaxed">
          This page ran into an unexpected error. Your data is safe.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-milestone-blue text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
