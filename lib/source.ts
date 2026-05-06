import { docs, reference } from 'collections/server';
import spec from '@/content/openapi/stogas.json';
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
			name: 'Platform Documentation',
			icon: React.createElement(BookOpen, { className: 'size-4' }),
			root: true,
			index: docsTree.children.find((c) => c.type === 'page' && c.url === docsRoute),
			children: docsTree.children
		},
		{
			type: 'folder',
			name: 'API Reference',
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

type JsonObject = Record<string, any>;

const openApiSpec = spec as JsonObject;

function cloneJson<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function getJsonPointer(root: JsonObject, ref: string) {
	if (!ref.startsWith('#/')) return;

	return ref
		.slice(2)
		.split('/')
		.reduce<any>((current, segment) => current?.[segment.replaceAll('~1', '/').replaceAll('~0', '~')], root);
}

function collectRefs(value: unknown, refs = new Set<string>()) {
	if (!value || typeof value !== 'object') return refs;

	if (Array.isArray(value)) {
		for (const item of value) collectRefs(item, refs);
		return refs;
	}

	for (const [key, child] of Object.entries(value as JsonObject)) {
		if (key === '$ref' && typeof child === 'string' && child.startsWith('#/components/')) {
			refs.add(child);
			continue;
		}

		collectRefs(child, refs);
	}

	return refs;
}

function addSecuritySchemes(components: JsonObject, security: unknown) {
	if (!Array.isArray(security)) return;

	for (const requirement of security) {
		if (!requirement || typeof requirement !== 'object') continue;
		for (const schemeName of Object.keys(requirement)) {
			const scheme = openApiSpec.components?.securitySchemes?.[schemeName];
			if (!scheme) continue;

			components.securitySchemes ??= {};
			components.securitySchemes[schemeName] = cloneJson(scheme);
		}
	}
}

function getScopedComponents(routeSpec: JsonObject, operation: JsonObject) {
	const components: JsonObject = {};
	const refs = collectRefs(routeSpec);
	const visited = new Set<string>();

	addSecuritySchemes(components, operation.security ?? openApiSpec.security);

	for (const ref of refs) {
		if (visited.has(ref)) continue;
		visited.add(ref);

		const [, category, name] = ref.match(/^#\/components\/([^/]+)\/(.+)$/) ?? [];
		if (!category || !name) continue;

		const value = getJsonPointer(openApiSpec, ref);
		if (!value) continue;

		components[category] ??= {};
		components[category][name] = cloneJson(value);

		for (const nestedRef of collectRefs(value)) {
			if (!visited.has(nestedRef)) refs.add(nestedRef);
		}
	}

	return Object.keys(components).length > 0 ? components : undefined;
}

function findOperationForPage(page: (typeof source)['$inferPage']) {
	const operationId = page.path.split('/').pop()?.replace(/\.mdx$/, '');
	if (!operationId) return;

	for (const [pathName, pathItemValue] of Object.entries(openApiSpec.paths ?? {})) {
		const pathItem = pathItemValue as JsonObject;
		for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']) {
			const operation = pathItem[method] as JsonObject | undefined;
			if (operation?.operationId === operationId) {
				return { path: pathName, method, operation, pathItem };
			}
		}
	}
}

export function getOpenApiOperationSpec(page: (typeof source)['$inferPage']) {
	if (!page.url.startsWith(referenceRoute)) return;

	const match = findOperationForPage(page);
	if (!match) return;

	const { path, method, operation, pathItem } = match;
	const routePathItem: JsonObject = { [method]: cloneJson(operation) };
	if (pathItem.parameters) routePathItem.parameters = pathItem.parameters;
	const routeSpec: JsonObject = {
		openapi: openApiSpec.openapi,
		info: openApiSpec.info,
		jsonSchemaDialect: openApiSpec.jsonSchemaDialect,
		servers: openApiSpec.servers,
		paths: {
			[path]: routePathItem
		}
	};
	const components = getScopedComponents(routeSpec, operation);
	if (components) routeSpec.components = components;
	if (Array.isArray(operation.tags) && Array.isArray(openApiSpec.tags)) {
		routeSpec.tags = openApiSpec.tags.filter((tag: JsonObject) => operation.tags.includes(tag.name));
	}

	if (!operation.security && openApiSpec.security) routeSpec.security = openApiSpec.security;
	return routeSpec;
}

export function isOpenApiOperationPage(page: (typeof source)['$inferPage']) {
	return getOpenApiOperationSpec(page) !== undefined;
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

export function getLLMContentType(page: (typeof source)['$inferPage'], format = 'content.md') {
	return format === 'openapi.json' && isOpenApiOperationPage(page)
		? 'application/json'
		: 'text/markdown';
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
	const operationSpec = getOpenApiOperationSpec(page);
	if (operationSpec) return JSON.stringify(operationSpec, null, '\t');

	const processed = await page.data.getText('processed');

	return `# ${page.data.title} (${page.url})

${processed}`;
}
