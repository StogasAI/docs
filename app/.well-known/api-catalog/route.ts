export const revalidate = false;
export const dynamic = 'force-static';

export function GET() {
	const catalog = {
		linkset: [
			{
				anchor: 'https://api.stogas.ai',
				'service-desc': [
					{
						href: 'https://stogas.ai/openapi.json',
						type: 'application/vnd.oai.openapi+json;version=3.1'
					}
				],
				'service-doc': [
					{
						href: 'https://stogas.ai/docs/reference',
						type: 'text/html'
					}
				],
				'service-meta': [
					{
						href: 'https://stogas.ai/apis.json',
						type: 'application/json'
					},
					{
						href: 'https://stogas.ai/llms.txt',
						type: 'text/plain'
					}
				]
			},
			{
				anchor: 'https://app.stogas.ai/api',
				'service-desc': [
					{
						href: 'https://stogas.ai/dashboard-openapi.json',
						type: 'application/vnd.oai.openapi+json;version=3.1'
					}
				],
				'service-doc': [
					{
						href: 'https://stogas.ai/docs/reference/dashboard',
						type: 'text/html'
					}
				],
				'service-meta': [
					{
						href: 'https://stogas.ai/apis.json',
						type: 'application/json'
					},
					{
						href: 'https://stogas.ai/llms.txt',
						type: 'text/plain'
					}
				]
			}
		]
	};

	return new Response(JSON.stringify(catalog, null, '\t'));
}
