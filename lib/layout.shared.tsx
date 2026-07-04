import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

function StogasDocsTitle() {
	return (
		<span className="holographic-accent-text font-semibold text-xl tracking-tight select-none">
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
