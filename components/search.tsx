'use client';

import { useDocsSearch } from 'fumadocs-core/search/client';
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
	useSearchList,
	type SharedProps
} from 'fumadocs-ui/components/dialog/search';
import type { ComponentProps } from 'react';

function SearchResult(props: ComponentProps<typeof SearchDialogListItem>) {
	const { active } = useSearchList();
	return (
		<SearchDialogListItem
			{...props}
			aria-selected={undefined}
			aria-current={active === props.item.id ? true : undefined}
		/>
	);
}

export default function DocsSearchDialog(props: SharedProps) {
	const { search, setSearch, query } = useDocsSearch({ client: staticClient() });

	return (
		<SearchDialog {...props} search={search} onSearchChange={setSearch} isLoading={query.isLoading}>
			<SearchDialogOverlay className="backdrop-blur-none" />
			<SearchDialogContent>
				<SearchDialogHeader>
					<SearchDialogIcon aria-hidden="true" />
					<SearchDialogInput aria-label="Search documentation" />
					<SearchDialogClose />
				</SearchDialogHeader>
				{query.error ? (
					<p role="alert" className="p-4 text-sm">
						Search could not load. Check your connection and reload the page to try again.
					</p>
				) : (
					<SearchDialogList
						items={query.data === 'empty' ? null : query.data}
						Item={(props) => <SearchResult {...props} />}
					/>
				)}
			</SearchDialogContent>
		</SearchDialog>
	);
}
