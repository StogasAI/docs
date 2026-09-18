import { source } from '@/lib/source';
import { openGraphImage } from '@/lib/og-image';
import { notFound } from 'next/navigation';

export const revalidate = false;
export const dynamic = 'force-static';
export const dynamicParams = false;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
	const { slug } = await params;
	const page = source.getPage(slug.slice(0, -1));
	if (!page) notFound();

	return openGraphImage(page.data.title, page.data.description, 'Platform');
}

export function generateStaticParams() {
	return source.getPages().map((page) => ({
		slug: page.slugs.concat('image.png')
	}));
}
