import schema from '@/content/schemas/policy-v1.json';

export const revalidate = false;
export const dynamic = 'force-static';

export function GET() {
	return Response.json(schema, {
		headers: {
			'Cache-Control': 'public, max-age=3600, immutable',
			'Content-Type': 'application/schema+json'
		}
	});
}
