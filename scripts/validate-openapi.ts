import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spec = jsonObject(
	JSON.parse(readFileSync(path.join(docsRoot, 'content/openapi/stogas.json'), 'utf8'))
);
if (!spec) throw new TypeError('OpenAPI document must be a JSON object.');
const errors: string[] = [];

if (containsPrivateExtension(spec)) {
	errors.push('Public OpenAPI must not contain x-stogas extensions.');
}
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
if (catalog?.schema !== 'stogas.gateway.catalog.v1') {
	errors.push('/v1/catalog example must use stogas.gateway.catalog.v1.');
}
if (
	catalog &&
	(typeof catalog.runtimeDigest !== 'string' ||
		typeof catalog.publicDigest !== 'string' ||
		!Number.isSafeInteger(catalog.sequence) ||
		!jsonObject(catalog.graph)?.routes)
) {
	errors.push(
		'/v1/catalog example must expose sequence, runtime/public digests, and the five-node graph.'
	);
}
if (errors.length) throw new Error(`OpenAPI validation failed:\n- ${errors.join('\n- ')}`);
console.log('OpenAPI validation passed.');

function containsPrivateExtension(value: unknown): boolean {
	if (Array.isArray(value)) return value.some(containsPrivateExtension);
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	return Object.hasOwn(record, 'x-stogas') || Object.values(record).some(containsPrivateExtension);
}

function jsonObject(value: unknown): Record<string, unknown> | undefined {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

function getJsonValue(root: Record<string, unknown>, ...path: string[]): unknown {
	let value: unknown = root;
	for (const segment of path) {
		value = jsonObject(value)?.[segment];
		if (value === undefined) return;
	}
	return value;
}
