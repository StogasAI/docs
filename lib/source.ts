import { getMessage, i18n, type Locale } from './i18n';
import { messages } from './messages';
import { docs, reference } from 'collections/server';
import type { Item, Root } from 'fumadocs-core/page-tree';
import { loader, type LoaderPlugin } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { openapiPlugin } from 'fumadocs-openapi/server';
import { BookOpen, TerminalSquare } from 'lucide-react';
import React from 'react';
import { stringify } from 'yaml';
import { languageIconPaths, type LanguageIcon } from './language-icons';
import { providerLogos, type ProviderLogo } from './provider-logos';
import { openapiDocuments, scopeOpenApiDocument, type OpenAPIDocumentId } from './openapi';
import {
	docsContentRoute,
	docsImageRoute,
	docsRoute,
	referenceContentRoute,
	referenceImageRoute,
	referenceRoute
} from './shared';

// SDK and provider guides name a language or provider logo as `logo:<name>`; Lucide resolves every
// other icon name.
function logoIconsPlugin(): LoaderPlugin {
	function svg(name: string) {
		if (Object.hasOwn(languageIconPaths, name))
			return React.createElement(
				'svg',
				{ viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true },
				React.createElement('path', { d: languageIconPaths[name as LanguageIcon] })
			);
		if (Object.hasOwn(providerLogos, name)) {
			const logo = providerLogos[name as ProviderLogo];
			return React.createElement(
				'svg',
				{ viewBox: logo.viewBox, fill: 'currentColor', fillRule: 'evenodd', 'aria-hidden': true },
				...logo.paths.map((path, index) =>
					React.createElement('path', {
						key: index,
						d: path.d,
						fillOpacity: 'opacity' in path ? path.opacity : undefined
					})
				)
			);
		}
		throw new Error(`Unknown logo: ${name}`);
	}
	function resolve<Node extends { icon?: React.ReactNode }>(node: Node): Node {
		if (typeof node.icon === 'string' && node.icon.startsWith('logo:'))
			node.icon = svg(node.icon.slice('logo:'.length));
		return node;
	}
	return { name: 'stogas:logo-icons', transformPageTree: { file: resolve, folder: resolve } };
}

export const source = loader({
	baseUrl: docsRoute,
	i18n,
	source: docs.toFumadocsSource(),
	plugins: [logoIconsPlugin(), lucideIconsPlugin()]
});

export const apiSource = loader({
	baseUrl: referenceRoute,
	i18n,
	source: reference.toFumadocsSource(),
	plugins: [lucideIconsPlugin(), openapiPlugin()]
});

export function getUnifiedTree(locale: Locale = i18n.defaultLanguage): Root {
	const docsTree = source.getPageTree(locale);
	const apiTree = apiSource.getPageTree(locale);

	// Unified tree with root folders — enables native Fumadocs sidebar tabs (dropdown picker).
	// Each child folder has root: true, which getLayoutTabs reads to build the tab list.
	// Only the active tab's pages are visible in the sidebar.
	return {
		name: getMessage(messages.docs, locale),
		children: [
			{
				type: 'folder',
				name: getMessage(messages.platform, locale),
				icon: React.createElement(BookOpen, { className: 'size-4', 'aria-hidden': true }),
				root: true,
				index: docsTree.children.find(
					(child): child is Item => child.type === 'page' && child.url === docsRoute
				),
				children: docsTree.children
			},
			{
				type: 'folder',
				name: getMessage(messages.apiReference, locale),
				icon: React.createElement(TerminalSquare, { className: 'size-4', 'aria-hidden': true }),
				root: true,
				index: apiTree.children.find(
					(child): child is Item => child.type === 'page' && child.url === referenceRoute
				),
				children: apiTree.children
			}
		]
	};
}

export function getPageImage(page: (typeof source)['$inferPage']) {
	const isReference = page.url.startsWith(referenceRoute);
	const segments = [...page.slugs, 'image.png'];

	return {
		segments,
		url: `${isReference ? referenceImageRoute : docsImageRoute}/${segments.join('/')}`
	};
}

const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

/**
 * Finds the operation of a generated page: Fumadocs names its document in the front matter, and
 * the file name is the operation ID.
 */
function findOperation(page: (typeof source)['$inferPage']) {
	const preload = page.data._openapi?.preload;
	const document = Array.isArray(preload) ? preload[0] : undefined;
	if (typeof document !== 'string' || !Object.hasOwn(openapiDocuments, document)) return;
	const id = document as OpenAPIDocumentId;
	const operationId = page.path
		.split('/')
		.pop()
		?.replace(/\.mdx$/, '');
	for (const [path, pathItem] of Object.entries(openapiDocuments[id].paths ?? {})) {
		for (const method of METHODS) {
			if (pathItem?.[method]?.operationId === operationId) return { document: id, path, method };
		}
	}
}

/** The OpenAPI document of an operation page. */
export function getOpenApiDocument(page: (typeof source)['$inferPage']) {
	return findOperation(page)?.document;
}

/** The operation of a page, as a document with only what the operation uses. */
export function getOpenApiOperationSpec(page: (typeof source)['$inferPage']) {
	const operation = findOperation(page);
	return operation && scopeOpenApiDocument(openapiDocuments[operation.document], [operation]);
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
	const isReference = page.url.startsWith(referenceRoute);
	const segments = [...page.slugs, 'content.md'];

	return {
		segments,
		url: `${isReference ? referenceContentRoute : docsContentRoute}/${segments.join('/')}`
	};
}

export function getOpenApiJsonUrl(page: (typeof source)['$inferPage']) {
	const segments = [...page.slugs, 'openapi.json'];

	return {
		segments,
		url: `${referenceContentRoute}/${segments.join('/')}`
	};
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
	const canonical = new URL(page.url, 'https://stogas.ai').href;
	const metadata = stringify({
		title: page.data.title,
		language: page.locale ?? i18n.defaultLanguage,
		description: page.data.description,
		url: canonical
	});
	const introduction = `---\n${metadata}---\n\n# ${page.data.title}\n\n${page.data.description ?? ''}`;
	const operationSpec = getOpenApiOperationSpec(page);
	if (operationSpec) {
		const yaml = stringify(operationSpec, { lineWidth: 0 });
		// Descriptions can contain their own fenced examples.
		const fence = '`'.repeat(
			Math.max(3, ...Array.from(yaml.matchAll(/`+/g), (m) => m[0].length + 1))
		);
		return `${introduction}\n\n## OpenAPI\n\n${fence}yaml\n${yaml}${fence}\n`;
	}

	const processed = await page.data.getText('processed');

	return `${introduction}\n\n${processed.trim()}\n`;
}
