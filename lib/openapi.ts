import spec from '@/content/openapi/stogas.json';
import { createOpenAPI, type OpenAPIOptions } from 'fumadocs-openapi/server';

type SchemaInput = Exclude<NonNullable<OpenAPIOptions['input']>, string[]>[string];
type SchemaDocument = Exclude<SchemaInput, string | (() => unknown)>;

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
		throw new TypeError('The bundled Stogas OpenAPI document is invalid.');
	}

	// Fumadocs currently narrows in-memory documents to its latest OpenAPI type even
	// though its loader supports earlier OpenAPI 3.x documents.
	return value as SchemaDocument;
}

export const openapi = createOpenAPI({
	input: {
		stogas: asSchemaDocument(spec)
	}
});
