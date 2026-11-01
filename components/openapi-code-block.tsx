'use client';

import { useTranslations } from '@fuma-translate/react';
import { messages } from '@/lib/messages';

import { cn } from '@/lib/cn';
import { apiHighlighter } from '@/lib/api-highlight';
import { codeThemes } from '@/lib/highlight';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import * as jsxRuntime from 'react/jsx-runtime';
import { CodeBlock, Pre, type CodeBlockProps } from 'fumadocs-ui/components/codeblock';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import { Check, Clipboard } from 'lucide-react';
import {
	createContext,
	use,
	useMemo,
	useDeferredValue,
	type ComponentProps,
	type CSSProperties
} from 'react';

const viewportStyle: CSSProperties & { '--padding-right': string } = {
	'--padding-right': '4rem'
};

// The block's options reach its frame apart from the highlighted tree, so highlighting
// depends only on the code and language, and the frame keeps its DOM and scroll position.
const FrameContext = createContext<{ code: string; codeblock?: CodeBlockProps }>({ code: '' });

function CodeFrame({ children, className, ...props }: ComponentProps<'pre'>) {
	const t = useTranslations();
	const { code, codeblock: { allowCopy = true, viewportProps, ...options } = {} } =
		use(FrameContext);
	const [copied, copy] = useCopyButton(() => navigator.clipboard.writeText(code));
	// A title bar holds the copy button. Without one, the copy button stays in the scrollport.
	const copyInViewport = !options.title && allowCopy !== false && allowCopy !== 'false';

	return (
		<CodeBlock
			{...props}
			{...options}
			className={cn('my-0', className, options.className)}
			allowCopy={!copyInViewport && allowCopy}
			viewportProps={{
				...viewportProps,
				style: copyInViewport
					? { ...viewportStyle, ...viewportProps?.style }
					: viewportProps?.style,
				className: cn(
					'bg-inherit',
					copyInViewport && 'pointer-coarse:min-h-18',
					viewportProps?.className
				)
			}}
		>
			{copyInViewport && (
				// The scrollport owns the inset, so any native scrollbar is already excluded.
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
			)}
			<Pre>{children}</Pre>
		</CodeBlock>
	);
}

export function OpenAPICodeBlock({
	lang,
	code,
	codeblock
}: {
	lang: string;
	code: string;
	codeblock?: CodeBlockProps;
}) {
	const deferredCode = useDeferredValue(code);
	const highlighted = useMemo(() => {
		const highlighter = apiHighlighter();
		const tree = highlighter.codeToHast(deferredCode, {
			lang: highlighter.getLoadedLanguages().includes(lang) ? lang : 'text',
			themes: codeThemes,
			defaultColor: false
		});
		return toJsxRuntime(tree, { ...jsxRuntime, components: { pre: CodeFrame } });
	}, [lang, deferredCode]);
	return <FrameContext value={{ code: deferredCode, codeblock }}>{highlighted}</FrameContext>;
}
