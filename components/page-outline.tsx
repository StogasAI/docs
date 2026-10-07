'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from '@fuma-translate/react';
import { TOCScrollArea, useItems, useTOCItems } from 'fumadocs-ui/components/toc';
import { TOCItem, TOCItems } from 'fumadocs-ui/components/toc/default';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from 'fumadocs-ui/components/ui/collapsible';
import { messages } from '@/lib/messages';

export function PageOutline() {
	const t = useTranslations();
	const items = useTOCItems();
	const activeItems = useItems();
	const position = activeItems.findLastIndex((item) => item.active) + 1;
	const current = activeItems.find((item) => item.active)?.original.title;
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!open) return;
		function closeOutside(event: MouseEvent) {
			if (event.target instanceof Node && !ref.current?.contains(event.target)) setOpen(false);
		}
		window.addEventListener('click', closeOutside);
		return () => window.removeEventListener('click', closeOutside);
	}, [open]);
	return (
		<Collapsible
			ref={ref}
			open={open}
			onOpenChange={setOpen}
			data-toc-popover=""
			className="bg-fd-background max-xl:layout:[--fd-toc-popover-height:--spacing(10)] sticky top-(--fd-docs-row-2) z-10 h-(--fd-toc-popover-height) [grid-area:toc-popover] xl:hidden"
		>
			<CollapsibleTrigger
				data-toc-popover-trigger=""
				className="text-fd-muted-foreground flex h-10 w-full items-center gap-2.5 border-b px-4 text-start text-sm md:px-6"
				onKeyDown={(event) => {
					if (event.key === 'Escape') setOpen(false);
				}}
			>
				<svg
					role="progressbar"
					aria-label={t(messages.outlineProgress)}
					aria-valuemin={0}
					aria-valuemax={items.length || 1}
					aria-valuenow={position}
					className="size-4 shrink-0"
					viewBox="0 0 20 20"
				>
					<circle
						cx="10"
						cy="10"
						r="8"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						className="text-fd-border"
					/>
					<circle
						cx="10"
						cy="10"
						r="8"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						pathLength="1"
						strokeDasharray="1"
						strokeDashoffset={1 - position / Math.max(1, items.length)}
						transform="rotate(-90 10 10)"
					/>
				</svg>
				<span className="text-fd-foreground shrink-0">{t(messages.onThisPage)}</span>
				<span className="min-w-0 flex-1 truncate">{current}</span>
				<ChevronDown
					aria-hidden="true"
					className={open ? 'size-4 shrink-0 rotate-180' : 'size-4 shrink-0'}
				/>
			</CollapsibleTrigger>
			<CollapsibleContent
				data-toc-popover-content=""
				className="bg-fd-background border-b px-4 py-2"
				onKeyDown={(event) => {
					if (event.key === 'Escape') {
						setOpen(false);
						ref.current?.querySelector('button')?.focus();
					}
				}}
			>
				<TOCScrollArea>
					<TOCItems>
						{items.map((item) => (
							<TOCItem key={item.url} item={item} onClick={() => setOpen(false)} />
						))}
					</TOCItems>
				</TOCScrollArea>
			</CollapsibleContent>
		</Collapsible>
	);
}
