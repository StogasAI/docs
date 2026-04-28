import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-2xl font-bold mb-4">Stogas.ai Documentation</h1>
      <p>
        The unified AI gateway for zero-trust anonymous API access.{' '}
        <Link href="/docs" className="font-medium underline">
          Browse docs →
        </Link>
      </p>
    </div>
  );
}
