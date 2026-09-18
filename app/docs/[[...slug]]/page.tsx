import {
	getOpenApiJsonUrl,
	getPageImage,
	getPageMarkdownUrl,
	isOpenApiOperationPage,
	source,
	apiSource
} from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { MarkdownCopyButton } from '@/components/markdown-copy-button';
import { OpenApiViewOptionsPopover } from '@/components/openapi-view-options-popover';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { StogasLink } from '@/components/stogas-link';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/shared';
export const dynamic = 'force-static';
export const dynamicParams = false;

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
	const params = await props.params;
	const isReference = params.slug?.[0] === 'reference';

	const loader = isReference ? apiSource : source;
	const slug = isReference ? params.slug?.slice(1) : params.slug;

	const page = loader.getPage(slug);
	if (!page) notFound();

	const MDX = page.data.body;
	const markdownUrl = getPageMarkdownUrl(page).url;
	const isOpenApiOperation = isOpenApiOperationPage(page);
	const jsonUrl = isOpenApiOperation ? getOpenApiJsonUrl(page).url : undefined;
	const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/${isOpenApiOperation ? 'openapi/stogas.json' : `${isReference ? 'reference' : 'docs'}/${page.path}`}`;

	return (
		<DocsPage
			tabIndex={-1}
			toc={page.data.toc}
			full={page.data.full}
			footer={{ className: 'mt-14' }}
		>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'TechArticle',
						headline: page.data.title,
						description: page.data.description,
						url: new URL(page.url, 'https://stogas.ai').href,
						inLanguage: 'en',
						isPartOf: {
							'@type': 'WebSite',
							name: 'Stogas documentation',
							url: 'https://stogas.ai/docs'
						},
						publisher: {
							'@type': 'Organization',
							name: 'Stogas',
							url: 'https://stogas.ai',
							sameAs: ['https://github.com/StogasAI']
						}
					}).replaceAll('<', '\\u003c')
				}}
			/>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription className="mb-0">{page.data.description}</DocsDescription>
			<div className="flex flex-wrap items-center gap-2 pb-4">
				<MarkdownCopyButton markdownUrl={markdownUrl} />
				<OpenApiViewOptionsPopover
					markdownUrl={markdownUrl}
					jsonUrl={jsonUrl}
					githubUrl={githubUrl}
				/>
			</div>
			<DocsBody>
				<MDX
					components={getMDXComponents({
						// this allows you to link to other pages with relative file paths
						a: createRelativeLink(loader, page, StogasLink)
					})}
				/>
			</DocsBody>
		</DocsPage>
	);
}

export async function generateStaticParams() {
	return [
		...source.generateParams(),
		...apiSource.generateParams().map((p) => ({ slug: ['reference', ...p.slug] }))
	];
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
	const params = await props.params;
	const isReference = params.slug?.[0] === 'reference';

	const loader = isReference ? apiSource : source;
	const slug = isReference ? params.slug?.slice(1) : params.slug;

	const page = loader.getPage(slug);
	if (!page) notFound();

	return {
		title: page.data.title,
		description: page.data.description,
		alternates: {
			canonical: page.url,
			types: { 'text/markdown': getPageMarkdownUrl(page).url }
		},
		openGraph: {
			title: page.data.title,
			description: page.data.description,
			url: page.url,
			type: 'article',
			images: getPageImage(page).url
		}
	};
}
