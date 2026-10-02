'use client';

import { i18nProvider } from 'fumadocs-ui/i18n';
import { translations, i18n } from '@/lib/i18n';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { lazy, type ReactNode } from 'react';

const SearchDialog = lazy(() => import('./search'));

export function DocsProvider({ children }: { children: ReactNode }) {
	// CSS owns color-scheme so theme changes retain the browser's `only` opt-out.
	return (
		<RootProvider
			i18n={{ ...i18nProvider(translations, i18n.defaultLanguage), locales: [] }}
			theme={{ defaultTheme: 'dark', enableColorScheme: false }}
			search={{ SearchDialog }}
		>
			{children}
		</RootProvider>
	);
}
