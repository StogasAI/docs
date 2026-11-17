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
import { useStogasOrigin } from './stogas-link';
import { useMemo } from 'react';

const PRODUCTION_API = 'https://api.stogas.ai';

function PlaygroundEndpoint() {
	const t = useTranslations();
	const origin = useStogasOrigin('api');
	return (
		<p className="text-fd-muted-foreground mb-3 text-sm">
			{t(messages.apiPlaygroundEndpoint, { variables: { origin } })}
		</p>
	);
}

/**
 * The document with the gateway of the page's own environment as its server, so that the
 * playground and the request samples of staging Docs call the staging gateway.
 */
function withServer<Payload extends OpenAPIPageProps_Spec['payload']>(
	payload: Payload,
	origin: string
): Payload {
	if (origin === PRODUCTION_API) return payload;
	return JSON.parse(JSON.stringify(payload).replaceAll(PRODUCTION_API, origin)) as Payload;
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
	const origin = useStogasOrigin('api');
	const payload = useMemo(() => withServer(props.payload, origin), [props.payload, origin]);
	// The playground reads its server once, so a page that learns its environment starts again.
	return <Page key={origin} {...props} payload={payload} />;
}
