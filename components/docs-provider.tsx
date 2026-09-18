'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import { lazy, type ReactNode } from 'react';

const SearchDialog = lazy(() => import('./search'));

export function DocsProvider({ children }: { children: ReactNode }) {
	// CSS owns color-scheme so theme changes retain the browser's `only` opt-out.
	return (
		<RootProvider
			theme={{ defaultTheme: 'dark', enableColorScheme: false }}
			search={{ SearchDialog }}
		>
			{children}
		</RootProvider>
	);
}
