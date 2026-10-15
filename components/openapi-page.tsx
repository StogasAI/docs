import { OpenAPIPageClient } from '@/components/openapi-page.client';
import { openapi, scopeOpenApiDocument, type OpenAPIDocumentId } from '@/lib/openapi';
import type { OpenAPIPageProps_Spec } from 'fumadocs-openapi/ui';

type OpenAPIPageProps = Omit<OpenAPIPageProps_Spec, 'payload'> & {
	document: OpenAPIDocumentId;
};

export async function OpenAPIPage({ document, ...props }: OpenAPIPageProps) {
	const { bundled } = await openapi.getSchema(document);
	return (
		<OpenAPIPageClient
			{...props}
			payload={{
				bundled: scopeOpenApiDocument(bundled, props.operations ?? []) as typeof bundled
			}}
			// Browsers on other sites cannot call the dashboard API, so only gateway pages send requests.
			playground={document === 'stogas'}
		/>
	);
}
