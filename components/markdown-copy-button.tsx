'use client';

import { useTranslations } from '@fuma-translate/react';
import { messages } from '@/lib/messages';

import { cn } from '@/lib/cn';
import { readBoundedResponseText } from '@/lib/http';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Check, CircleAlert, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const MAX_MARKDOWN_BYTES = 2 * 1024 * 1024;

export function MarkdownCopyButton({
	markdownUrl,
	children,
	className
}: {
	markdownUrl: string;
	children?: string;
	className?: string;
}) {
	const t = useTranslations();
	const [loading, setLoading] = useState(false);
	const [copied, setCopied] = useState(false);
	const [failed, setFailed] = useState(false);
	const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => () => clearTimeout(resetTimer.current), []);

	async function copyMarkdown() {
		setLoading(true);
		setFailed(false);
		setCopied(false);
		clearTimeout(resetTimer.current);
		try {
			const content = fetch(markdownUrl, { signal: AbortSignal.timeout(10_000) }).then(
				async (response) => {
					if (!response.ok) throw new Error(`Failed to fetch markdown: ${response.status}`);
					return new Blob([await readBoundedResponseText(response, MAX_MARKDOWN_BYTES)], {
						type: 'text/plain'
					});
				}
			);
			// Start the clipboard write in the click event, preserving Safari's user activation.
			await navigator.clipboard.write([new ClipboardItem({ 'text/plain': content })]);
			setCopied(true);
			resetTimer.current = setTimeout(() => setCopied(false), 1500);
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
					variant: 'secondary',
					size: 'sm',
					className: '[&_svg]:text-fd-muted-foreground gap-2 border-0 [&_svg]:size-3.5'
				}),
				className
			)}
			aria-live="polite"
			aria-busy={loading}
		>
			{copied ? (
				<Check aria-hidden="true" />
			) : failed ? (
				<CircleAlert aria-hidden="true" />
			) : (
				<Copy aria-hidden="true" />
			)}
			{loading
				? t(messages.copying)
				: copied
					? t(messages.copied)
					: failed
						? t(messages.copyFailed)
						: (children ?? t(messages.copyMarkdown))}
		</button>
	);
}
