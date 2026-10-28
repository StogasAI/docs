import { expect, test } from '@playwright/test';

// Stogas builds receive each environment's onion website and dashboard, which this test expects.
const ONION_HOSTS: Record<string, { marketing?: string; app?: string }> = JSON.parse(
	process.env.NEXT_PUBLIC_STOGAS_ONION_HOSTS || '{}'
);

for (const [environment, { marketing, app }] of Object.entries(ONION_HOSTS)) {
	test(`${environment} onion pages keep Stogas links on its onion addresses`, async ({
		page,
		baseURL
	}) => {
		test.skip(!marketing || !app, `${environment} has no onion website and dashboard`);
		// Browsers cannot resolve onion names, so the local server answers for the onion website.
		await page.route(`http://${marketing}/**`, async (route) => {
			const { pathname, search } = new URL(route.request().url());
			await route.fulfill({
				response: await route.fetch({ url: new URL(pathname + search, baseURL).href })
			});
		});
		await page.goto(`http://${marketing}/docs/quickstart`);
		await expect(page.getByRole('link', { name: 'Landing', exact: true })).toHaveAttribute(
			'href',
			`http://${marketing}/`
		);
		await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toHaveAttribute(
			'href',
			`http://${app}/`
		);
		await expect(
			page.getByRole('article').getByRole('link', { name: 'dashboard', exact: true })
		).toHaveAttribute('href', `http://${app}/`);
	});
}
