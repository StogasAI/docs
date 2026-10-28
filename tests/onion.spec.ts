import { expect, test, type Locator, type Page } from '@playwright/test';

// Stogas builds receive each environment's onion website and dashboard, which this test expects.
const ONION_HOSTS: Record<string, { marketing?: string; app?: string }> = JSON.parse(
	process.env.NEXT_PUBLIC_STOGAS_ONION_HOSTS || '{}'
);

/** The address a link opens, after the browser resolves it against the page. */
function destination(link: Locator) {
	return link.evaluate((element) => (element as HTMLAnchorElement).href);
}

test('Stogas links stay on the address that served the page before JavaScript runs', async ({
	browser
}) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto('/docs/models');
		const landing = page.getByRole('link', { name: 'Landing', exact: true });
		await expect(landing).toHaveAttribute('href', '/');
		// Website links leave Docs as before, instead of through client-side navigation.
		await expect(landing).toHaveAttribute('target', '_blank');
		await expect(
			page.getByRole('article').getByRole('link', { name: 'model catalog', exact: true })
		).toHaveAttribute('href', '/catalog');
		// The website redirects this path to the dashboard of its own environment.
		await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute(
			'href',
			'/trust'
		);
		await page.goto('/docs/quickstart');
		await expect(
			page.getByRole('article').getByRole('link', { name: 'dashboard', exact: true })
		).toHaveAttribute('href', '/trust');
	} finally {
		await context.close();
	}
});

// Prefetches of other pages may still be in flight when a test ends.
test.afterEach(({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));

/** Opens a Docs page at the onion website, which the local server answers for. */
async function openOnionPage(page: Page, baseURL: string | undefined, onion: string, path: string) {
	// Browsers cannot resolve onion names.
	await page.route(`http://${onion}/**`, async (route) => {
		const { pathname, search } = new URL(route.request().url());
		await route.fulfill({
			response: await route.fetch({ url: new URL(pathname + search, baseURL).href })
		});
	});
	await page.goto(`http://${onion}${path}`);
}

for (const [environment, { marketing, app }] of Object.entries(ONION_HOSTS)) {
	test(`${environment} onion pages link to its onion dashboard`, async ({ page, baseURL }) => {
		test.skip(!marketing || !app, `${environment} has no onion website and dashboard`);
		await openOnionPage(page, baseURL, marketing!, '/docs/quickstart');
		await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute(
			'href',
			`http://${app}/`
		);
		await expect(
			page.getByRole('article').getByRole('link', { name: 'dashboard', exact: true })
		).toHaveAttribute('href', `http://${app}/`);
	});

	test(`${environment} onion pages keep website links on its onion website`, async ({
		page,
		baseURL
	}) => {
		test.skip(!marketing || !app, `${environment} has no onion website and dashboard`);
		await openOnionPage(page, baseURL, marketing!, '/docs/models');
		// The dashboard link moves to the onion dashboard once the page hydrates.
		await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute(
			'href',
			`http://${app}/`
		);
		// Website links stay relative, so they keep resolving against the onion address.
		const landing = page.getByRole('link', { name: 'Landing', exact: true });
		const catalog = page.getByRole('article').getByRole('link', { name: 'model catalog' });
		await expect(landing).toHaveAttribute('href', '/');
		expect(await destination(landing)).toBe(`http://${marketing}/`);
		await expect(catalog).toHaveAttribute('href', '/catalog');
		expect(await destination(catalog)).toBe(`http://${marketing}/catalog`);
	});
}
