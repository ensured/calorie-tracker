import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found 🥗</h1>
      <p className="mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
} 