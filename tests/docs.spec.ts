import AxeBuilder from '@axe-core/playwright';
import { expect, test as base } from '@playwright/test';

const test = base.extend({
	page: async ({ page }, use) => {
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));
		await use(page);
		expect(errors).toEqual([]);
	}
});

test('API examples arrive highlighted with the real URL before hydration', async ({ page }) => {
	let releaseScripts!: () => void;
	const scripts = new Promise<void>((resolve) => {
		releaseScripts = resolve;
	});
	await page.route('**/*.js', async (route) => {
		await scripts;
		await route.continue();
	});
	try {
		await page.goto('/docs/reference/openai-compatible/createChatCompletion', {
			waitUntil: 'commit'
		});
		const examples = page.locator('.stogas-api-operation-examples');
		await expect(examples.locator('pre [style*="--shiki-"]').first()).toBeVisible();
		await expect(examples.locator('pre').first()).toContainText(
			'https://api.stogas.ai/v1/chat/completions'
		);
		await expect(page.getByRole('button', { name: /Server URL/ })).toContainText(
			'https://api.stogas.ai/'
		);
		await expect(page.getByText('loading...', { exact: true })).toHaveCount(0);
	} finally {
		releaseScripts();
	}
	await page.waitForLoadState('load');
	await page.getByRole('tab', { name: 'JavaScript', exact: true }).click();
	await expect(
		page.getByRole('tabpanel', { name: 'JavaScript', exact: true }).locator('pre')
	).toContainText('fetch(');
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
	const search = page.getByRole('textbox', { name: 'Search documentation' });
	await search.fill('Quickstart');
	await expect(
		page
			.getByRole('dialog')
			.getByRole('button', { name: /Quickstart/ })
			.first()
	).toBeVisible();
	await search.fill('Compatibility Notes');
	await expect(
		page
			.getByRole('dialog')
			.getByRole('button', { name: /Compatibility Notes/ })
			.first()
	).toBeVisible();
	const result = page
		.getByRole('dialog')
		.getByRole('button', { name: /Compatibility Notes/ })
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
		const viewportRight = await shortExample.getByRole('region').evaluate(
			(element) => element.getBoundingClientRect().left + element.clientWidth
		);
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
	await page.keyboard.press('Control+k');
	await expect(page.getByRole('textbox', { name: 'Search documentation' })).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toHaveCount(0);
});
