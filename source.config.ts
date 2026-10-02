import { getMessage } from './lib/i18n';
import { messages } from './lib/messages';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { queryLanguage } from './lib/query-language';
import { routingFieldsMarkdown, type RoutingFieldGroup } from './lib/routing-fields';
import { codeThemes } from './lib/highlight';
import type { LLMsOptions } from 'fumadocs-core/mdx-plugins/remark-llms';
import { policySectionMarkdown, type PolicySection } from './lib/policy-reference';

const markdownOptions: LLMsOptions = {
	headingIds: false,
	stringify(node, _parent, state, info) {
		if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;
		if (node.name === 'RoutingFields') {
			const group = node.attributes.find(
				(attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'group'
			);
			if (group?.type === 'mdxJsxAttribute' && typeof group.value === 'string')
				return routingFieldsMarkdown(group.value as RoutingFieldGroup);
		}
		if (node.name === 'PolicyFields') {
			const section = node.attributes.find(
				(attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'section'
			);
			if (section?.type === 'mdxJsxAttribute' && typeof section.value === 'string')
				return policySectionMarkdown(section.value as PolicySection);
		}
		const children =
			node.type === 'mdxJsxFlowElement'
				? state.containerFlow(node, info)
				: state.containerPhrasing(node, info);
		if (node.name === 'Card') {
			const attributes = Object.fromEntries(
				node.attributes.flatMap((attribute) =>
					attribute.type === 'mdxJsxAttribute' && typeof attribute.value === 'string'
						? [[attribute.name, attribute.value]]
						: []
				)
			);
			const title = attributes.title ?? getMessage(messages.learnMore);
			const link = attributes.href
				? `[${title}](${new URL(attributes.href, 'https://stogas.ai')})`
				: title;
			return `${link}${attributes.description ? `: ${attributes.description}` : ''}\n\n${children}`;
		}
		if (['Cards', 'Steps', 'Callout'].includes(node.name ?? '')) return children;
	}
};

export const docs = defineDocs({
	dir: 'content/docs',
	docs: {
		schema: pageSchema,
		postprocess: {
			includeProcessedMarkdown: markdownOptions
		}
	},
	meta: {
		schema: metaSchema
	}
});

export const reference = defineDocs({
	dir: 'content/reference',
	docs: {
		schema: pageSchema,
		postprocess: {
			includeProcessedMarkdown: markdownOptions
		}
	},
	meta: {
		schema: metaSchema
	}
});

export default defineConfig({
	mdxOptions: {
		rehypeCodeOptions: { themes: codeThemes, langs: [queryLanguage] }
	}
});
