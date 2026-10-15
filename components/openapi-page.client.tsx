'use client';

import { Schema } from './api/schema';
import { codeUsages } from '@/lib/openapi-code-usage';
import { createOpenAPIPageBase } from 'fumadocs-openapi/ui/base';
import type { OpenAPIPageProps_Spec } from 'fumadocs-openapi/ui';
import { apiShiki } from '@/lib/api-highlight';
import { OpenAPIRequestBody } from './openapi-request-body';
import { codeThemes } from '@/lib/highlight';
import { OpenAPICodeBlock } from './openapi-code-block';
import { useTranslations } from '@fuma-translate/react';
import { messages } from '@/lib/messages';

function PlaygroundEndpoint() {
	const t = useTranslations();
	return (
		<p className="text-fd-muted-foreground mb-3 text-sm">{t(messages.apiPlaygroundEndpoint)}</p>
	);
}

const options = {
	shiki: apiShiki,
	codeUsages,
	shikiOptions: { themes: codeThemes },
	generateTypeScriptDefinitions: false,
	components: { CodeBlock: OpenAPICodeBlock, SchemaUI: Schema },
	content: {
		renderOperationLayout: (slots, { ctx }) => (
			<div className="stogas-api-operation-layout">
				<div className="stogas-api-operation-main">
					{slots.header}
					{ctx.playground?.enabled !== false && <PlaygroundEndpoint />}
					{slots.apiPlayground}
					{slots.description}
					{slots.authSchemes}
					{slots.parameters}
					{slots.body}
					{slots.responses}
					{slots.callbacks}
				</div>
				<div className="stogas-api-operation-examples">{slots.apiExample}</div>
			</div>
		)
	}
} satisfies Parameters<typeof createOpenAPIPageBase>[0];

const PlaygroundPage = createOpenAPIPageBase({
	...options,
	playground: {
		enabled: true,
		renderBodyField: () => <OpenAPIRequestBody />,
		fetchOptions: {
			requestTimeout: 45
		}
	}
});

// Without a playground, the page shows the method and path where the playground would be.
const ReferencePage = createOpenAPIPageBase({ ...options, playground: { enabled: false } });

export function OpenAPIPageClient({
	playground,
	...props
}: OpenAPIPageProps_Spec & { playground: boolean }) {
	const Page = playground ? PlaygroundPage : ReferencePage;
	return <Page {...props} />;
}
