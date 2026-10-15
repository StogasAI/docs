import dashboard from '@/content/openapi/dashboard.json';
import stogas from '@/content/openapi/stogas.json';
import { createOpenAPI, type OpenAPIOptions } from 'fumadocs-openapi/server';

type SchemaInput = Exclude<NonNullable<OpenAPIOptions['input']>, string[]>[string];
type SchemaDocument = Exclude<SchemaInput, string | (() => unknown)>;
type JsonObject = Record<string, unknown>;

function asSchemaDocument(value: unknown): SchemaDocument {
	if (
		value === null ||
		typeof value !== 'object' ||
		!('openapi' in value) ||
		typeof value.openapi !== 'string' ||
		!value.openapi.startsWith('3.') ||
		!('info' in value) ||
		!('paths' in value)
	) {
		throw new TypeError('A bundled OpenAPI document is invalid.');
	}

	// Fumadocs currently narrows in-memory documents to its latest OpenAPI type even
	// though its loader supports earlier OpenAPI 3.x documents.
	return value as SchemaDocument;
}

/** The gateway API, whose pages have a playground, and the dashboard API that access tokens call. */
export const openapiDocuments = {
	stogas: asSchemaDocument(stogas),
	dashboard: asSchemaDocument(dashboard)
};

export type OpenAPIDocumentId = keyof typeof openapiDocuments;

export const openapi = createOpenAPI({ input: openapiDocuments });

function jsonObject(value: unknown): JsonObject | undefined {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as JsonObject)
		: undefined;
}

/**
 * Returns a copy of a document with only the given operations and the tags, security schemes and
 * components that they use. Each page carries this instead of the whole document.
 */
export function scopeOpenApiDocument(
	document: object,
	operations: readonly { path: string; method: string }[]
): JsonObject {
	const { paths, components, tags, ...rest } = document as JsonObject;
	const scopedPaths: Record<string, JsonObject> = {};
	const tagNames = new Set<unknown>();
	const used: Record<string, JsonObject> = {};

	function add(category: string, name: string) {
		const definitions = jsonObject(jsonObject(components)?.[category]);
		if (!definitions || !Object.hasOwn(definitions, name)) {
			throw new Error(`OpenAPI has no component ${category}/${name}.`);
		}
		if (used[category] && Object.hasOwn(used[category], name)) return;
		(used[category] ??= {})[name] = definitions[name];
		visit(definitions[name]);
	}

	function visit(value: unknown) {
		if (Array.isArray(value)) return value.forEach(visit);
		for (const [key, child] of Object.entries(jsonObject(value) ?? {})) {
			if (key !== '$ref' || typeof child !== 'string') visit(child);
			else {
				const [, category, name] = child.match(/^#\/components\/([^/]+)\/([^/]+)$/) ?? [];
				if (!category || !name) throw new Error(`OpenAPI reference ${child} is not a component.`);
				add(category, name.replaceAll('~1', '/').replaceAll('~0', '~'));
			}
		}
	}

	for (const { path, method } of operations) {
		const pathItem = jsonObject(jsonObject(paths)?.[path]);
		const operation = jsonObject(pathItem?.[method]);
		if (!pathItem || !operation) throw new Error(`OpenAPI has no operation ${method} ${path}.`);
		const scoped = (scopedPaths[path] ??= pathItem.parameters
			? { parameters: pathItem.parameters }
			: {});
		scoped[method] = operation;
		for (const tag of Array.isArray(operation.tags) ? operation.tags : []) tagNames.add(tag);
		const security = operation.security ?? rest.security;
		for (const requirement of Array.isArray(security) ? security : []) {
			for (const name of Object.keys(requirement)) add('securitySchemes', name);
		}
	}
	visit(scopedPaths);

	return structuredClone({
		...rest,
		...(Array.isArray(tags)
			? { tags: tags.filter((tag) => tagNames.has(jsonObject(tag)?.name)) }
			: {}),
		paths: scopedPaths,
		...(Object.keys(used).length > 0 ? { components: used } : {})
	});
}
