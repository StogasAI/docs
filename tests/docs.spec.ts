import AxeBuilder from '@axe-core/playwright';
import { chromium, expect, test as base, type Page } from '@playwright/test';
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
		.getByRole('link', { name: 'Manual token limits', exact: true });
	await target.focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/#manual-token-limits$/);
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
			await expect(page.getByRole('dialog').getByRole('option').first()).toContainText(
				'Scopes and inheritance'
			);
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');
			const outline = page.getByRole('button', { name: /On this page/ });
			async function expectVisibleSection() {
				await expect(page).toHaveURL(/\/policies\/scopes#conditional-rules$/);
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

test.describe('native browser zoom with nested navigation', () => {
	test.use({ browserZoom: 1.5, viewport: { width: 500, height: 756 } });
	test('search from a schema popup preserves the reading target through direct history', async ({
		page
	}) => {
		await page.goto('/docs/policies/limits');
		const fields = page.locator('[id="policy-fields.recurringSpend"]');
		await fields.getByRole('textbox', { name: 'Filter Properties' }).fill('window');
		await fields.getByRole('button', { name: 'object', exact: true }).click();
		await expect(page.getByRole('dialog')).toBeVisible();
		await page.keyboard.press('Control+k');
		const search = page.getByRole('combobox', { name: 'Search documentation' });
		await search.fill('i11-?!-7d6c');
		await expect(page.getByRole('option')).toHaveCount(0);
		await search.fill('conditional rules');
		await expect(page.getByRole('option').first()).toContainText('Scopes and inheritance');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\/policies\/scopes#conditional-rules$/);
		await expectReadingRegion(page, 'conditional-rules');
		await page.goBack();
		await expect(page).toHaveURL(/\/policies\/limits$/);
		await expect(page.getByRole('dialog')).toHaveCount(0);
		await page.goForward();
		await expectReadingRegion(page, 'conditional-rules');
	});
});

test.describe('native browser zoom 200% at 400 × 378', () => {
	test.use({ browserZoom: 2, viewport: { width: 800, height: 756 } });
	test('sidebar opening and closing preserves a search anchor through history', async ({
		page
	}) => {
		await page.goto('/docs');
		await searchForSection(page, 'lifetime tokens', 'Limits');
		await expect(page).toHaveURL(/\/policies\/limits#lifetime-tokens$/);
		await expectReadingRegion(page, 'lifetime-tokens');
		await page.getByRole('button', { name: 'Open Sidebar', exact: true }).click();
		await page
			.locator('#nd-sidebar-mobile')
			.getByRole('button', { name: 'Close Sidebar', exact: true })
			.click();
		await expectReadingRegion(page, 'lifetime-tokens');
		await page.goBack();
		await expect(page).toHaveURL(/\/docs$/);
		await page.goForward();
		await expectReadingRegion(page, 'lifetime-tokens');
	});

	test('replacing a dismissed sidebar search reveals the current hash again', async ({ page }) => {
		await page.goto('/docs/policies/scopes#conditional-rules');
		await expectReadingRegion(page, 'conditional-rules');
		await page.getByRole('button', { name: 'Open Sidebar', exact: true }).click();
		const close = page
			.locator('#nd-sidebar-mobile')
			.getByRole('button', { name: 'Close Sidebar', exact: true });
		await close.focus();
		await page.keyboard.press('Control+k');
		await page.getByRole('combobox', { name: 'Search documentation' }).fill('lifetime tokens');
		await expect(page.getByRole('option').first()).toContainText('Limits');
		await page.keyboard.press('Escape');
		await expect(page.getByRole('combobox', { name: 'Search documentation' })).toHaveCount(0);
		await expect(close).toBeFocused();
		await close.click();
		await searchForSection(page, 'conditional rules', 'Scopes and inheritance');
		await expect(page).toHaveURL(/\/policies\/scopes#conditional-rules$/);
		await expectReadingRegion(page, 'conditional-rules');
	});
});

test('nested policy popovers keep their header and initial focus within a short viewport', async ({
	page
}) => {
	await page.setViewportSize({ width: 333, height: 504 });
	await page.goto('/docs/policies/limits');
	await page.keyboard.press('Control+k');
	await page.getByRole('combobox', { name: 'Search documentation' }).fill('conditional rules');
	await expect(page.getByRole('dialog').getByRole('option').first()).toContainText(
		'Scopes and inheritance'
	);
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/policies\/scopes#conditional-rules$/);
	await expect(page.getByRole('dialog')).toHaveCount(0);
	const schema = page.locator('[id="policy-fields.rule"]');
	await schema.getByRole('textbox', { name: 'Filter Properties' }).fill('limits');
	await expect(schema.getByRole('button', { name: 'object', exact: true })).toHaveCount(1);
	await schema.getByRole('button', { name: 'object', exact: true }).click();
	const dialog = page.getByRole('dialog');
	const filter = dialog.getByRole('textbox', { name: 'Filter Properties' });
	await filter.fill('spend');
	await filter.press('Enter');
	await expect(filter).toHaveValue('');
	const expectVisiblePopover = () =>
		expect
			.poll(() =>
				dialog.evaluate((element) => {
					const bounds = element.getBoundingClientRect();
					const focused = document.activeElement?.getBoundingClientRect();
					return (
						bounds.top >= 0 &&
						bounds.bottom <= innerHeight &&
						!!focused &&
						focused.top >= bounds.top &&
						focused.bottom <= bounds.bottom
					);
				})
			)
			.toBe(true);
	await expectVisiblePopover();
	await expect(filter).toBeFocused();
	await filter.fill('zzznoproperty');
	await expect(dialog).toContainText('No property matching "zzznoproperty"');
	await expectVisiblePopover();
	for (const viewport of [
		{ width: 1180, height: 757 },
		{ width: 333, height: 504 }
	]) {
		await page.setViewportSize(viewport);
		await expectVisiblePopover();
		await expect(filter).toBeFocused();
	}
	await page.evaluate(() => window.scrollTo(0, 0));
	await expectVisiblePopover();
	await filter.fill('');
	await expect(dialog.getByText('No property matching', { exact: false })).toHaveCount(0);
	await expectVisiblePopover();
	await page.keyboard.press('Escape');
	await expect(dialog).toHaveCount(0);
	const trigger = schema.getByRole('button', { name: 'object', exact: true });
	await expect(trigger).toBeFocused();
	await expect(trigger).toBeInViewport({ ratio: 1 });
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
	for (const field of ['provider', 'rules']) {
		const row = page
			.getByRole('button', { name: `Copy Link: ${field}`, exact: true })
			.locator('../..');
		await expect(row).toContainText('Provider ID');
		await expect(row).not.toContainText('unknown');
		await row.getByRole('button', { name: 'Allowed providers', exact: true }).click();
		const dialog = page.getByRole('dialog');
		await expect(
			dialog.getByRole('button', { name: 'Copy Link: only', exact: true })
		).toBeVisible();
		await expect(
			dialog.getByRole('button', { name: 'Copy Link: order', exact: true })
		).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(dialog).toHaveCount(0);
	}
});

test('API samples are formatted and highlighted with JavaScript disabled', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		for (const endpoint of [
			'openai-compatible/createChatCompletion',
			'openai-compatible/createResponse',
			'catalog/listModels',
			'catalog/getCatalog'
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
			await expect(page.getByRole('button', { name: /Server URL/ })).toContainText(
				'https://api.stogas.ai/'
			);
			await expect(page.getByText('loading...', { exact: true })).toHaveCount(0);
		}
	} finally {
		await context.close();
	}
});

test('switching sample languages preserves highlighting', async ({ page }) => {
	await page.goto('/docs/reference/openai-compatible/createChatCompletion');
	for (const name of ['JavaScript', 'Go', 'Python', 'Java', 'C#', 'Rust', 'cURL']) {
		await page.getByRole('tab', { name, exact: true }).click();
		const sample = page.getByRole('tabpanel', { name, exact: true }).locator('pre');
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
	await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
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
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/docs/reference/openai-compatible/createChatCompletion');
	for (const theme of ['dark', 'light']) {
		await expect(page.locator('html')).toHaveClass(new RegExp(theme));
		await expect(page.getByRole('textbox', { name: 'Request JSON' })).toBeVisible();
		await expect(page.getByText('loading...', { exact: true })).toHaveCount(0);
		// Radix registers the tab group's keyboard entry point during hydration.
		await expect(
			page.getByRole('tablist').filter({ has: page.getByRole('tab', { name: '200', exact: true }) })
		).toHaveAttribute('tabindex', '0');
		await page.evaluate(() => document.fonts.ready);
		expect(
			(
				await new AxeBuilder({ page })
					.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
					.analyze()
			).violations
		).toEqual([]);
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
	await search.fill('Compatibility Notes');
	await expect(
		page
			.getByRole('dialog')
			.getByRole('option', { name: /Compatibility Notes/ })
			.first()
	).toBeVisible();
	const result = page
		.getByRole('dialog')
		.getByRole('option', { name: /Compatibility Notes/ })
		.first();
	expect(
		(
			await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
				.analyze()
		).violations
	).toEqual([]);
	await result.focus();
	await page.keyboard.press('Space');
	await expect(page).toHaveURL(/\/docs\/reference\/provider-behavior/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Compatibility Notes');
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
	await expect(page).toHaveURL(/\/docs(?:#.*)?$/);
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

test('JSON copy controls clear native scrollbars and response status tabs stay usable', async ({
	page,
	context
}) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto('/docs/reference/openai-compatible/createChatCompletion');
	// Short examples must not reserve space for a scrollbar that is not there.
	const shortExample = page.getByRole('tabpanel', { name: 'cURL', exact: true });
	const shortCopy = shortExample.getByRole('button', { name: 'Copy Text', exact: true });
	await expect(async () => {
		const viewportRight = await shortExample
			.getByRole('region')
			.evaluate((element) => element.getBoundingClientRect().left + element.clientWidth);
		const button = await shortCopy.boundingBox();
		expect(button).not.toBeNull();
		expect(viewportRight - button!.x - button!.width).toBeCloseTo(8, 0);
	}).toPass({ timeout: 5000 });
	await page.addStyleTag({
		content:
			'[role="region"] { scrollbar-gutter: stable; } [role="region"]::-webkit-scrollbar { width: 24px; height: 24px; }'
	});
	for (const width of [1440, 320]) {
		await page.setViewportSize({ width, height: 1000 });
		const panel = page.getByRole('tabpanel', { name: '200', exact: true });
		const copy = panel.getByRole('button', { name: /Copy Text|Copied Text/ });
		const viewport = panel.getByRole('region');
		await expect(async () => {
			await viewport.scrollIntoViewIfNeeded();
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
		await copy.click();
		expect(JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))).toHaveProperty(
			'choices'
		);
	}
	const success = page.getByRole('tab', { name: '200', exact: true });
	const error = page.getByRole('tab', { name: '402', exact: true });
	const successColor = await success
		.locator('[data-response-status]')
		.evaluate((e) => getComputedStyle(e).color);
	const errorColor = await error
		.locator('[data-response-status]')
		.evaluate((e) => getComputedStyle(e).color);
	expect(successColor).not.toBe(errorColor);
	await error.click();
	await expect(error).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('tabpanel', { name: '402', exact: true })).toContainText(
		'insufficient_balance'
	);
});

test('single-property schemas omit filtering while nested filters fit their popovers', async ({
	page
}) => {
	await page.goto('/docs/reference/openai-compatible/createChatCompletion');
	await page.getByRole('button', { name: '402', exact: true }).click();
	const response = page.getByRole('region', { name: '402', exact: true });
	await expect(response).toBeVisible();
	await expect(response.getByPlaceholder('Filter Properties')).toHaveCount(0);
	await response.getByRole('button', { name: 'object', exact: true }).click();
	const dialog = page.getByRole('dialog');
	const filter = dialog.getByPlaceholder('Filter Properties');
	await expect(filter).toBeFocused();
	for (const width of [1440, 320]) {
		await page.setViewportSize({ width, height: 1000 });
		await expect
			.poll(() =>
				filter.evaluate((element) => {
					const bounds = element.getBoundingClientRect();
					const parent = element.parentElement!.getBoundingClientRect();
					return (
						bounds.left >= parent.left &&
						bounds.right <= parent.right &&
						parseFloat(getComputedStyle(element).outlineOffset) <= 0
					);
				})
			)
			.toBe(true);
	}
	await filter.fill('message');
	await expect(dialog.getByRole('button', { name: 'Copy Link: message' })).toBeVisible();
	await expect(dialog.getByRole('button', { name: 'Copy Link: code' })).toHaveCount(0);
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
	const editor = page.getByRole('textbox', { name: 'Request JSON' });
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
		await expect(page.getByRole('textbox', { name: 'Request JSON' })).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Request JSON' })).toHaveCSS(
			'font-size',
			'16px'
		);
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

test('SDK folder exposes separate JavaScript and TypeScript guides', async ({ page }) => {
	await page.goto('/docs');
	const sidebar = page.locator('#nd-sidebar');
	const folder = sidebar.getByRole('button', { name: 'SDKs', exact: true });
	await expect(folder).toHaveAttribute('aria-expanded', 'false');
	await folder.click();
	await expect(folder).toHaveAttribute('aria-expanded', 'true');
	await sidebar.getByRole('link', { name: 'JavaScript', exact: true }).click();
	await expect(page).toHaveURL(/\/docs\/javascript$/);
	await expect(page.getByRole('heading', { name: 'JavaScript', exact: true })).toBeVisible();
	await sidebar.getByRole('link', { name: 'TypeScript', exact: true }).click();
	await expect(page).toHaveURL(/\/docs\/typescript$/);
	await expect(page.getByRole('heading', { name: 'TypeScript', exact: true })).toBeVisible();
});
