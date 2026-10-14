'use client';
import { useMemo } from 'react';
import { useTranslations } from '@fuma-translate/react';
import { SchemaUI, type SchemaUIProps } from './client';
import { type GenerateSchemaUIOptions, generateSchemaUI } from '@fumadocs/json-schema/react';

export { SchemaUI, type SchemaUIProps } from './client';

export interface SchemaUIOptions extends Omit<GenerateSchemaUIOptions, 'translations'> {
	client: Omit<SchemaUIProps, 'generated'>;
}

export function Schema({ client, ...options }: SchemaUIOptions) {
	const translations = useTranslations().translations;
	const generated = useMemo(
		() => generateSchemaUI({ ...options, translations }),
		// the options object is new on every render, so the memo is keyed by its fields
		[
			options.root,
			options.readOnly,
			options.writeOnly,
			options.showExample,
			options.renderMarkdown,
			options.renderCodeblock,
			translations
		]
	);

	return <SchemaUI {...client} generated={generated} />;
}
