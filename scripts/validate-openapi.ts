import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors: string[] = [];
const spec = readDocument('stogas.json');
readDocument('dashboard.json');

for (const pathname of ['/v1/chat/completions', '/v1/responses', '/v1/catalog', '/v1/models']) {
	if (!jsonObject(spec.paths)?.[pathname]) errors.push(`OpenAPI is missing ${pathname}.`);
}
const catalog = jsonObject(
	getJsonValue(
		spec,
		'paths',
		'/v1/catalog',
		'get',
		'responses',
		'200',
		'content',
		'application/json',
		'examples',
		'catalog',
		'value'
	)
);
const catalogSchema = getJsonValue(
	spec,
	'components',
	'schemas',
	'CatalogResponse',
	'properties',
	'schema',
	'const'
);
if (catalog?.schema !== catalogSchema) {
	errors.push(`/v1/catalog example must use ${String(catalogSchema)}.`);
}
if (
	catalog &&
	(typeof catalog.runtimeDigest !== 'string' ||
		typeof catalog.publicDigest !== 'string' ||
		!Number.isSafeInteger(catalog.sequence) ||
		!jsonObject(catalog.graph)?.routes ||
		!Array.isArray(catalog.schedule) ||
		!Array.isArray(catalog.periods))
) {
	errors.push(
		'/v1/catalog example must expose sequence, runtime/public digests, the graph, schedule and periods.'
	);
}
if (errors.length) throw new Error(`OpenAPI validation failed:\n- ${errors.join('\n- ')}`);
console.log('OpenAPI validation passed.');

function readDocument(name: string) {
	const document = jsonObject(
		JSON.parse(readFileSync(path.join(docsRoot, 'content/openapi', name), 'utf8'))
	);
	if (!document) throw new TypeError(`${name} must be a JSON object.`);
	if (containsPrivateExtension(document)) {
		errors.push(`${name} must not contain x-stogas extensions.`);
	}
	return document;
}

function containsPrivateExtension(value: unknown): boolean {
	if (Array.isArray(value)) return value.some(containsPrivateExtension);
	if (!isJsonObject(value)) return false;
	return Object.hasOwn(value, 'x-stogas') || Object.values(value).some(containsPrivateExtension);
}

function jsonObject(value: unknown): Record<string, unknown> | undefined {
	return isJsonObject(value) ? value : undefined;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getJsonValue(root: Record<string, unknown>, ...path: string[]): unknown {
	let value: unknown = root;
	for (const segment of path) {
		value = jsonObject(value)?.[segment];
		if (value === undefined) return;
	}
	return value;
}
