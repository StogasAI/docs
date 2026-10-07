'use client';

import { Schema } from './api/schema';
import { codeUsages } from '@/lib/openapi-code-usage';
import { createOpenAPIPageBase } from 'fumadocs-openapi/ui/base';
import type { OpenAPIPageProps_Spec } from 'fumadocs-openapi/ui';
import { apiShiki } from '@/lib/api-highlight';
import { OpenAPIRequestBody } from './openapi-request-body';
import { DefaultCollapsiblePanel } from 'fumadocs-openapi/ui/playground/client';
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

const Page = createOpenAPIPageBase({
	shiki: apiShiki,
	codeUsages,
	shikiOptions: { themes: codeThemes },
	generateTypeScriptDefinitions: false,
	components: { CodeBlock: OpenAPICodeBlock, SchemaUI: Schema },
	content: {
		renderOperationLayout: (slots) => (
			<div className="stogas-api-operation-layout">
				<div className="stogas-api-operation-main">
					{slots.header}
					<PlaygroundEndpoint />
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
	},
	playground: {
		enabled: true,
		renderBodyField: () => <OpenAPIRequestBody />,
		components: {
			CollapsiblePanel: (props) => (
				<DefaultCollapsiblePanel {...props} defaultOpen={props['data-type'] === 'body'} />
			)
		},
		fetchOptions: {
			requestTimeout: 45
		}
	}
});

export function OpenAPIPageClient(props: OpenAPIPageProps_Spec) {
	return <Page {...props} />;
}
