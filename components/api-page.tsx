import client from '@/components/api-page.client';
import { codeUsages } from '@/lib/openapi-code-usage';
import { openapi } from '@/lib/openapi';
import { createAPIPage } from 'fumadocs-openapi/ui';
import { StyleInjector } from './style-injector';

const BaseAPIPage = createAPIPage(openapi, {
	client,
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
		enabled: true
	}
});

export function APIPage(props: any) {
	return (
		<>
			<StyleInjector />
			<BaseAPIPage {...props} />
		</>
	);
}
