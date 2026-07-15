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
			}
		]
	};

	return new Response(JSON.stringify(catalog, null, '\t'), {
		headers: {
			'Content-Type': 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
			Link: '<https://stogas.ai/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"'
		}
	});
}
