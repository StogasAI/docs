'use client';

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
	SearchDialogOverlay,
	type SharedProps
} from 'fumadocs-ui/components/dialog/search';

export default function DocsSearchDialog(props: SharedProps) {
	const t = useTranslations();
	const { search, setSearch, query } = useDocsSearch({
		client: staticClient({ locale: useI18n().locale })
	});

	return (
		<SearchDialog {...props} search={search} onSearchChange={setSearch} isLoading={query.isLoading}>
			<SearchDialogOverlay className="backdrop-blur-none" />
			<SearchDialogContent>
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
					<SearchDialogList items={query.data === 'empty' ? null : query.data} />
				)}
			</SearchDialogContent>
		</SearchDialog>
	);
}
