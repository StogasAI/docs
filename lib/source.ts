import { getMessage, i18n, type Locale } from './i18n';
import { messages } from './messages';
import { docs, reference } from 'collections/server';
import spec from '@/content/openapi/stogas.json';
import type { Item, Root } from 'fumadocs-core/page-tree';
import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { openapiPlugin } from 'fumadocs-openapi/server';
import { BookOpen, TerminalSquare } from 'lucide-react';
import React from 'react';
import { stringify } from 'yaml';
import {
	docsContentRoute,
	docsImageRoute,
	docsRoute,
	referenceContentRoute,
	referenceImageRoute,
	referenceRoute
} from './shared';

export const source = loader({
	baseUrl: docsRoute,
	i18n,
	source: docs.toFumadocsSource(),
	plugins: [lucideIconsPlugin()]
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

type JsonObject = Record<string, unknown>;

const openApiSpec = requireJsonObject(spec, 'OpenAPI document');

function jsonObject(value: unknown): JsonObject | undefined {
	return isJsonObject(value) ? value : undefined;
}

function requireJsonObject(value: unknown, label: string): JsonObject {
	const object = jsonObject(value);
	if (!object) throw new TypeError(`${label} must be a JSON object.`);
	return object;
}

function isJsonObject(value: unknown): value is JsonObject {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson<T>(value: T): T {
	return structuredClone(value);
}

function getJsonPointer(root: JsonObject, ref: string) {
	if (!ref.startsWith('#/')) return;
	let current: unknown = root;
	for (const segment of ref.slice(2).split('/')) {
		const object = jsonObject(current);
		if (!object) return;
		current = object[segment.replaceAll('~1', '/').replaceAll('~0', '~')];
	}
	return current;
}

function collectRefs(value: unknown, refs = new Set<string>()) {
	if (Array.isArray(value)) {
		for (const item of value) collectRefs(item, refs);
		return refs;
	}

	const object = jsonObject(value);
	if (!object) return refs;
	for (const [key, child] of Object.entries(object)) {
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
			const scheme = jsonObject(jsonObject(openApiSpec.components)?.securitySchemes)?.[schemeName];
			if (!scheme) continue;

			const securitySchemes = jsonObject(components.securitySchemes) ?? {};
			securitySchemes[schemeName] = cloneJson(scheme);
			components.securitySchemes = securitySchemes;
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
		if (value === undefined) continue;

		const categoryComponents = jsonObject(components[category]) ?? {};
		categoryComponents[name] = cloneJson(value);
		components[category] = categoryComponents;

		for (const nestedRef of collectRefs(value)) {
			if (!visited.has(nestedRef)) refs.add(nestedRef);
		}
	}

	return Object.keys(components).length > 0 ? components : undefined;
}

function findOperationForPage(page: (typeof source)['$inferPage']) {
	const operationId = page.path
		.split('/')
		.pop()
		?.replace(/\.mdx$/, '');
	if (!operationId) return;

	for (const [pathName, pathItemValue] of Object.entries(jsonObject(openApiSpec.paths) ?? {})) {
		const pathItem = jsonObject(pathItemValue);
		if (!pathItem) continue;
		for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']) {
			const operation = jsonObject(pathItem[method]);
			if (operation && operation.operationId === operationId) {
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
	const operationTags = Array.isArray(operation.tags)
		? operation.tags.filter((tag): tag is string => typeof tag === 'string')
		: null;
	if (operationTags && Array.isArray(openApiSpec.tags)) {
		routeSpec.tags = openApiSpec.tags.filter((tag) => {
			const name = jsonObject(tag)?.name;
			return typeof name === 'string' && operationTags.includes(name);
		});
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
