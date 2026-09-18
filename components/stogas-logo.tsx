'use client';

import type { ComponentProps } from 'react';

export function StogasLogo(props: ComponentProps<'a'>) {
	// The landing page is served outside the docs app, so use full-page navigation.
	return (
		<a {...props}>
			<span className="holographic-accent-text text-xl font-semibold tracking-tight select-none">
				stogas
			</span>
		</a>
	);
}
