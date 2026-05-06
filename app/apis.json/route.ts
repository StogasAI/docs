import spec from '@/content/openapi/stogas.json';

export const revalidate = false;
export const dynamic = 'force-static';

export function GET() {
	const info = spec.info;
	const buildDate = new Date().toISOString().slice(0, 10);
	const catalog = {
		name: 'Stogas.ai APIs',
		description: info.description,
		url: 'https://stogas.ai/apis.json',
		specificationVersion: '0.19',
		created: '2026-05-05',
		modified: buildDate,
		apis: [
			{
				name: info.title,
				description: info.description,
				humanURL: 'https://stogas.ai/docs/reference',
				baseURL: 'https://api.stogas.ai',
				version: info.version,
				tags: ['AI gateway', 'OpenAI-compatible', 'OpenAPI'],
				properties: [
					{
						type: 'OpenAPI',
						url: 'https://stogas.ai/openapi.json'
					},
					{
						type: 'Documentation',
						url: 'https://stogas.ai/docs/reference'
					},
					{
						type: 'LLMs',
						url: 'https://stogas.ai/llms.txt'
					}
				]
			}
		]
	};

	return new Response(JSON.stringify(catalog, null, '\t'), {
		headers: {
			'Content-Type': 'application/json',
			Link: '<https://stogas.ai/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json;version=3.1", <https://stogas.ai/docs/reference>; rel="service-doc"; type="text/html"'
		}
	});
}
