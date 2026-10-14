'use client';

import { translations } from '@/lib/i18n';
import { i18nProvider } from 'fumadocs-ui/i18n';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { lazy, type ReactNode } from 'react';

const SearchDialog = lazy(() => import('./search'));
const i18nProps = i18nProvider(translations);

export function DocsProvider({ children }: { children: ReactNode }) {
	// CSS owns color-scheme so theme changes retain the browser's `only` opt-out.
	return (
		<RootProvider
			i18n={i18nProps}
			theme={{ defaultTheme: 'dark', enableColorScheme: false }}
			search={{ SearchDialog }}
		>
			{children}
		</RootProvider>
	);
}
