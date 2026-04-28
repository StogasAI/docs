import { getPageImage, getPageMarkdownUrl, source, apiSource } from '@/lib/source';
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
	MarkdownCopyButton,
	ViewOptionsPopover
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig, referenceRoute } from '@/lib/shared';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
	const params = await props.params;
	const isReference = params.slug?.[0] === 'reference';

	const loader = isReference ? apiSource : source;
	const slug = isReference ? params.slug?.slice(1) : params.slug;

	const page = loader.getPage(slug);
	if (!page) notFound();

	const MDX = page.data.body;
	const markdownUrl = getPageMarkdownUrl(page).url;

	return (
		<DocsPage toc={page.data.toc} full={page.data.full} footer={{ className: 'mt-14' }}>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription className="mb-0">{page.data.description}</DocsDescription>
			{!(page.data as any)._openapi && (
				<div className="flex flex-row items-center gap-2 border-b pb-6">
					<MarkdownCopyButton markdownUrl={markdownUrl} />
					<ViewOptionsPopover
						markdownUrl={markdownUrl}
						githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/${isReference ? 'reference' : 'docs'}/${page.path}`}
					/>
				</div>
			)}
			<DocsBody>
				<MDX
					components={getMDXComponents({
						// this allows you to link to other pages with relative file paths
						a: createRelativeLink(loader, page)
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
		openGraph: {
			images: getPageImage(page).url
		}
	};
}
