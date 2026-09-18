import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { StogasLogo } from '@/components/stogas-logo';

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: StogasLogo,
			url: '/'
		}
		// githubUrl intentionally omitted — rendered manually in sidebar footer for ordering control
	};
}
