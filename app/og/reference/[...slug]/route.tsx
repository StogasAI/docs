import { openGraphImage } from '@/lib/og-image';
import { apiSource } from '@/lib/source';
import { notFound } from 'next/navigation';

export const revalidate = false;
export const dynamic = 'force-static';
export const dynamicParams = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/reference/[...slug]'>) {
	const { slug } = await params;
	const page = apiSource.getPage(slug.slice(0, -1));
	if (!page) notFound();

	return openGraphImage(page.data.title, page.data.description, 'API Reference');
}

export function generateStaticParams() {
	return apiSource.getPages().map((page) => ({
		slug: page.slugs.concat('image.png')
	}));
}
