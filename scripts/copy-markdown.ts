// Serves each page's Markdown at the page's URL with `.md` added, as llms.txt proposes. A static
// export cannot rewrite those URLs to the export routes, so this copies each export there after
// `next build`; the dev server rewrites them instead (next.config.mjs).
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { docsContentRoute, docsRoute, referenceContentRoute, referenceRoute } from '../lib/shared';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
let copied = 0;
for (const [exports, pages] of [
	[docsContentRoute, docsRoute],
	[referenceContentRoute, referenceRoute]
]) {
	const root = join(out, exports);
	for (const file of readdirSync(root, { recursive: true, encoding: 'utf8' })) {
		if (basename(file) !== 'content.md') continue;
		const slug = dirname(file);
		const target = join(out, slug === '.' ? `${pages}.md` : `${pages}/${slug}.md`);
		mkdirSync(dirname(target), { recursive: true });
		copyFileSync(join(root, file), target);
		copied++;
	}
}
if (copied === 0) throw new Error(`${out} holds no Markdown exports. Run next build first.`);
console.log(`Copied ${copied} Markdown exports to their .md URLs.`);
