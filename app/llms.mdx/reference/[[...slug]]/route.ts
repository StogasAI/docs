import {
	apiSource,
	getLLMContentType,
	getLLMText,
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

	return new Response(await getLLMText(page), {
		headers: {
			'Content-Type': getLLMContentType(page, format)
		}
	});
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
