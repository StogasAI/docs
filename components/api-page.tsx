import { APIPageClient } from '@/components/api-page.client';
import { openapi } from '@/lib/openapi';
import type { OpenAPIPageProps_Spec } from 'fumadocs-openapi/ui';

type APIPageProps = Omit<OpenAPIPageProps_Spec, 'payload'> & {
	document: string;
};

export async function APIPage({ document, ...props }: APIPageProps) {
	const { bundled } = await openapi.getSchema(document);
	return <APIPageClient {...props} payload={{ bundled }} />;
}
