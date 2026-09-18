import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	workers: 2,
	use: {
		baseURL: 'http://127.0.0.1:4174',
		browserName: 'chromium',
		viewport: { width: 1440, height: 1000 },
		colorScheme: 'light',
		trace: 'off',
		screenshot: 'off',
		video: 'off'
	},
	webServer: {
		command: 'bunx wrangler dev --env local --port 4174 --inspector-port 0',
		url: 'http://127.0.0.1:4174/docs',
		timeout: 30_000
	}
});
