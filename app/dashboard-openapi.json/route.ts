import spec from '@/content/openapi/dashboard.json';

export const revalidate = false;
export const dynamic = 'force-static';

export function GET() {
	return new Response(JSON.stringify(spec, null, '\t'));
}
