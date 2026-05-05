'use client'
export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="p-4 bg-red-50 text-red-800 h-screen flex flex-col justify-center items-center">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md border border-red-200">
        <h2 className="text-lg font-bold mb-2">Something went wrong!</h2>
        <p className="text-sm font-mono break-words">{error.message}</p>
        {error.digest && <p className="text-xs italic mt-2">Digest: {error.digest}</p>}
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
