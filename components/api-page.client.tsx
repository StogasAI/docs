'use client';

import { codeUsages } from '@/lib/openapi-code-usage';
import { createOpenAPIPage, type OpenAPIPageProps_Spec } from 'fumadocs-openapi/ui';
import { StyleInjector } from './style-injector';

const OpenAPIPage = createOpenAPIPage({
	codeUsages,
	generateTypeScriptDefinitions: false,
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
		fetchOptions: {
			requestTimeout: 45
		}
	}
});

export function APIPageClient(props: OpenAPIPageProps_Spec) {
	return (
		<>
			<StyleInjector />
			<OpenAPIPage {...props} />
		</>
	);
}
