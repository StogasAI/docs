import { getMessage, i18n } from '@/lib/i18n';
import { messages } from '@/lib/messages';
import { apiSource, source } from '@/lib/source';
import { createI18nSearchAPI } from 'fumadocs-core/search/server';

export const dynamic = 'force-static';
export const revalidate = false;

export const { staticGET: GET } = createI18nSearchAPI('advanced', {
	i18n,
	indexes: [source, apiSource].flatMap((collection) =>
		collection.getPages().map((page) => ({
			locale: page.locale ?? i18n.defaultLanguage,
			id: page.url,
			title: page.data.title,
			description: page.data.description,
			url: page.url,
			structuredData: page.data.structuredData,
			breadcrumbs: [
				getMessage(
					collection === apiSource ? messages.apiReference : messages.documentationSection,
					page.locale
				)
			]
		}))
	)
});
