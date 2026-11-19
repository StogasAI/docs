import { expect, test } from '@playwright/test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join(__dirname, '../out');

// Website pages that Docs links to. Web serves them on the same host, so the build does not hold
// them.
const WEBSITE_PATHS = new Set([
	'/catalog',
	'/locations/apac',
	'/locations/eu',
	'/notices',
	'/tos',
	'/trust'
]);

const ENTITIES: Record<string, string> = {
	'&quot;': '"',
	'&#x27;': "'",
	'&#39;': "'",
	'&lt;': '<',
	'&gt;': '>',
	'&amp;': '&'
};
const decode = (value: string) =>
	value.replace(/&(?:quot|#x27|#39|lt|gt|amp);/g, (entity) => ENTITIES[entity]);

test('every link between built pages reaches a page and the fragment it names', () => {
	const pages = new Map<string, { html: string; ids: Set<string> }>();
	for (const file of readdirSync(out, { recursive: true, encoding: 'utf8' })) {
		if (!file.endsWith('.html')) continue;
		const html = readFileSync(join(out, file), 'utf8');
		const ids = new Set(Array.from(html.matchAll(/\sid="([^"]*)"/g), (m) => decode(m[1])));
		pages.set(`/${file.replace(/\.html$/, '').replace(/(^|\/)index$/, '')}`, { html, ids });
	}
	expect(pages.size).toBeGreaterThan(100);
	const broken = new Map<string, Set<string>>();
	let checked = 0;
	for (const [path, { html }] of pages) {
		if (!path.startsWith('/docs')) continue;
		for (const match of html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)) {
			const url = new URL(decode(match[1]), `https://stogas.ai${path}`);
			if (url.origin !== 'https://stogas.ai') continue;
			const target = url.pathname.replace(/(.)\/$/, '$1');
			checked++;
			const page = pages.get(target);
			const id = decodeURIComponent(url.hash.slice(1));
			const problem = page
				? id && !page.ids.has(id) && `${target}#${id} has no element with that id`
				: !existsSync(join(out, target)) && !WEBSITE_PATHS.has(target) && `${target} is not a page`;
			if (problem) broken.set(problem, (broken.get(problem) ?? new Set()).add(path));
		}
	}
	expect(checked).toBeGreaterThan(5000);
	expect(
		Array.from(broken, ([problem, from]) => `${problem}, linked from ${[...from].join(', ')}`)
	).toEqual([]);
});

test('every prefetch file loads at the name Next requests, without a redirect', async ({
	request
}) => {
	// Next names a page's prefetch file with "$", and public/_redirects serves that name.
	const files = readdirSync(out, { recursive: true, encoding: 'utf8' }).filter((file) =>
		file.includes('$')
	);
	expect(files.length).toBeGreaterThan(100);
	for (const file of files) {
		const response = await request.get(`/${file}`, { maxRedirects: 0 });
		expect(response.status(), file).toBe(200);
	}
});
