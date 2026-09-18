'use client';

import { codeUsages } from '@/lib/openapi-code-usage';
import { createOpenAPIPage, type OpenAPIPageProps_Spec } from 'fumadocs-openapi/ui';
import { OpenAPIRequestBody } from './openapi-request-body';
import { DefaultCollapsiblePanel } from 'fumadocs-openapi/playground/client';
import { codeThemes } from '@/lib/highlight';
import { OpenAPICodeBlock } from './openapi-code-block';

const Page = createOpenAPIPage({
	codeUsages,
	shikiOptions: { themes: codeThemes },
	generateTypeScriptDefinitions: false,
	components: { CodeBlock: OpenAPICodeBlock },
	content: {
		renderOperationLayout: (slots) => (
			<div className="stogas-api-operation-layout">
				<div className="stogas-api-operation-main">
					{slots.header}
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
