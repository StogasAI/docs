'use client';

import { useTranslations } from '@fuma-translate/react';
import { messages } from '@/lib/messages';

import { cn } from '@/lib/cn';
import { apiHighlighter } from '@/lib/api-highlight';
import { codeThemes } from '@/lib/highlight';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import * as jsxRuntime from 'react/jsx-runtime';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import { Check, Clipboard } from 'lucide-react';
import { useMemo, useDeferredValue, type ComponentProps, type CSSProperties } from 'react';

const viewportStyle: CSSProperties & { '--padding-right': string } = {
	'--padding-right': '4rem'
};

function CodeFrame({
	children,
	className,
	code,
	...props
}: ComponentProps<'pre'> & { code: string }) {
	const t = useTranslations();
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
					aria-label={copied ? t(messages.copiedText) : t(messages.copyText)}
					onClick={copy}
					className={cn(
						buttonVariants({
							size: 'icon-xs',
							className:
								'text-fd-muted-foreground hover:text-fd-accent-foreground shrink-0 self-start bg-inherit'
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

export function OpenAPICodeBlock({ lang, code }: { lang: string; code: string }) {
	const deferredCode = useDeferredValue(code);
	return useMemo(() => {
		const highlighter = apiHighlighter();
		const tree = highlighter.codeToHast(deferredCode, {
			lang: highlighter.getLoadedLanguages().includes(lang) ? lang : 'text',
			themes: codeThemes,
			defaultColor: false
		});
		return toJsxRuntime(tree, {
			...jsxRuntime,
			components: { pre: (props) => <CodeFrame {...props} code={deferredCode} /> }
		});
	}, [lang, deferredCode]);
}
