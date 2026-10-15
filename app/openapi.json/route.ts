import spec from '@/content/openapi/stogas.json';

export const revalidate = false;
export const dynamic = 'force-static';

export function GET() {
	return new Response(JSON.stringify(spec, null, '\t'));
}
