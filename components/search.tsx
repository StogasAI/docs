'use client';

import { useRef } from 'react';
import { useTranslations } from '@fuma-translate/react';
import { messages } from '@/lib/messages';

import { useDocsSearch } from 'fumadocs-core/search/client';
import { useI18n } from 'fumadocs-ui/contexts/i18n';
import { staticClient } from 'fumadocs-core/search/client/orama-static';
import {
	SearchDialog,
	SearchDialogClose,
	SearchDialogContent,
	SearchDialogHeader,
	SearchDialogIcon,
	SearchDialogInput,
	SearchDialogList,
	SearchDialogListItem,
	SearchDialogOverlay,
	type SharedProps
} from 'fumadocs-ui/components/dialog/search';

export default function DocsSearchDialog(props: SharedProps) {
	const t = useTranslations();
	const returnFocus = useRef<HTMLElement | null>(null);
	const navigating = useRef(false);
	const { search, setSearch, query } = useDocsSearch({
		client: staticClient({ locale: useI18n().locale })
	});

	return (
		<SearchDialog
			{...props}
			search={search}
			onSearchChange={setSearch}
			isLoading={query.isLoading}
			onSelect={() => {
				navigating.current = true;
			}}
		>
			<SearchDialogOverlay className="backdrop-blur-none" />
			<SearchDialogContent
				onOpenAutoFocus={() => {
					navigating.current = false;
					returnFocus.current =
						document.activeElement instanceof HTMLElement &&
						document.activeElement !== document.body
							? document.activeElement
							: null;
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					if (navigating.current) return;
					const target = returnFocus.current;
					const fallback = Array.from(
						document.querySelectorAll<HTMLButtonElement>('[data-docs-search-trigger] button')
					).find((button) => button.getClientRects().length > 0);
					(target?.isConnected && target.getClientRects().length > 0 ? target : fallback)?.focus({
						preventScroll: true
					});
				}}
			>
				<SearchDialogHeader>
					<SearchDialogIcon aria-hidden="true" />
					<SearchDialogInput aria-label={t(messages.searchDocumentation)} />
					<SearchDialogClose />
				</SearchDialogHeader>
				{query.error ? (
					<p role="alert" className="p-4 text-sm">
						{t(messages.searchFailed)}
					</p>
				) : (
					<SearchDialogList
						items={query.data === 'empty' ? null : query.data}
						Item={(props) => (
							<SearchDialogListItem
								{...props}
								className={
									props.item.type === 'text' ? '[&>div:last-child]:line-clamp-2' : undefined
								}
							/>
						)}
					/>
				)}
			</SearchDialogContent>
		</SearchDialog>
	);
}
