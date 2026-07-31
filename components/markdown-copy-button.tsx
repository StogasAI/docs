'use client';

import { cn } from '@/lib/cn';
import { readBoundedResponseText } from '@/lib/http';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Check, CircleAlert, Copy } from 'lucide-react';
import { useState } from 'react';

const MAX_MARKDOWN_BYTES = 2 * 1024 * 1024;

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
	const [failed, setFailed] = useState(false);

	async function copyMarkdown() {
		setLoading(true);
		setFailed(false);
		try {
			const response = await fetch(markdownUrl, {
				cache: 'no-store',
				signal: AbortSignal.timeout(10_000)
			});
			if (!response.ok) throw new Error(`Failed to fetch markdown: ${response.status}`);

			await navigator.clipboard.writeText(
				await readBoundedResponseText(response, MAX_MARKDOWN_BYTES)
			);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		} catch {
			setFailed(true);
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
			aria-live="polite"
		>
			{copied ? <Check /> : failed ? <CircleAlert /> : <Copy />}
			{copied ? 'Copied' : failed ? 'Copy failed' : children}
		</button>
	);
}
