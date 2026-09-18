import { DocsProvider } from '@/components/docs-provider';
import './global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase: new URL('https://stogas.ai'),
	title: {
		default: 'Stogas',
		template: '%s | Stogas'
	},
	description: 'Documentation for Stogas.ai zero-trust anonymous AI API access.',
	other: { 'is-agentic-site-type': 'content' },
	icons: {
		icon: [
			{ url: '/app-icon.svg', type: 'image/svg+xml' },
			{ url: '/favicon.png', type: 'image/png', sizes: '128x128' }
		],
		apple: [{ url: '/app-icon-192.png', sizes: '192x192', type: 'image/png' }]
	}
};

export default function Layout({ children }: LayoutProps<'/'>) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<head>
				{/* Native light/dark themes must not be recolored while the page loads. */}
				<meta name="darkreader-lock" />
				<meta name="color-scheme" content="dark light only" />
			</head>
			<body className="flex min-h-screen flex-col">
				<DocsProvider>{children}</DocsProvider>
			</body>
		</html>
	);
}
