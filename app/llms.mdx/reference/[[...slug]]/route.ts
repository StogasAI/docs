import {
	apiSource,
	getLLMText,
	getOpenApiOperationSpec,
	getOpenApiJsonUrl,
	getPageMarkdownUrl,
	isOpenApiOperationPage
} from '@/lib/source';
import { notFound } from 'next/navigation';

export const revalidate = false;
export const dynamic = 'force-static';

export async function GET(
	_req: Request,
	{ params }: RouteContext<'/llms.mdx/reference/[[...slug]]'>
) {
	const { slug } = await params;
	const format = slug?.at(-1) ?? 'content.md';
	const page = apiSource.getPage(slug?.slice(0, -1));
	if (!page) notFound();

	const operationSpec = format === 'openapi.json' ? getOpenApiOperationSpec(page) : undefined;
	if (format !== 'content.md' && !operationSpec) notFound();
	return new Response(
		operationSpec ? JSON.stringify(operationSpec, null, '\t') : await getLLMText(page),
		{
			headers: {
				'Content-Type': operationSpec ? 'application/json' : 'text/markdown; charset=utf-8'
			}
		}
	);
}

export function generateStaticParams() {
	return apiSource.getPages().flatMap((page) => {
		const params = [
			{
				lang: page.locale,
				slug: getPageMarkdownUrl(page).segments
			}
		];

		if (isOpenApiOperationPage(page)) {
			params.push({
				lang: page.locale,
				slug: getOpenApiJsonUrl(page).segments
			});
		}

		return params;
	});
}
