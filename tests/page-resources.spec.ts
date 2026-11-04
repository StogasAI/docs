import { expect, test } from '@playwright/test';
import { parse } from 'yaml';
import dashboard from '../content/openapi/dashboard.json';
import stogas from '../content/openapi/stogas.json';

function parseMarkdown(text: string) {
	const match = text.match(/^---\n([\s\S]+?)\n---\n\n# (.+)\n/);
	expect(match, 'Markdown has metadata and a title').not.toBeNull();
	const metadata = parse(match![1]);
	expect(metadata.title).toBe(match![2]);
	expect(metadata.url).toMatch(/^https:\/\/stogas\.ai\/docs/);
	expect(text).not.toMatch(/<\/?(?:Cards?|Callout|Steps)\b/);
	return metadata;
}

/** The route that exports a page's `.md` URL; the build copies its Markdown to that URL. */
function exportPath(markdownPath: string, file = 'content.md') {
	const page = markdownPath.replace(/\.md$/, '');
	const reference = page === '/docs/reference' || page.startsWith('/docs/reference/');
	const slug = page.slice((reference ? '/docs/reference' : '/docs').length);
	return `/llms.mdx/${reference ? 'reference' : 'docs'}${slug}/${file}`;
}

function checkReferences(document: Record<string, unknown>) {
	const walk = (value: unknown) => {
		if (!value || typeof value !== 'object') return;
		for (const [key, child] of Object.entries(value)) {
			if (key === '$ref' && typeof child === 'string' && child.startsWith('#/')) {
				let target: unknown = document;
				for (const part of child.slice(2).split('/')) {
					target = (target as Record<string, unknown>)?.[
						part.replaceAll('~1', '/').replaceAll('~0', '~')
					];
				}
				expect(target, `Unresolved reference ${child}`).toBeDefined();
			} else walk(child);
		}
	};
	walk(document);
}

test('every indexed page exports readable Markdown and complete operation schemas', async ({
	request
}) => {
	const index = await request.get('/llms.txt');
	expect(index.ok()).toBe(true);
	const markdownLinks = Array.from(
		(await index.text()).matchAll(/\]\((https:\/\/stogas\.ai\/docs[^)]*\.md)\)/g),
		(m) => new URL(m[1]).pathname
	);
	expect(markdownLinks.length).toBeGreaterThan(30);
	const operations: string[] = [];
	const canonicalUrls = new Set<string>();
	for (const path of markdownLinks) {
		const response = await request.get(path);
		expect(response.status(), path).toBe(200);
		expect(response.headers()['content-type'], path).toBe('text/markdown; charset=utf-8');
		const text = await response.text();
		const metadata = parseMarkdown(text);
		expect(path, 'Markdown is at the page URL with .md added').toBe(
			`${new URL(metadata.url).pathname}.md`
		);
		expect(response.headers().link, path).toContain(`<${metadata.url}>; rel="canonical"`);
		canonicalUrls.add(metadata.url);
		const exported = await request.get(exportPath(path));
		expect(await exported.text(), path).toBe(text);
		expect(exported.headers()['content-type'], path).toBe('text/markdown; charset=utf-8');
		expect(exported.headers()['x-robots-tag'], path).toBe('noindex');
		const html = await request.get(new URL(metadata.url).pathname);
		expect(html.status()).toBe(200);
		const documentHtml = await html.text();
		expect(documentHtml).toContain(`type="text/markdown" href="https://stogas.ai${path}"`);
		expect(documentHtml).toContain(`<link rel="canonical" href="${metadata.url}"`);
		const block = text.match(/^## OpenAPI\n\n(`{3,})yaml\n([\s\S]*?)^\1\s*$/m);
		if (!block) continue;
		const document = parse(block[2]);
		for (const pathItem of Object.values(document.paths)) {
			for (const operation of Object.values(pathItem as Record<string, unknown>)) {
				if (operation && typeof operation === 'object' && 'operationId' in operation) {
					operations.push(String(operation.operationId));
				}
			}
		}
		checkReferences(document);
		expect(Object.keys(document.paths)).toHaveLength(1);
		const json = await request.get(exportPath(path, 'openapi.json'));
		expect(json.headers()['content-type']).toContain('application/json');
		expect(await json.json()).toEqual(document);
	}
	// Each operation of both documents has exactly one page.
	expect(operations.sort()).toEqual(
		[stogas, dashboard]
			.flatMap((document) => Object.values(document.paths))
			.flatMap((pathItem) => Object.values(pathItem))
			.map((operation) => (operation as { operationId: string }).operationId)
			.sort()
	);
	const sitemap = await request.get('/docs/sitemap.xml');
	expect(sitemap.status()).toBe(200);
	expect(sitemap.headers()['content-type']).toContain('application/xml');
	const sitemapUrls = Array.from(
		(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g),
		(m) => m[1]
	);
	expect(sitemapUrls.sort()).toEqual([...canonicalUrls].sort());
	expect(await (await request.get('/robots.txt')).text()).toContain(
		'Sitemap: https://stogas.ai/docs/sitemap.xml'
	);
	const catalog = await request.get('/.well-known/api-catalog');
	expect(catalog.headers()['content-type']).toContain('application/linkset+json');
	expect(index.headers().link).toContain('rel="service-desc"');
	expect((await request.get('/docs/no-such-page')).status()).toBe(404);
	expect((await request.get('/docs/no-such-page.md')).status()).toBe(404);
	expect((await request.get('/llms.mdx/docs/no-such-page/content.md')).status()).toBe(404);
});

for (const path of [
	'/docs/go',
	'/docs/reference/security',
	'/docs/reference/openai-compatible/createChatCompletion',
	'/docs/reference/dashboard/api-keys/createApiKey'
]) {
	test(`page actions use the same readable document on ${path}`, async ({
		page,
		context,
		request
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await page.goto(path);
		const markdownUrl = await page
			.locator('link[rel="alternate"][type="text/markdown"]')
			.getAttribute('href');
		expect(markdownUrl).toBeTruthy();
		const resource = new URL(markdownUrl!).pathname;
		const markdown = await (await request.get(resource)).text();
		await page.route(`**${resource}`, async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 300));
			await route.continue();
		});
		await page.getByRole('button', { name: 'Copy Markdown', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(markdown);
		await page.getByRole('button', { name: 'Open', exact: true }).click();
		const resources = page.getByRole('dialog', { name: 'Page resources' });
		await expect(
			resources.getByRole('link', { name: 'View as Markdown', exact: true })
		).toHaveAttribute('href', resource);
		for (const name of ['Scira AI', 'ChatGPT', 'Grok', 'Claude', 'Cursor']) {
			const link = resources.getByRole('link', { name: `Open in ${name}`, exact: true });
			const url = new URL((await link.getAttribute('href'))!);
			expect(url.searchParams.get(name === 'Cursor' ? 'text' : 'q')).toContain(markdownUrl!);
			await expect(link).toHaveAttribute('target', '_blank');
			await expect(link).toHaveAttribute('rel', 'noreferrer noopener');
		}
		const github = resources.getByRole('link', { name: 'Open in GitHub', exact: true });
		const source = path.includes('createChatCompletion')
			? 'openapi/stogas.json'
			: path.includes('createApiKey')
				? 'openapi/dashboard.json'
				: path.includes('security')
					? 'reference/security.mdx'
					: 'docs/(sdk)/go.mdx';
		await expect(github).toHaveAttribute(
			'href',
			`https://github.com/StogasAI/docs/blob/main/content/${source}`
		);
		if (source.startsWith('openapi/')) {
			await expect(
				resources.getByRole('link', { name: 'View OpenAPI specification', exact: true })
			).toHaveAttribute('href', exportPath(resource, 'openapi.json'));
		}
	});
}

test('a failed Markdown fetch can be retried without copying an error page', async ({
	page,
	context
}) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/docs/go');
	await page.evaluate(() => navigator.clipboard.writeText('existing clipboard'));
	await page.route(
		'**/docs/go.md',
		(route) => route.fulfill({ status: 503, body: 'Unavailable' }),
		{ times: 1 }
	);
	await page.getByRole('button', { name: 'Copy Markdown', exact: true }).click();
	await expect(
		page.getByRole('button', { name: 'Copy failed — retry', exact: true })
	).toBeVisible();
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('existing clipboard');
	await page.getByRole('button', { name: 'Copy failed — retry', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
	parseMarkdown(await page.evaluate(() => navigator.clipboard.readText()));
});

test('the static document declares its native theme before scripts execute', async ({
	browser,
	request
}) => {
	const html = await (await request.get('/docs/go')).text();
	expect(html).toMatch(/<html\b[^>]*lang="en"/);
	expect(html).toMatch(/<html\b[^>]*class="dark"/);
	expect(html).toContain('<meta name="darkreader-lock"');
	const context = await browser.newContext({ javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto('/docs/go');
		await expect(page.locator('html')).toHaveClass('dark');
		await expect(page.getByRole('heading', { name: 'Go', exact: true })).toBeVisible();
		await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 18, 18)');
	} finally {
		await context.close();
	}
});
