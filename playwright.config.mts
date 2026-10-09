import { defineConfig } from '@playwright/test';
import { createServer } from 'node:net';

if (!process.env.DOCS_BROWSER_ORIGIN) {
	const probe = createServer();
	await new Promise<void>((resolve, reject) => {
		probe.once('error', reject);
		probe.listen(0, '127.0.0.1', resolve);
	});
	const address = probe.address();
	if (!address || typeof address === 'string') throw new Error('No Docs test port available');
	const port = address.port;
	await new Promise<void>((resolve, reject) =>
		probe.close((error) => (error ? reject(error) : resolve()))
	);
	process.env.DOCS_BROWSER_ORIGIN = `http://127.0.0.1:${port}`;
}
const origin = process.env.DOCS_BROWSER_ORIGIN;
const port = new URL(origin).port;

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	workers: 2,
	use: {
		baseURL: origin,
		browserName: 'chromium',
		viewport: { width: 1440, height: 1000 },
		colorScheme: 'light',
		trace: 'off',
		screenshot: 'off',
		video: 'off'
	},
	webServer: {
		command: `bunx wrangler dev --env local --port ${port} --inspector-port 0`,
		url: `${origin}/docs`,
		timeout: 30_000
	}
});
