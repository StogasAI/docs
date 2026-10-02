import { expect, test } from '@playwright/test';
import { generateSchemaUI } from '@fumadocs/json-schema/react';
import type { JsonSchema } from '@fumadocs/json-schema';

function render(root: JsonSchema) {
	const generated = generateSchemaUI({
		root,
		renderMarkdown: (text) => text,
		renderCodeblock: ({ code }) => code
	});
	return generated.refs[generated.$root];
}

test('literal types remain clear without hiding distinct defaults or enum choices', () => {
	for (const value of [false, 0, '', null]) {
		for (const literal of [{ const: value }, { enum: [value] }]) {
			const field = render({ ...literal, default: value });
			expect(field.aliasName).toBe(JSON.stringify(value));
			expect(field.infoTags).toEqual([]);
		}
	}
	expect(render({ type: 'boolean', default: false }).infoTags).toEqual([
		{ label: 'Default', value: 'false' }
	]);
	expect(render({ type: 'string', enum: ['a', 'b'], default: 'a' }).infoTags).toEqual([
		{ label: 'Default', value: '"a"' },
		{ label: 'Value in', list: ['"a"', '"b"'] }
	]);
});
