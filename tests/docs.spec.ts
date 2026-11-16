import AxeBuilder from '@axe-core/playwright';
import { chromium, expect, test as base, type Locator, type Page } from '@playwright/test';
import { createServer } from 'node:http';
import { resolve } from 'node:path';

const test = base.extend<{ browserZoom: number }>({
	browserZoom: [1, { option: true }],
	page: async ({ page, baseURL, viewport, browserZoom }, use) => {
		const extension = resolve(__dirname, 'fixtures/browser-zoom');
		const context =
			browserZoom === 1
				? undefined
				: await chromium.launchPersistentContext('', {
						channel: 'chromium',
						baseURL,
						viewport,
						ignoreDefaultArgs: ['--hide-scrollbars'],
						args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
					});
		const errors: string[] = [];
		try {
			if (context) {
				page = context.pages()[0];
			}
			page.on('pageerror', (error) => errors.push(error.message));
			if (context) {
				await page.goto('/docs');
				const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
				await worker.evaluate(`(async () => {
					const [tab] = await chrome.tabs.query({ active: true });
					await chrome.tabs.setZoom(tab.id, ${browserZoom});
				})()`);
			}
			await use(page);
			expect(errors).toEqual([]);
		} finally {
			await context?.close();
		}
	}
});

async function expectReadingRegion(page: Page, id: string) {
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await page.evaluate(() => document.fonts.ready);
	await expect
		.poll(() =>
			page.evaluate((id) => {
				const heading = document.getElementById(id)?.getBoundingClientRect();
				const introduction = document
					.getElementById(id)
					?.nextElementSibling?.getBoundingClientRect();
				const outline = document
					.querySelector('[data-toc-popover-trigger]')
					?.getBoundingClientRect();
				return (
					!!heading &&
					!!introduction &&
					!!outline &&
					heading.top >= outline.bottom &&
					introduction.top >= heading.bottom &&
					introduction.bottom <= innerHeight
				);
			}, id)
		)
		.toBe(true);
}

// Base UI shows the response status indicator only after hydration; earlier clicks are lost.
async function waitForHydration(page: Page) {
	await expect(
		page.locator('.stogas-api-operation-main [role="tablist"] > [role="presentation"]').first()
	).toBeVisible();
}

// The playground loads on demand and hydrates apart from the page; a click before then is lost.
async function openPlayground(page: Page) {
	const dialog = page.getByRole('dialog');
	await expect(async () => {
		if (!(await dialog.isVisible()))
			await page.getByRole('button', { name: 'Try in Playground', exact: true }).click();
		await expect(dialog.getByRole('textbox', { name: 'Request JSON' })).toBeVisible({
			timeout: 1000
		});
	}).toPass({ timeout: 10_000 });
}

async function searchForSection(page: Page, query: string, title: string) {
	await page.keyboard.press('Control+k');
	await page.getByRole('combobox', { name: 'Search documentation' }).fill(query);
	await expect(page.getByRole('dialog').getByRole('option').first()).toContainText(title);
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
}

test('page outline names its progress and follows a keyboard-selected section', async ({
	page
}) => {
	await page.setViewportSize({ width: 1180, height: 757 });
	await page.goto('/docs/reasoning');
	const trigger = page.getByRole('button', { name: /On this page/ });
	await expect(trigger).toBeVisible();
	await expect(page.getByRole('progressbar', { name: 'Page outline progress' })).toHaveAttribute(
		'aria-valuemin',
		'0'
	);
	await trigger.focus();
	await page.keyboard.press('Enter');
	const target = page
		.locator('[data-toc-popover-content]')
		.getByRole('link', { name: 'Set a token budget', exact: true });
	await target.focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/#set-a-token-budget$/);
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await expect
		.poll(async () =>
			Number(
				await page
					.getByRole('progressbar', { name: 'Page outline progress' })
					.getAttribute('aria-valuenow')
			)
		)
		.toBeGreaterThan(0);
});

test('the article keeps its place before the page outline loads', async ({ browser }) => {
	// The first paint comes before any script runs, and the outline follows the article in the
	// document, so a browser can paint the article before the outline arrives.
	const context = await browser.newContext({ javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto('/docs/policies/routing');
		const article = page.locator('#nd-page');
		const placed = await article.boundingBox();
		expect(placed).not.toBeNull();
		await page.locator('#nd-toc').evaluate((outline) => outline.remove());
		expect(await article.boundingBox()).toEqual(placed);
	} finally {
		await context.close();
	}
});

for (const viewport of [
	{ width: 333, height: 504, zoom: 1.5 },
	{ width: 590, height: 378, zoom: 2 }
]) {
	test.describe(`native browser zoom ${viewport.zoom * 100}%`, () => {
		test.use({
			browserZoom: viewport.zoom,
			viewport: {
				width: Math.round(viewport.width * viewport.zoom),
				height: viewport.height * viewport.zoom
			}
		});
		test(`search, outline and history reveal the section at ${viewport.width} × ${viewport.height}`, async ({
			page
		}) => {
			expect(
				await page.evaluate(() => ({
					width: innerWidth,
					height: innerHeight,
					zoom: devicePixelRatio
				}))
			).toEqual({ width: viewport.width, height: viewport.height, zoom: viewport.zoom });
			await page.goto('/docs/policies/limits');
			await page.keyboard.press('Control+k');
			const search = page.getByRole('combobox', { name: 'Search documentation' });
			await search.fill('conditional rules');
			await expect(page.getByRole('dialog').getByRole('option').first()).toContainText('Rules');
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');
			const outline = page.getByRole('button', { name: /On this page/ });
			async function expectVisibleSection() {
				await expect(page).toHaveURL(/\/policies\/rules#conditional-rules$/);
				await expectReadingRegion(page, 'conditional-rules');
			}
			await expectVisibleSection();
			await page.goBack();
			await expect(page).toHaveURL(/\/policies\/limits$/);
			await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
			await page.goForward();
			await expectVisibleSection();
			await outline.click();
			await page
				.locator('[data-toc-popover-content]')
				.getByRole('link', { name: 'Conditional rules', exact: true })
				.click();
			await expect(outline).toHaveAttribute('aria-expanded', 'false');
			await expectVisibleSection();
			await page.reload();
			await expectVisibleSection();
		});
	});
}

test.describe('native browser zoom 200% at 400 × 378', () => {
	test.use({ browserZoom: 2, viewport: { width: 800, height: 756 } });
	test('sidebar opening and closing preserves a search anchor through history', async ({
		page
	}) => {
		await page.goto('/docs');
		await searchForSection(page, 'lifetime or recurring', 'Limits');
		await expect(page).toHaveURL(/\/policies\/limits#lifetime-or-recurring$/);
		await expectReadingRegion(page, 'lifetime-or-recurring');
		await page.getByRole('button', { name: 'Open Sidebar', exact: true }).click();
		await page
			.locator('#nd-sidebar-mobile')
			.getByRole('button', { name: 'Close Sidebar', exact: true })
			.click();
		await expectReadingRegion(page, 'lifetime-or-recurring');
		await page.goBack();
		await expect(page).toHaveURL(/\/docs$/);
		await page.goForward();
		await expectReadingRegion(page, 'lifetime-or-recurring');
	});

	test('replacing a dismissed sidebar search reveals the current hash again', async ({ page }) => {
		await page.goto('/docs/policies/rules#conditional-rules');
		await expectReadingRegion(page, 'conditional-rules');
		await page.getByRole('button', { name: 'Open Sidebar', exact: true }).click();
		const close = page
			.locator('#nd-sidebar-mobile')
			.getByRole('button', { name: 'Close Sidebar', exact: true });
		await close.focus();
		await page.keyboard.press('Control+k');
		await page
			.getByRole('combobox', { name: 'Search documentation' })
			.fill('lifetime or recurring');
		await expect(page.getByRole('option').first()).toContainText('Limits');
		await page.keyboard.press('Escape');
		await expect(page.getByRole('combobox', { name: 'Search documentation' })).toHaveCount(0);
		await expect(close).toBeFocused();
		await close.click();
		await searchForSection(page, 'conditional rules', 'Rules');
		await expect(page).toHaveURL(/\/policies\/rules#conditional-rules$/);
		await expectReadingRegion(page, 'conditional-rules');
	});
});

test('nested schemas open in their card with keyboard focus and their own filter', async ({
	page
}) => {
	await page.setViewportSize({ width: 333, height: 504 });
	await page.goto('/docs/policies/rules');
	const schema = page.locator('[id="policy-fields.rule"]');
	const filter = schema.getByRole('textbox', { name: 'Filter Properties' });
	const current = schema.locator('[aria-current="page"]');
	await filter.fill('routing');
	await expect(schema.getByRole('button', { name: 'object', exact: true })).toHaveCount(1);
	await schema.getByRole('button', { name: 'object', exact: true }).focus();
	await page.keyboard.press('Enter');
	await expect(current).toHaveText('routing');
	await expect(current).toBeFocused();
	await expect(current).toBeInViewport({ ratio: 1 });
	await expect(filter).toHaveValue('');
	await filter.fill('zzznoproperty');
	await expect(schema).toContainText('No property matching "zzznoproperty"');
	await schema.getByRole('button', { name: 'rules.<name>', exact: true }).click();
	await expect(current).toHaveText('rules.<name>');
	await expect(current).toBeFocused();
	await expect(
		schema.getByRole('button', { name: 'Copy Link: routing', exact: true })
	).toBeVisible();
});

test('collapsed desktop sidebar keeps an accurate action name and expanded state', async ({
	page
}) => {
	await page.goto('/docs');
	await page
		.locator('#nd-sidebar')
		.getByRole('button', { name: /^(?:Collapse|Toggle) Sidebar$/, exact: true })
		.click();
	const expand = page
		.getByRole('button', { name: /^(?:Expand|Toggle) Sidebar$/, exact: true })
		.last();
	await expect(expand).toHaveAttribute('aria-expanded', 'false');
	await expand.focus();
	await page.keyboard.press('Enter');
	await expect(page.locator('#nd-sidebar')).not.toHaveAttribute('inert');
	await expect(
		page
			.locator('#nd-sidebar')
			.getByRole('button', { name: /^(?:Collapse|Toggle) Sidebar$/, exact: true })
	).toHaveAttribute('aria-expanded', 'true');
});

test('provider routing alternatives name and expose their object fields', async ({ page }) => {
	await page.goto('/docs/reference/openai-compatible/createChatCompletion');
	const row = page
		.getByRole('button', { name: 'Copy Link: provider', exact: true })
		.locator('../..');
	await expect(row).toContainText('Provider ID');
	await expect(row).not.toContainText('unknown');
	await row.getByRole('button', { name: 'Allowed providers', exact: true }).click();
	const body = page.locator('[id="request-body.applicationjson.body"]');
	await expect(body.locator('[aria-current="page"]')).toHaveText('provider');
	await expect(body.getByRole('button', { name: 'Copy Link: only', exact: true })).toBeVisible();
	await expect(body.getByRole('button', { name: 'Copy Link: order', exact: true })).toBeVisible();
});

test('API samples are formatted and highlighted with JavaScript disabled', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		for (const endpoint of [
			'openai-compatible/createChatCompletion',
			'openai-compatible/createResponse',
			'catalog/listModels',
			'catalog/getCatalog',
			'catalog/getCatalogPart'
		]) {
			await page.goto(`/docs/reference/${endpoint}`);
			const examples = page.locator('.stogas-api-operation-examples');
			const blocks = examples.locator('pre:visible');
			expect(await blocks.count()).toBeGreaterThanOrEqual(2);
			for (const block of await blocks.all()) {
				await expect(block.locator('[style*="--shiki-"]').first()).toBeVisible();
				const text = await block.textContent();
				if (text?.startsWith('{') || text?.startsWith('['))
					expect(text).toBe(JSON.stringify(JSON.parse(text), null, 2));
			}
			await expect(blocks.first()).toContainText('https://api.stogas.ai/');
		}
	} finally {
		await context.close();
	}
});

test('dashboard API pages document the operation without a playground', async ({
	page,
	request
}) => {
	const path = '/docs/reference/dashboard/api-keys/createApiKey';
	await page.goto(path);
	await waitForHydration(page);
	const main = page.locator('.stogas-api-operation-main');
	await expect(main).toContainText('/api/{orgId}/keys');
	await expect(main).toContainText('Read and write');
	await expect(page.getByRole('button', { name: 'Try in Playground', exact: true })).toHaveCount(0);
	await expect(main).not.toContainText('Live endpoint');
	await expect(page.locator('.stogas-api-operation-examples pre').first()).toContainText(
		'https://app.stogas.ai/api/'
	);
	expect(
		(
			await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
				.analyze()
		).violations
	).toEqual([]);
	// The page carries only its own operation, not the whole document.
	expect(await (await request.get(path)).text()).not.toContain('/api/{orgId}/members');
});

test('switching sample languages preserves highlighting', async ({ page }) => {
	await page.goto('/docs/reference/openai-compatible/createChatCompletion');
	await waitForHydration(page);
	const language = page.getByRole('combobox', { name: 'Code language' });
	const sample = page.locator('figure', { has: language }).locator('pre');
	for (const name of ['JavaScript', 'Go', 'Python', 'Java', 'C#', 'Rust', 'cURL']) {
		await language.click();
		await page.getByRole('option', { name, exact: true }).click();
		await expect(language).toHaveText(name);
		await expect(sample.locator('[style*="--shiki-"]').first()).toBeVisible();
	}
});

test('defaults to dark, preserves light preference, and supports keyboard access', async ({
	page
}) => {
	await page.goto('/docs');
	await expect(page.locator('html')).toHaveClass(/dark/);
	await expect(page.locator('html')).toHaveCSS('color-scheme', /^(?:only dark|dark only)$/);
	await page.keyboard.press('Tab');
	const skip = page.getByRole('link', { name: 'Skip to content', exact: true });
	await expect(skip).toBeFocused();
	expect((await skip.boundingBox())?.width).toBeGreaterThan(100);
	await page.keyboard.press('Enter');
	await expect(page.locator('#nd-page')).toBeFocused();
	expect(
		(
			await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
				.analyze()
		).violations
	).toEqual([]);
	await page.getByRole('button', { name: 'Toggle Theme' }).click();
	await expect(page.locator('html')).toHaveClass(/light/);
	await page.reload();
	await expect(page.locator('html')).toHaveClass(/light/);
	await expect(page.locator('html')).toHaveCSS('color-scheme', /^(?:only light|light only)$/);
	await page.evaluate(() => document.fonts.ready);
	expect(
		(
			await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
				.analyze()
		).violations
	).toEqual([]);
});

test('API reference controls and code remain accessible in both themes', async ({ page }) => {
	// Four full-page accessibility scans and a reload take about 25 seconds.
	test.slow();
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/docs/reference/openai-compatible/createChatCompletion');
	for (const theme of ['dark', 'light']) {
		await expect(page.locator('html')).toHaveClass(new RegExp(theme));
		await waitForHydration(page);
		await page.evaluate(() => document.fonts.ready);
		for (const playground of [false, true]) {
			if (playground) {
				await openPlayground(page);
				await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeVisible();
			}
			expect(
				(
					await new AxeBuilder({ page })
						.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
						.analyze()
				).violations
			).toEqual([]);
		}
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toHaveCount(0);
		if (theme === 'dark') {
			await page.getByRole('button', { name: 'Toggle Theme' }).click();
			await expect(page.locator('html')).toHaveClass(/light/);
			await page.reload();
		}
	}
});

test('static search finds guides and API reference, with keyboard navigation', async ({ page }) => {
	await page.goto('/docs');
	await page.keyboard.press('Control+k');
	const search = page.getByRole('combobox', { name: 'Search documentation' });
	await search.fill('Quickstart');
	await expect(
		page
			.getByRole('dialog')
			.getByRole('option', { name: /Quickstart/ })
			.first()
	).toBeVisible();
	await search.fill('Compatibility notes');
	await expect(
		page
			.getByRole('dialog')
			.getByRole('option', { name: /Compatibility notes/ })
			.first()
	).toBeVisible();
	const result = page
		.getByRole('dialog')
		.getByRole('option', { name: /Compatibility notes/ })
		.first();
	expect(
		(
			await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
				.analyze()
		).violations
	).toEqual([]);
	await result.click();
	await expect(page).toHaveURL(/\/docs\/reference\/provider-behavior/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Compatibility notes');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await page.keyboard.press('Control+k');
	await search.fill('Quickstart');
	const firstResult = page.getByRole('dialog').getByRole('option').first();
	await expect(firstResult).toContainText('Quickstart');
	await expect(firstResult).toHaveAttribute('aria-selected', 'true');
	await page.keyboard.press('ArrowDown');
	await expect(firstResult).toHaveAttribute('aria-selected', 'false');
	await page.keyboard.press('ArrowUp');
	await expect(firstResult).toHaveAttribute('aria-selected', 'true');
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/docs\/quickstart(?:#.*)?$/);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quickstart');
});

test('search dismissal restores the opener and its next keyboard position', async ({ page }) => {
	await page.goto('/docs/policies/editing');
	const search = page.getByRole('combobox', { name: 'Search documentation' });
	const trigger = page.getByRole('button', { name: /^Search/ }).filter({ visible: true });
	const policyLink = page.getByRole('link', { name: 'Edit a policy', exact: true });
	for (const opener of [trigger, policyLink]) {
		await opener.focus();
		await page.keyboard.press('Tab');
		const next = await page.evaluateHandle(() => document.activeElement);
		for (const close of ['Escape', 'button']) {
			await opener.focus();
			if (opener === trigger && close === 'Escape') await opener.click();
			else await page.keyboard.press(opener === trigger ? 'Enter' : 'Control+k');
			await expect(search).toBeFocused();
			await expect(page.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
			await page.keyboard.press('Tab');
			await expect(page.getByRole('button', { name: 'Close Search' })).toBeFocused();
			await page.keyboard.press('Tab');
			await expect(search).toBeFocused();
			if (close === 'Escape') await page.keyboard.press('Escape');
			else await page.getByRole('button', { name: 'Close Search' }).click();
			await expect(page.getByRole('dialog')).toHaveCount(0);
			await expect(opener).toBeFocused();
			await page.keyboard.press('Tab');
			expect(await page.evaluate((target) => document.activeElement === target, next)).toBe(true);
		}
		await next.dispose();
	}
	// Opening without a focused control falls back to the visible search trigger.
	for (const width of [1440, 390]) {
		await page.setViewportSize({ width, height: 1000 });
		await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
		await page.keyboard.press('Control+k');
		await expect(search).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await expect(page.locator('[data-docs-search-trigger] button:visible')).toBeFocused();
	}
});

test('copy controls copy their example and clear native scrollbars, and statuses stay distinct', async ({
	page,
	context
}) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/docs/reference/openai-compatible/createChatCompletion');
	await waitForHydration(page);
	// The clipboard is cleared first, so each copy is checked on its own.
	const copiedText = async (button: Locator) => {
		await page.evaluate(() => navigator.clipboard.writeText(''));
		await button.click();
		await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).not.toBe('');
		return await page.evaluate(() => navigator.clipboard.readText());
	};
	const color = (status: Locator) =>
		status.locator('[data-response-status]').evaluate((e) => getComputedStyle(e).color);
	const main = page.locator('.stogas-api-operation-main');
	expect(await color(main.getByRole('tab', { name: '200', exact: true }))).not.toBe(
		await color(main.getByRole('tab', { name: '402', exact: true }))
	);
	// The title bars hold the copy buttons, first of the request and then of the response.
	const examples = page.locator('.stogas-api-operation-examples');
	const copies = examples.getByRole('button', { name: /^Cop(?:y|ied) Text$/ });
	await expect(copies).toHaveCount(2);
	expect(await copiedText(copies.first())).toContain('https://api.stogas.ai/v1/chat/completions');
	expect(JSON.parse(await copiedText(copies.last()))).toHaveProperty('choices');
	const status = examples.getByRole('combobox', { name: 'Response status' });
	await status.click();
	const error = page.getByRole('option', { name: '402', exact: true });
	expect(await color(page.getByRole('option', { name: '200', exact: true }))).not.toBe(
		await color(error)
	);
	await error.click();
	await expect(status).toHaveText('402');
	await expect(examples).toContainText('insufficient_balance');
	expect(await copiedText(copies.last())).toContain('insufficient_balance');

	// Without a title bar, the copy button stays in the scrollport of the code.
	await openPlayground(page);
	const dialog = page.getByRole('dialog');
	// Short examples must not reserve space for a scrollbar that is not there.
	await dialog.getByRole('tab', { name: '402', exact: true }).click();
	const shortExample = dialog.getByRole('tabpanel', { name: '402', exact: true });
	const shortCopy = shortExample.getByRole('button', { name: 'Copy Text', exact: true });
	await expect(async () => {
		const viewport = await shortExample.locator('.fd-scroll-container').evaluate((element) => ({
			right: element.getBoundingClientRect().left + element.clientWidth,
			scrolls: element.scrollHeight > element.clientHeight
		}));
		expect(viewport.scrolls).toBe(false);
		const button = await shortCopy.boundingBox();
		expect(button).not.toBeNull();
		expect(viewport.right - button!.x - button!.width).toBeCloseTo(8, 0);
	}).toPass({ timeout: 5000 });
	await page.addStyleTag({
		content:
			'.fd-scroll-container { scrollbar-gutter: stable; } .fd-scroll-container::-webkit-scrollbar { width: 24px; height: 24px; }'
	});
	for (const width of [1440, 320]) {
		await page.setViewportSize({ width, height: 1000 });
		// Narrow playgrounds show the request and the response one at a time.
		if (width === 320) await dialog.getByRole('tab', { name: 'Response', exact: true }).click();
		await dialog.getByRole('tab', { name: '200', exact: true }).click();
		const panel = dialog.getByRole('tabpanel', { name: '200', exact: true });
		const copy = panel.getByRole('button', { name: /^Cop(?:y|ied) Text$/ });
		const viewport = panel.locator('.fd-scroll-container');
		await expect(async () => {
			await expect(copy).toBeVisible();
			const bounds = await viewport.evaluate((element) => ({
				right: element.getBoundingClientRect().left + element.clientWidth,
				gutter: element.getBoundingClientRect().width - element.clientWidth,
				scrolls: element.scrollHeight > element.clientHeight
			}));
			expect(bounds.gutter).toBeGreaterThan(0);
			expect(bounds.scrolls).toBe(true);
			const button = await copy.boundingBox();
			expect(button).not.toBeNull();
			expect(bounds.right - button!.x - button!.width).toBeCloseTo(8, 0);
		}).toPass({ timeout: 5000 });
		await viewport.evaluate((element) => element.scrollTo({ top: 200, left: 100 }));
		const scrolledBounds = await viewport.boundingBox();
		const scrolledButton = await copy.boundingBox();
		expect(scrolledButton!.y).toBeGreaterThanOrEqual(scrolledBounds!.y + 8);
		const contentRight = await viewport.evaluate(
			(element) => element.getBoundingClientRect().left + element.clientWidth
		);
		expect(contentRight - scrolledButton!.x - scrolledButton!.width).toBeCloseTo(8, 0);
		expect(JSON.parse(await copiedText(copy))).toHaveProperty('choices');
	}
});

test('single-property schemas omit filtering and nested filters fit narrow cards', async ({
	page
}) => {
	await page.goto('/docs/reference/openai-compatible/createChatCompletion');
	await waitForHydration(page);
	const main = page.locator('.stogas-api-operation-main');
	const status = main.getByRole('tab', { name: '402', exact: true });
	await status.click();
	await expect(status).toHaveAttribute('aria-selected', 'true');
	// The panel that the click replaces stays in the page, inert, until its transition ends.
	const response = main.locator('[role="tabpanel"]:not([inert])');
	await expect(response).toContainText('more credit');
	const filter = response.getByRole('textbox', { name: 'Filter Properties' });
	await expect(filter).toHaveCount(0);
	await response.getByRole('button', { name: 'object', exact: true }).click();
	await expect(response.locator('[aria-current="page"]')).toHaveText('error');
	for (const width of [1440, 320]) {
		await page.setViewportSize({ width, height: 1000 });
		await expect
			.poll(() =>
				filter.evaluate((element) => {
					const bounds = element.getBoundingClientRect();
					const card = element.closest('.rounded-xl')!.getBoundingClientRect();
					return bounds.left >= card.left && bounds.right <= card.right;
				})
			)
			.toBe(true);
	}
	await filter.fill('message');
	await expect(
		response.getByRole('button', { name: 'Copy Link: message', exact: true })
	).toBeVisible();
	await expect(response.getByRole('button', { name: 'Copy Link: code', exact: true })).toHaveCount(
		0
	);
});

test('exported Docs reject cross-origin framing of the live playground', async ({
	page,
	baseURL
}) => {
	const path = '/docs/reference/openai-compatible/createChatCompletion';
	const response = await page.goto(path);
	expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
	expect(response?.headers()['x-frame-options']).toBe('DENY');
	await expect(page.getByRole('button', { name: 'Try in Playground', exact: true })).toBeVisible();
	const framedUrl = new URL(path, baseURL).href;
	const attacker = createServer((_request, response) => {
		response.setHeader('Content-Type', 'text/html');
		response.end(`<iframe title="Framed playground" src="${framedUrl}"></iframe>`);
	});
	try {
		await new Promise<void>((resolve) => attacker.listen(0, '127.0.0.1', resolve));
		const address = attacker.address();
		if (!address || typeof address === 'string') throw new Error('No frame-test port available');
		const blocked = page.waitForEvent('requestfailed', {
			predicate: (request) => request.url() === framedUrl
		});
		await page.goto(`http://127.0.0.1:${address.port}/`);
		expect((await blocked).failure()?.errorText).toBe('net::ERR_BLOCKED_BY_RESPONSE');
		await expect(
			page.frameLocator('iframe').getByRole('button', { name: 'Try in Playground', exact: true })
		).toHaveCount(0);
	} finally {
		attacker.closeAllConnections();
		await new Promise<void>((resolve, reject) =>
			attacker.close((error) => (error ? reject(error) : resolve()))
		);
	}
});

test('request editor blocks invalid drafts and sends exact nested JSON and decimals', async ({
	page
}) => {
	const requests: unknown[] = [];
	await page.route('https://api.stogas.ai/v1/chat/completions', async (route) => {
		requests.push(route.request().postDataJSON());
		await route.fulfill({ contentType: 'application/json', body: '{"id":"test-response"}' });
	});
	await page.goto('/docs/reference/openai-compatible/createChatCompletion');
	await waitForHydration(page);
	await openPlayground(page);
	const editor = page.getByRole('dialog').getByRole('textbox', { name: 'Request JSON' });
	await expect(editor).toBeVisible();
	const body = {
		model: 'openai/gpt-5-mini',
		messages: [{ role: 'user', content: 'Hello' }],
		temperature: 0.123,
		metadata: { example: 'nested JSON' }
	};
	await editor.fill(JSON.stringify(body, null, 2));
	await editor.fill('{"model":');
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	await expect(editor).toBeFocused();
	await expect(editor).toHaveAttribute('aria-invalid', 'true');
	expect(requests).toEqual([]);
	await editor.fill('[]');
	await expect(page.getByRole('status')).toContainText('Enter a JSON object');
	await editor.fill(JSON.stringify(body, null, 2));
	await page.getByRole('button', { name: 'Send', exact: true }).click();
	await expect.poll(() => requests).toEqual([body]);
	await expect(editor).toHaveValue(JSON.stringify(body, null, 2));
});

test.describe('touch accessibility', () => {
	test.use({ hasTouch: true });
	test('narrow layouts, reduced motion, and forced colors keep content reachable', async ({
		page
	}) => {
		await page.setViewportSize({ width: 320, height: 800 });
		await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
		for (const path of [
			'/docs',
			'/docs/policies/routing-fields',
			'/docs/reference/openai-compatible/createChatCompletion'
		]) {
			await page.goto(path);
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
			).toBe(true);
		}
		await waitForHydration(page);
		await openPlayground(page);
		await expect(page.getByRole('textbox', { name: 'Request JSON' })).toHaveCSS(
			'font-size',
			'16px'
		);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await page.keyboard.press('Control+k');
		await expect(page.getByRole('combobox', { name: 'Search documentation' })).toBeFocused();
		await expect(page.getByRole('combobox', { name: 'Search documentation' })).toHaveCSS(
			'font-size',
			'16px'
		);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toHaveCount(0);
	});
});

test('keeps English routes and search when the browser prefers another language', async ({
	browser
}) => {
	const context = await browser.newContext({ locale: 'fr-FR' });
	try {
		const page = await context.newPage();
		await page.goto('/docs');
		await expect(page).toHaveURL(/\/docs$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveCount(1);
		await expect(page.getByRole('button', { name: /language/i })).toHaveCount(0);
		await page.keyboard.press('Control+k');
		await page.getByRole('combobox', { name: 'Search documentation' }).fill('billing');
		await expect(
			page
				.getByRole('dialog')
				.getByRole('option', { name: /billing/i })
				.first()
		).toBeVisible();
	} finally {
		await context.close();
	}
});

test('SDK folder opens its overview and lists the language guides', async ({ page }) => {
	await page.goto('/docs');
	const sidebar = page.locator('#nd-sidebar');
	await sidebar.getByRole('link', { name: 'SDKs', exact: true }).click();
	await expect(page).toHaveURL(/\/docs\/sdk-overview$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('SDKs');
	await sidebar.getByRole('link', { name: 'JavaScript and TypeScript', exact: true }).click();
	await expect(page).toHaveURL(/\/docs\/javascript$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('JavaScript and TypeScript');
});

test('sidebar shows a draggable native scrollbar only when its links overflow', async ({
	baseURL
}) => {
	// Default headless runs hide native scrollbars.
	const browser = await chromium.launch({
		channel: 'chromium',
		ignoreDefaultArgs: ['--hide-scrollbars']
	});
	try {
		const page = await browser.newPage({ baseURL, viewport: { width: 1440, height: 700 } });
		const viewport = page.locator('#nd-sidebar [data-radix-scroll-area-viewport]');
		const gutter = () =>
			viewport.evaluate((element: HTMLElement) => element.offsetWidth - element.clientWidth);
		// Links end where the search field ends, with or without the scrollbar.
		const linkOverhang = async () => {
			const search = await page
				.locator('#nd-sidebar')
				.getByRole('button', { name: /^Search/ })
				.boundingBox();
			const link = await viewport.getByRole('link').first().boundingBox();
			return Math.abs(search!.x + search!.width - (link!.x + link!.width));
		};
		await page.goto('/docs/policies');
		await expect.poll(gutter).toBeGreaterThan(0);
		expect(await linkOverhang()).toBeLessThanOrEqual(1);
		// Fumadocs scrolls the active link into view after hydration; reset the scroll after that.
		await expect(viewport.locator('a[data-active="true"]')).toBeInViewport();
		await viewport.evaluate((element) => element.scrollTo({ top: 0 }));
		const box = await viewport.boundingBox();
		expect(box).not.toBeNull();
		const x = box!.x + box!.width - (await gutter()) / 2;
		await page.mouse.move(x, box!.y + 20);
		await page.mouse.down();
		await page.mouse.move(x, box!.y + 120, { steps: 8 });
		await page.mouse.up();
		// The page reports the scroll a frame after the drag.
		await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
		await page.goto('/docs/reference');
		// Grow the window until every link fits.
		const hidden = await viewport.evaluate(
			(element) => element.scrollHeight - element.clientHeight
		);
		await page.setViewportSize({ width: 1440, height: 700 + hidden + 50 });
		await expect.poll(gutter).toBe(0);
		expect(await linkOverhang()).toBeLessThanOrEqual(1);
	} finally {
		await browser.close();
	}
});
