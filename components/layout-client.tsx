'use client';

import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { ExternalLink, LayoutDashboard, Home } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { StogasLink } from './stogas-link';

// Inline GitHub mark SVG (brand icon, not in lucide-react)
function GithubIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
		</svg>
	);
}

interface LayoutClientProps {
	children: ReactNode;
	tree: any;
	baseOptions: BaseLayoutProps;
}

export default function LayoutClient({ children, tree, baseOptions }: LayoutClientProps) {
	return (
		<DocsLayout
			tree={tree}
			slots={{ themeSwitch: false }}
			{...baseOptions}
			sidebar={{
				defaultOpenLevel: 1,
				footer: (
					<div className="border-fd-border/50 mt-1 flex w-full flex-col gap-1 border-t pt-2">
						{/* Landing page + dashboard links */}
						<StogasLink
							href="https://stogas.ai/"
							className="text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent group flex items-center gap-3 rounded-md p-2 text-sm transition-colors"
						>
							<Home className="text-fd-primary size-4 shrink-0" />
							<span className="text-[13px]">Landing Page</span>
							<ExternalLink className="ml-auto size-3 opacity-30 transition-opacity group-hover:opacity-100" />
						</StogasLink>
						<StogasLink
							href="https://app.stogas.ai/overview"
							className="text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent group flex items-center gap-3 rounded-md p-2 text-sm transition-colors"
						>
							<LayoutDashboard className="text-fd-primary size-4 shrink-0" />
							<span className="text-[13px]">Dashboard</span>
							<ExternalLink className="ml-auto size-3 opacity-30 transition-opacity group-hover:opacity-100" />
						</StogasLink>

						{/* GitHub + theme toggle row */}
						<div className="border-fd-border/60 bg-fd-secondary/50 mt-1 flex items-center rounded-lg border p-0.5">
							<a
								href="https://github.com/StogasAI/docs"
								target="_blank"
								rel="noreferrer noopener"
								aria-label="GitHub"
								className="text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent inline-flex size-8 items-center justify-center rounded-md transition-colors"
							>
								<GithubIcon className="size-4" />
							</a>
							<ThemeSwitch className="ms-auto rounded-none border-y-0 border-e-0 px-1 py-0 *:rounded-md" />
						</div>
					</div>
				)
			}}
		>
			{children}
		</DocsLayout>
	);
}
