import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

function StogasDocsTitle() {
	return (
		<span className="holographic-accent-text text-xl font-semibold tracking-tight select-none">
			stogas
		</span>
	);
}

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: <StogasDocsTitle />
		}
		// githubUrl intentionally omitted — rendered manually in sidebar footer for ordering control
	};
}
