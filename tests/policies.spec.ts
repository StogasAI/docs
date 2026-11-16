import { expect, test, type Page } from '@playwright/test';
import schema from '../content/schemas/key-config-v1.json';
import routingRegistry from '../content/schemas/routing-fields.json';
import navigation from '../content/docs/policies/meta.json';

const topics = [
	'/docs/policies',
	...navigation.pages.map((slug) => `/docs/policies/${slug}`),
	'/docs/pii-redaction',
	'/docs/export'
];

for (const width of [390, 1440]) {
	test(`policy topics expose fields and nested constraints at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 950 });
		await page.goto('/docs/policies');
		const fieldsTable = page.getByRole('table', { name: 'Policy document fields' });
		await expect(fieldsTable.getByRole('button')).toHaveCount(0);
		await expect(fieldsTable.getByRole('row')).toHaveCount(
			Object.keys(schema.properties).length + 1
		);
		await expect(fieldsTable.getByRole('link', { name: 'version', exact: true })).toHaveCount(0);
		expect(
			await fieldsTable.evaluate((table) => table.scrollWidth <= table.parentElement!.clientWidth)
		).toBe(true);
		for (const key of Object.keys(schema.properties)) {
			const row = fieldsTable
				.getByRole('row')
				.filter({ has: page.getByRole('link', { name: key, exact: true }) });
			await expect(row.getByRole('cell').last()).not.toBeEmpty();
		}
		await fieldsTable.getByRole('link', { name: 'limits', exact: true }).click();
		await expect(page).toHaveURL(/\/docs\/policies\/limits$/);
		const fields = page.locator('[id="policy-fields.limit"]');
		await fields.getByRole('textbox').fill('per');
		await fields.getByRole('button', { name: 'object', exact: true }).click();
		await expect(fields.locator('[aria-current="page"]')).toHaveText('per');
		await expect(fields.getByText('count', { exact: true })).toBeVisible();
		await expect(fields).toContainText('gradual');
		await expect(fields).toContainText('week');
		await page.goto('/docs/pii-redaction');
		const literal = page.locator('[id="policy-fields.literalRule"]');
		await expect(literal.getByText('wholeWord?', { exact: true })).toBeVisible();
		await expect(literal).toContainText('true');
		await expect(literal).toContainText('256 UTF-8 bytes');
		await expect(
			page.locator('[id="policy-fields.input"]').getByText('asciiOnly', { exact: true })
		).toBeVisible();
		for (const path of topics) {
			await page.goto(path);
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
				path
			).toBe(true);
			const duplicateIds = await page.locator('[id]').evaluateAll((elements) => {
				const ids = elements.map((e) => e.id);
				return ids.filter((id, i) => ids.indexOf(id) !== i);
			});
			expect(duplicateIds, path).toEqual([]);
		}
	});
}

test('policy topics retain complete field exports and working links to their owners', async ({
	page,
	request
}) => {
	// The test loads every policy topic and fetches each page that they link to, which takes over
	// 30 seconds on a busy machine.
	test.slow();
	const definitions: Record<string, unknown[]> = {
		'/docs/policies/rules': [schema.properties.rules.additionalProperties],
		'/docs/policies/delegation': [schema.properties.delegation],
		'/docs/policies/routing': [schema.properties.routing],
		'/docs/policies/limits': [
			schema.properties.limits.additionalProperties,
			schema.properties.limits.additionalProperties.properties.per
		],
		'/docs/policies/access': [schema.properties.access.properties.deny.items],
		'/docs/pii-redaction': [
			schema.properties.plugins.properties.redaction.anyOf[0]!.properties.literals!.items,
			schema.properties.input
		],
		'/docs/export': [
			schema.properties.plugins.properties.export.anyOf[0]!.properties.destinations!.items
		]
	};
	const links = new Set<string>();
	const anchors = new Map<string, string[]>();
	for (const path of topics) {
		await page.goto(path);
		anchors.set(
			path,
			await page.locator('[id]').evaluateAll((elements) => elements.map((e) => e.id))
		);
		for (const href of await page
			.locator('#nd-page a[href]')
			.evaluateAll((elements) => elements.map((e) => (e as HTMLAnchorElement).href))) {
			const url = new URL(href);
			if (
				(url.origin === new URL(page.url()).origin || url.origin === 'https://stogas.ai') &&
				(url.pathname.startsWith('/docs/') || url.pathname === '/docs')
			)
				links.add(`${url.pathname}${url.hash}`);
		}
		const markdownUrl = await page
			.locator('link[rel="alternate"][type="text/markdown"]')
			.getAttribute('href');
		const response = await request.get(new URL(markdownUrl!).pathname);
		expect(response.ok()).toBe(true);
		const markdown = await response.text();
		expect(markdown).not.toMatch(/<(?:PolicyFields|RoutingFields)/);
		const json = Array.from(markdown.matchAll(/```json(?: [^\n]*)?\n([\s\S]*?)\n```/g), (m) =>
			JSON.parse(m[1])
		);
		for (const definition of definitions[path] ?? []) expect(json, path).toContainEqual(definition);
		if (path === '/docs/policies') {
			for (const key of Object.keys(schema.properties))
				expect(markdown).toContain(`[\`${key}\`](/docs`);
		}
	}
	for (const href of links) {
		const url = new URL(href, 'https://stogas.ai');
		if (!anchors.has(url.pathname)) {
			const response = await request.get(url.pathname);
			expect(response.status(), href).toBe(200);
			anchors.set(
				url.pathname,
				await page.evaluate(
					(html) =>
						Array.from(
							new DOMParser().parseFromString(html, 'text/html').querySelectorAll('[id]'),
							(e) => e.id
						),
					await response.text()
				)
			);
		}
		if (url.hash)
			expect(anchors.get(url.pathname), href).toContain(decodeURIComponent(url.hash.slice(1)));
	}
	expect((await request.get('/docs/policies/reference')).status()).toBe(404);
	expect((await request.get('/docs/policies/plugins')).status()).toBe(404);
	expect(await (await request.get('/llms-full.txt')).text()).not.toContain(
		'/docs/policies/reference'
	);
});

test('routing field inventories survive Markdown export and query examples are highlighted', async ({
	page,
	request
}) => {
	await page.goto('/docs/policies/routing-fields');
	const alternate = await page
		.locator('link[rel="alternate"][type="text/markdown"]')
		.getAttribute('href');
	const response = await request.get(new URL(alternate!).pathname);
	expect(response.ok()).toBe(true);
	const markdown = await response.text();
	expect(markdown).not.toContain('<RoutingFields');
	for (const name of Object.keys(routingRegistry)) expect(markdown).toContain(`\`${name}\``);
	await page.setViewportSize({ width: 390, height: 950 });
	// The layout settles after the resize, so the width is read until it fits.
	await expect
		.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
		.toBe(true);
	await expect(page.getByRole('table').getByRole('button')).toHaveCount(0);
	await expect(
		page
			.getByRole('table', { name: 'request routing fields' })
			.locator('code')
			.filter({ hasText: /^chat_completions$/ })
	).toBeVisible();
	await page.goto('/docs/policies/expressions');
	const example = page
		.locator('pre')
		.filter({ hasText: 'deployment.dataHandling.retentionDays <= 30' });
	await expect(example.locator('[style*="--shiki-"]').first()).toBeVisible();
	await expect(example).toContainText('!has(deployment.dataHandling.retentionDays)');
});

// Once the page hydrates, the sidebar scrolls back to the current page, which can move a link away
// from a click that came earlier.
async function openFromSidebar(page: Page, name: string, url: RegExp) {
	await expect(async () => {
		await page.locator('#nd-sidebar').getByRole('link', { name, exact: true }).click();
		await expect(page).toHaveURL(url, { timeout: 1000 });
	}).toPass();
}

test('plugin pages are discoverable through the sidebar and search', async ({ page }) => {
	await page.goto('/docs');
	await openFromSidebar(page, 'PII redaction', /\/docs\/pii-redaction$/);
	await expect(page.getByRole('heading', { name: 'PII redaction', exact: true })).toBeVisible();
	await openFromSidebar(page, 'Export', /\/docs\/export$/);
	await expect(page.getByRole('heading', { name: 'Export', exact: true })).toBeVisible();
	const destination = page.locator('[id="policy-fields.exportDestination"]');
	await expect(destination).toContainText('url');
	await expect(destination).toContainText('headers');
	await page.keyboard.press('Control+k');
	await page.getByRole('combobox', { name: 'Search documentation' }).fill('export');
	await page
		.getByRole('dialog')
		.getByRole('option', { name: /Documentation\s*Export$/ })
		.click();
	await expect(page).toHaveURL(/\/docs\/export(?:#.*)?$/);
});
