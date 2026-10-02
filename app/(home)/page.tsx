import { getMessage } from '@/lib/i18n';
import { messages } from '@/lib/messages';
import Link from 'next/link';

export default function HomePage() {
	return (
		<div className="flex flex-1 flex-col justify-center text-center">
			<h1 className="mb-4 text-2xl font-bold">{getMessage(messages.homeTitle)}</h1>
			<p>
				{getMessage(messages.homeDescription)}{' '}
				<Link href="/docs" className="font-medium underline">
					{getMessage(messages.browseDocs)}
				</Link>
			</p>
		</div>
	);
}
