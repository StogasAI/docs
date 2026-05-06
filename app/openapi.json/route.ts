import spec from '@/content/openapi/stogas.json';

export const revalidate = false;
export const dynamic = 'force-static';

export function GET() {
	return new Response(JSON.stringify(spec, null, '\t'), {
		headers: {
			'Content-Type': 'application/vnd.oai.openapi+json;version=3.1',
			Link: '<https://stogas.ai/docs/reference>; rel="service-doc"; type="text/html", <https://stogas.ai/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"'
		}
	});
}
