import { source } from '@/lib/source';
import { notFound } from 'next/navigation';

export const revalidate = false;
export const dynamic = 'force-static';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  return new Response('OG Image Placeholder', {
    headers: { 'content-type': 'text/plain' },
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    slug: page.slugs.concat('image.png'),
  }));
}
