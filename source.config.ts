import { getMessage } from './lib/i18n';
import { messages } from './lib/messages';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { queryLanguage } from './lib/query-language';
import { routingFieldsMarkdown, type RoutingFieldGroup } from './lib/routing-fields';
import { codeThemes } from './lib/highlight';
import type { LLMsOptions } from 'fumadocs-core/mdx-plugins/remark-llms';
import { replaceSource } from 'fumadocs-core/mdx-plugins/stringifier';
import { policySectionMarkdown, type PolicySection } from './lib/policy-reference';

type MarkdownFile = Parameters<typeof replaceSource>[0];
type MarkdownNode = Parameters<typeof replaceSource>[1];

/** Writes the Markdown export of components whose rendered content is not in the authored source. */
function remarkComponentMarkdown() {
	return (tree: MarkdownNode, file: MarkdownFile) => {
		const visit = (node: MarkdownNode) => {
			if ('children' in node) node.children.forEach(visit);
			if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;
			const attributes = Object.fromEntries(
				node.attributes.flatMap((attribute) =>
					attribute.type === 'mdxJsxAttribute' && typeof attribute.value === 'string'
						? [[attribute.name, attribute.value]]
						: []
				)
			);
			if (node.name === 'RoutingFields' && attributes.group)
				replaceSource(file, node, routingFieldsMarkdown(attributes.group as RoutingFieldGroup));
			if (node.name === 'PolicyFields' && attributes.section)
				replaceSource(file, node, policySectionMarkdown(attributes.section as PolicySection));
			// A card becomes one list item, so the cards of a group form a Markdown list of links.
			if (node.name === 'Card') {
				const title = attributes.title ?? getMessage(messages.learnMore);
				const link = attributes.href
					? `[${title}](${new URL(attributes.href, 'https://stogas.ai')})`
					: title;
				replaceSource(file, node, (s) => {
					const description = [attributes.description, s.inner(node)]
						.filter(Boolean)
						.join(' ')
						.replace(/\s+/g, ' ')
						.trim();
					return `- ${link}${description ? `: ${description}` : ''}`;
				});
			}
		};
		visit(tree);
	};
}

// Runtime output would keep each component as JSX and drop the replacements above.
const markdownOptions: LLMsOptions = {
	output: 'string',
	headingIds: false,
	filterElement: (node) =>
		(node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
		['Cards', 'Steps', 'Step', 'Callout'].includes(node.name ?? '')
			? 'children-only'
			: true
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
		remarkPlugins: [remarkComponentMarkdown],
		rehypeCodeOptions: { themes: codeThemes, langs: [queryLanguage] }
	}
});
