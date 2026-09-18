import { apiSource, source } from '@/lib/source';
import { createSearchAPI } from 'fumadocs-core/search/server';

export const dynamic = 'force-static';
export const revalidate = false;

export const { staticGET: GET } = createSearchAPI('advanced', {
	language: 'english',
	indexes: [source, apiSource].flatMap((collection) =>
		collection.getPages().map((page) => ({
			id: page.url,
			title: page.data.title,
			description: page.data.description,
			url: page.url,
			structuredData: page.data.structuredData,
			breadcrumbs: [collection === apiSource ? 'API Reference' : 'Documentation']
		}))
	)
});
