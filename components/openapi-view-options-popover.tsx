'use client';

import { cn } from '@/lib/cn';
import { usePathname } from 'fumadocs-core/framework';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { ChevronDown, ExternalLinkIcon, FileJson, TextIcon } from 'lucide-react';
import { useMemo } from 'react';

function GithubIcon() {
	return (
		<svg fill="currentColor" role="img" viewBox="0 0 24 24">
			<title>GitHub</title>
			<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
		</svg>
	);
}

function SciraIcon() {
	return (
		<svg viewBox="0 0 910 934" fill="none" xmlns="http://www.w3.org/2000/svg">
			<title>Scira AI</title>
			<path d="M647.664 197.775C569.13 189.049 525.5 145.419 516.774 66.8849C508.048 145.419 464.418 189.049 385.884 197.775C464.418 206.501 508.048 250.131 516.774 328.665C525.5 250.131 569.13 206.501 647.664 197.775Z" fill="currentColor" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" />
			<path d="M857.5 508.116C763.259 497.644 710.903 445.288 700.432 351.047C689.961 445.288 637.605 497.644 543.364 508.116C637.605 518.587 689.961 570.943 700.432 665.184C710.903 570.943 763.259 518.587 857.5 508.116Z" stroke="currentColor" strokeWidth="20" strokeLinejoin="round" />
			<path d="M760.632 764.337C720.719 814.616 669.835 855.1 611.872 882.692C553.91 910.285 490.404 924.255 426.213 923.533C362.022 922.812 298.846 907.419 241.518 878.531C184.19 849.643 134.228 808.026 95.4548 756.863C56.6815 705.7 30.1238 646.346 17.8129 583.343C5.50207 520.339 7.76433 455.354 24.4266 393.359C41.089 331.364 71.7099 274.001 113.947 225.658C156.184 177.315 208.919 139.273 268.117 114.442" stroke="currentColor" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

function OpenAIIcon() {
	return (
		<svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
			<title>OpenAI</title>
			<path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944z" />
		</svg>
	);
}

function AnthropicIcon() {
	return (
		<svg fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<title>Anthropic</title>
			<path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
		</svg>
	);
}

function CursorIcon() {
	return (
		<svg fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<title>Cursor</title>
			<path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
		</svg>
	);
}

export function OpenApiViewOptionsPopover({
	markdownUrl,
	jsonUrl,
	githubUrl,
	className
}: {
	markdownUrl: string;
	jsonUrl: string;
	githubUrl: string;
	className?: string;
}) {
	const pathname = usePathname();
	const items = useMemo(() => {
		const q = `Read ${typeof window === 'undefined' ? pathname : new URL(pathname, window.location.origin)}, I want to ask questions about it.`;

		return [
			{
				title: 'Open OpenAPI specification',
				href: githubUrl,
				icon: <GithubIcon />
			},
			{
				title: 'View as Markdown',
				href: markdownUrl,
				icon: <TextIcon />
			},
			{
				title: 'View as JSON',
				href: jsonUrl,
				icon: <FileJson />
			},
			{
				title: 'Open in Scira AI',
				href: `https://scira.ai/?${new URLSearchParams({ q })}`,
				icon: <SciraIcon />
			},
			{
				title: 'Open in ChatGPT',
				href: `https://chatgpt.com/?${new URLSearchParams({ hints: 'search', q })}`,
				icon: <OpenAIIcon />
			},
			{
				title: 'Open in Claude',
				href: `https://claude.ai/new?${new URLSearchParams({ q })}`,
				icon: <AnthropicIcon />
			},
			{
				title: 'Open in Cursor',
				href: `https://cursor.com/link/prompt?${new URLSearchParams({ text: q })}`,
				icon: <CursorIcon />
			}
		];
	}, [githubUrl, jsonUrl, markdownUrl, pathname]);

	return (
		<Popover>
			<PopoverTrigger
				className={cn(
					buttonVariants({ color: 'secondary', size: 'sm' }),
					'gap-2 data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground',
					className
				)}
			>
				Open
				<ChevronDown className="size-3.5 text-fd-muted-foreground" />
			</PopoverTrigger>
			<PopoverContent className="flex flex-col">
				{items.map((item) => (
					<a
						key={item.href}
						href={item.href}
						target="_blank"
						rel="noreferrer noopener"
						className="inline-flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4"
					>
						{item.icon}
						{item.title}
						<ExternalLinkIcon className="ms-auto size-3.5 text-fd-muted-foreground" />
					</a>
				))}
			</PopoverContent>
		</Popover>
	);
}
