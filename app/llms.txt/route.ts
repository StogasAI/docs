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
		`# Stogas documentation

> Stogas is a verifiable, OpenAI-compatible AI gateway. Use it to access models through one API, manage access and spending, and verify the software serving requests.

Inference requests use https://api.stogas.ai and a bearer API key from https://app.stogas.ai. The model and catalog endpoints are public. Existing OpenAI clients work with Stogas; verification and encrypted requests use the Stogas SDKs.

## Platform

${entries(source.getPages())}

## API reference

${entries(apiSource.getPages())}

## Machine-readable resources

- [OpenAPI specification](https://stogas.ai/openapi.json): Complete API contract. Each operation's Markdown page includes its scoped OpenAPI YAML.
- [API catalog](https://stogas.ai/.well-known/api-catalog): API and documentation discovery.
- [All documentation](https://stogas.ai/llms-full.txt): Complete Markdown text in one file.
`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
	);
}
