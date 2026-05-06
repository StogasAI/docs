import { apiSource, source } from '@/lib/source';

export const revalidate = false;
export const dynamic = 'force-static';

export function GET() {
	const pages = [...source.getPages(), ...apiSource.getPages()];
	const entries = pages.map((page) => {
		const description = page.data.description ? `: ${page.data.description}` : '';
		return `- [${page.data.title}](${page.url})${description}`;
	});

	return new Response(`# Stogas.ai Docs\n\n${entries.join('\n')}`);
}
