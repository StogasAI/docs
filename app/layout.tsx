import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	metadataBase: new URL('https://stogas.ai'),
	title: {
		default: 'Stogas.ai Docs',
		template: '%s | Stogas.ai Docs'
	},
	description: 'Documentation for Stogas.ai zero-trust anonymous AI API access.'
};

export default function Layout({ children }: LayoutProps<'/'>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="flex min-h-screen flex-col">
				<RootProvider search={{ options: { type: 'static' } }}>{children}</RootProvider>
			</body>
		</html>
	);
}
