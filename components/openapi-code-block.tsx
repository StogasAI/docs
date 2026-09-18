'use client';

import { cn } from '@/lib/cn';
import { useRenderContext } from 'fumadocs-openapi/ui';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import { useShiki } from 'fumadocs-core/highlight/shiki/react';
import { Check, Clipboard } from 'lucide-react';
import { Suspense, useDeferredValue, type ComponentProps, type CSSProperties } from 'react';

const viewportStyle: CSSProperties & { '--padding-right': string } = {
	'--padding-right': '4rem'
};

function CodeFrame({ children, className, code, ...props }: ComponentProps<'pre'> & { code: string }) {
	const [copied, copy] = useCopyButton(() => navigator.clipboard.writeText(code));

	return (
		<CodeBlock
			{...props}
			className={cn('my-0', className)}
			allowCopy={false}
			viewportProps={{ style: viewportStyle, className: 'bg-inherit pointer-coarse:min-h-18' }}
		>
			{/* The scrollport owns the inset, so any native scrollbar is already excluded. */}
			<div className="sticky top-0 left-0 z-2 flex h-0 justify-end bg-inherit px-2">
				<button
					type="button"
					aria-label={copied ? 'Copied Text' : 'Copy Text'}
					onClick={copy}
					className={cn(
						buttonVariants({
							size: 'icon-xs',
							className:
								'shrink-0 self-start bg-inherit text-fd-muted-foreground hover:text-fd-accent-foreground'
						})
					)}
				>
					{copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
				</button>
			</div>
			<Pre>{children}</Pre>
		</CodeBlock>
	);
}

function HighlightedCode({ lang, code }: { lang: string; code: string }) {
	const { shiki, shikiOptions } = useRenderContext();
	return useShiki(() => shiki.getOrInit(), code, {
		...shikiOptions,
		lang,
		defaultColor: false,
		components: { pre: (props) => <CodeFrame {...props} code={code} /> }
	});
}

export function OpenAPICodeBlock({ lang, code }: { lang: string; code: string }) {
	// Pre-render highlighting; keep the current example visible while edits are highlighted.
	const deferredCode = useDeferredValue(code);
	return (
		<Suspense
			fallback={
				<CodeFrame code={deferredCode}>
					<code>{code}</code>
				</CodeFrame>
			}
		>
			<HighlightedCode lang={lang} code={deferredCode} />
		</Suspense>
	);
}
