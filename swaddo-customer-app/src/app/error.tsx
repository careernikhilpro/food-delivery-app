'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-red-50 p-4 font-sans text-red-900">
      <h2 className="text-2xl font-black mb-4">Something went wrong!</h2>
      <div className="bg-white p-4 rounded-xl shadow-lg border border-red-200 w-full max-w-2xl overflow-auto text-left">
        <p className="font-mono text-sm text-red-600 font-bold mb-2">{error.name}: {error.message}</p>
        <pre className="font-mono text-[11px] text-gray-700 whitespace-pre-wrap">{error.stack}</pre>
      </div>
      <button
        className="mt-8 bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-red-700 transition-colors"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
