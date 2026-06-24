import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(docsRoot, '../..');
const openApiPath = path.join(docsRoot, 'content/openapi/stogas.json');
const catalogPath = path.join(
	repoRoot,
	'apps/api/transports/stogas/catalog/generated/catalog.json'
);

type JsonObject = Record<string, any>;

function readJson(pathname: string) {
	return JSON.parse(readFileSync(pathname, 'utf8')) as JsonObject;
}

function isObject(value: unknown): value is JsonObject {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function localSchemaName(ref: unknown) {
	const prefix = '#/components/schemas/';
	return typeof ref === 'string' && ref.startsWith(prefix) ? ref.slice(prefix.length) : null;
}

function hasStogasExtension(value: unknown): boolean {
	if (Array.isArray(value)) return value.some(hasStogasExtension);
	if (!isObject(value)) return false;
	return Object.keys(value).includes('x-stogas') || Object.values(value).some(hasStogasExtension);
}

function requestSchema(spec: JsonObject, operation: JsonObject) {
	const schemaRef =
		operation.requestBody?.content?.['application/json']?.schema?.$ref ??
		operation.requestBody?.content?.['application/json; charset=utf-8']?.schema?.$ref;
	const schemaName = localSchemaName(schemaRef);
	const schema = schemaName ? spec.components?.schemas?.[schemaName] : undefined;
	return isObject(schema) ? schema : undefined;
}

function jsonResponseSchemas(spec: JsonObject, operation: JsonObject) {
	const schemas: JsonObject[] = [];
	for (const response of Object.values(operation.responses ?? {})) {
		if (!isObject(response)) continue;
		const schemaRef = response.content?.['application/json']?.schema?.$ref;
		const schemaName = localSchemaName(schemaRef);
		const schema = schemaName ? spec.components?.schemas?.[schemaName] : undefined;
		if (isObject(schema)) schemas.push(schema);
	}
	return schemas;
}

function fail(errors: string[], message: string) {
	errors.push(message);
}

const spec = readJson(openApiPath);
const catalog = readJson(catalogPath);
const errors: string[] = [];

if (hasStogasExtension(spec)) {
	fail(errors, 'Public OpenAPI must not contain x-stogas extensions.');
}

for (const [routeId, route] of Object.entries(catalog.graph.providerEndpoints ?? {})) {
	if (!isObject(route)) continue;
	for (const stogasEndpointId of route.stogasEndpoints ?? []) {
		const stogasEndpoint = catalog.graph.stogasEndpoints?.[stogasEndpointId];
		if (!isObject(stogasEndpoint)) {
			fail(errors, `${routeId}: missing catalog stogas endpoint ${stogasEndpointId}`);
			continue;
		}
		const operation =
			spec.paths?.[stogasEndpoint.path]?.[String(stogasEndpoint.method ?? 'post').toLowerCase()];
		if (!isObject(operation)) {
			fail(
				errors,
				`${routeId}: docs OpenAPI is missing ${stogasEndpoint.method} ${stogasEndpoint.path}`
			);
			continue;
		}
		const request = requestSchema(spec, operation);
		if (!request) {
			fail(errors, `${routeId}: docs OpenAPI request body must reference a component schema`);
			continue;
		}
	}
}

const documentedMetadataFields = new Set<string>();
for (const pathItem of Object.values(spec.paths ?? {})) {
	if (!isObject(pathItem)) continue;
	for (const operation of Object.values(pathItem)) {
		if (!isObject(operation)) continue;
		for (const responseSchema of jsonResponseSchemas(spec, operation)) {
			const stogas = responseSchema.properties?.stogas;
			if (!isObject(stogas?.properties)) continue;
			for (const field of Object.keys(stogas.properties)) documentedMetadataFields.add(field);
		}
	}
}

for (const field of catalog.graph.stogas?.responseMetadataFields ?? []) {
	if (!documentedMetadataFields.has(field)) {
		fail(errors, `catalog response metadata field ${field} is missing from docs OpenAPI`);
	}
}

if (errors.length > 0) {
	throw new Error(`OpenAPI/catalog drift detected:\n- ${errors.join('\n- ')}`);
}

console.log('OpenAPI/catalog drift check passed.');
