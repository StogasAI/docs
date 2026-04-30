import { docs, reference } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { openapiPlugin } from 'fumadocs-openapi/server';
import { BookOpen, TerminalSquare } from 'lucide-react';
import React from 'react';
import {
	docsContentRoute,
	docsImageRoute,
	docsRoute,
	referenceContentRoute,
	referenceImageRoute,
	referenceRoute
} from './shared';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
	baseUrl: docsRoute,
	source: docs.toFumadocsSource(),
	plugins: [lucideIconsPlugin()]
});

export const apiSource = loader({
	baseUrl: referenceRoute,
	source: reference.toFumadocsSource(),
	plugins: [lucideIconsPlugin(), openapiPlugin()]
});

const docsTree = source.getPageTree();
const apiTree = apiSource.getPageTree();

// Unified tree with root folders — enables native Fumadocs sidebar tabs (dropdown picker).
// Each child folder has root: true, which getLayoutTabs reads to build the tab list.
// Only the active tab's pages are visible in the sidebar.
export const unifiedTree: any = {
	name: 'Docs',
	children: [
		{
			type: 'folder',
			name: 'Docs',
			description: 'Platform documentation',
			icon: React.createElement(BookOpen, { className: 'size-4' }),
			root: true,
			index: docsTree.children.find((c) => c.type === 'page' && c.url === docsRoute),
			children: docsTree.children
		},
		{
			type: 'folder',
			name: 'API Reference',
			description: 'Interactive API playground',
			icon: React.createElement(TerminalSquare, { className: 'size-4' }),
			root: true,
			index: apiTree.children.find((c) => c.type === 'page' && c.url === referenceRoute),
			children: apiTree.children
		}
	]
};

export function getPageImage(page: (typeof source)['$inferPage']) {
	const isReference = page.url.startsWith(referenceRoute);
	const segments = [...page.slugs, 'image.png'];

	return {
		segments,
		url: `${isReference ? referenceImageRoute : docsImageRoute}/${segments.join('/')}`
	};
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
	const isReference = page.url.startsWith(referenceRoute);
	const segments = [...page.slugs, 'content.md'];

	return {
		segments,
		url: `${isReference ? referenceContentRoute : docsContentRoute}/${segments.join('/')}`
	};
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
	const processed = await page.data.getText('processed');

	return `# ${page.data.title} (${page.url})

${processed}`;
}
