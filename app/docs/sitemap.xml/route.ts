import { apiSource, source } from '@/lib/source';

export const revalidate = false;
export const dynamic = 'force-static';

const baseUrl = 'https://stogas.ai';

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export function GET() {
	const urls = new Set<string>();

	urls.add(`${baseUrl}/docs`);

	for (const page of [...source.getPages(), ...apiSource.getPages()]) {
		urls.add(`${baseUrl}${page.url}`);
	}

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls)
	.map((url) => `	<url><loc>${escapeXml(url)}</loc></url>`)
	.join('\n')}
</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8'
		}
	});
}
