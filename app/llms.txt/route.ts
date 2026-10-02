import { getMessage as t } from '@/lib/i18n';
import { messages } from '@/lib/messages';
import { apiSource, getPageMarkdownUrl, source } from '@/lib/source';

export const revalidate = false;
export const dynamic = 'force-static';

export function GET() {
	const entries = (pages: ReturnType<typeof source.getPages>) =>
		pages
			.map((page) => {
				const description = page.data.description ? `: ${page.data.description}` : '';
				return `- [${page.data.title}](https://stogas.ai${getPageMarkdownUrl(page).url})${description}`;
			})
			.join('\n');

	return new Response(
		`# ${t(messages.documentation)}

> ${t(messages.llmsSummary)}

${t(messages.llmsAccess)}

## ${t(messages.platform)}

${entries(source.getPages())}

## ${t(messages.llmsApiReference)}

${entries(apiSource.getPages())}

## ${t(messages.machineResources)}

- [${t(messages.openapiSpecification)}](https://stogas.ai/openapi.json): ${t(messages.openapiDescription)}
- [${t(messages.apiCatalog)}](https://stogas.ai/.well-known/api-catalog): ${t(messages.apiCatalogDescription)}
- [${t(messages.allDocumentation)}](https://stogas.ai/llms-full.txt): ${t(messages.allDocumentationDescription)}
`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
	);
}
