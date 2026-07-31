import { OpenAPIPageClient } from '@/components/openapi-page.client';
import { openapi } from '@/lib/openapi';
import type { OpenAPIPageProps_Spec } from 'fumadocs-openapi/ui';

type OpenAPIPageProps = Omit<OpenAPIPageProps_Spec, 'payload'> & {
	document: string;
};

export async function OpenAPIPage({ document, ...props }: OpenAPIPageProps) {
	const { bundled } = await openapi.getSchema(document);
	return <OpenAPIPageClient {...props} payload={{ bundled }} />;
}
