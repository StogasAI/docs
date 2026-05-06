import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: 'Docs'
		}
		// githubUrl intentionally omitted — rendered manually in sidebar footer for ordering control
	};
}
