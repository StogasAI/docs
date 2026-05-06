import { apiSource, getOpenApiJsonUrl, getPageMarkdownUrl, isOpenApiOperationPage, source } from '@/lib/source';

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

	urls.add(`${baseUrl}/`);
	urls.add(`${baseUrl}/docs`);
	urls.add(`${baseUrl}/llms.txt`);
	urls.add(`${baseUrl}/llms-full.txt`);
	urls.add(`${baseUrl}/openapi.json`);
	urls.add(`${baseUrl}/apis.json`);
	urls.add(`${baseUrl}/.well-known/api-catalog`);

	for (const page of [...source.getPages(), ...apiSource.getPages()]) {
		urls.add(`${baseUrl}${page.url}`);
		urls.add(`${baseUrl}${getPageMarkdownUrl(page).url}`);
		if (isOpenApiOperationPage(page)) urls.add(`${baseUrl}${getOpenApiJsonUrl(page).url}`);
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
