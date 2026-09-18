import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { codeThemes } from './lib/highlight';
import type { LLMsOptions } from 'fumadocs-core/mdx-plugins/remark-llms';

const markdownOptions: LLMsOptions = {
	headingIds: false,
	stringify(node, _parent, state, info) {
		if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;
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
			const title = attributes.title ?? 'Learn more';
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
		rehypeCodeOptions: { themes: codeThemes }
	}
});
