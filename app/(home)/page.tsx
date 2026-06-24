import Link from 'next/link';

export default function HomePage() {
	return (
		<div className="flex flex-1 flex-col justify-center text-center">
			<h1 className="mb-4 text-2xl font-bold">Stogas.ai Documentation</h1>
			<p>
				The unified AI gateway for zero-trust anonymous API access.{' '}
				<Link href="/docs" className="font-medium underline">
					Browse docs →
				</Link>
			</p>
		</div>
	);
}
