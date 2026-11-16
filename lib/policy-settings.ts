// Each value inside an export or redaction plugin also takes an encrypted envelope, the last form
// of its anyOf, which Customer encryption documents. The reference shows only the settings.
export function withoutEnvelopes(schema: unknown): unknown {
	if (Array.isArray(schema)) return schema.map(withoutEnvelopes);
	if (!schema || typeof schema !== 'object') return schema;
	const { anyOf, ...rest } = schema as Record<string, unknown>;
	if (Array.isArray(anyOf) && anyOf.length === 2 && isEnvelope(anyOf[1]))
		return { ...(withoutEnvelopes(anyOf[0]) as object), ...(withoutEnvelopes(rest) as object) };
	return Object.fromEntries(
		Object.entries(schema).map(([key, value]) => [key, withoutEnvelopes(value)])
	);
}

function isEnvelope(schema: unknown): boolean {
	const properties = (schema as { properties?: object } | null)?.properties;
	return !!properties && Object.keys(properties).length === 1 && 'encrypted' in properties;
}
