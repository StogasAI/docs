'use client';

import { cn } from '@/lib/cn';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function MarkdownCopyButton({
	markdownUrl,
	children = 'Copy Markdown',
	className
}: {
	markdownUrl: string;
	children?: string;
	className?: string;
}) {
	const [loading, setLoading] = useState(false);
	const [copied, setCopied] = useState(false);

	async function copyMarkdown() {
		setLoading(true);
		try {
			const response = await fetch(markdownUrl, { cache: 'no-store' });
			if (!response.ok) throw new Error(`Failed to fetch markdown: ${response.status}`);

			await navigator.clipboard.writeText(await response.text());
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} finally {
			setLoading(false);
		}
	}

	return (
		<button
			type="button"
			disabled={loading}
			onClick={copyMarkdown}
			className={cn(
				buttonVariants({
					color: 'secondary',
					size: 'sm',
					className: '[&_svg]:text-fd-muted-foreground gap-2 [&_svg]:size-3.5'
				}),
				className
			)}
		>
			{copied ? <Check /> : <Copy />}
			{children}
		</button>
	);
}
