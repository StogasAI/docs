import { i18n, getMessage } from '@/lib/i18n';
import { messages } from '@/lib/messages';
import { DocsProvider } from '@/components/docs-provider';
import './global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase: new URL('https://stogas.ai'),
	title: {
		default: 'Stogas Docs',
		template: '%s · Stogas Docs'
	},
	description: getMessage(messages.description),
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
		<html lang={i18n.defaultLanguage} dir="ltr" className="dark" suppressHydrationWarning>
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
