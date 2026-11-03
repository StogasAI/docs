import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const docs = join(__dirname, '../content/docs');
const read = (path: string) => readFileSync(join(docs, path), 'utf8');
const sdkPages = readdirSync(join(docs, '(sdk)'))
	.filter((name) => name.endsWith('.mdx'))
	.map((name) => [name, read(`(sdk)/${name}`)] as const);
const languagePages = sdkPages.filter(
	([name]) => !/^(?:sdk-overview|connection-modes)\.mdx$/.test(name)
);
const javascript = read('(sdk)/javascript.mdx');
const browserWorkers = read('(sdk)/browser-workers.mdx');
const receipts = read('receipts.mdx');
const verification = read('verification.mdx');

test('documents response receipts without legacy headers', () => {
	expect(receipts).toContain('Stogas-Metadata: v2');
	const pages = [
		read('security-model.mdx'),
		verification,
		receipts,
		...sdkPages.map(([, page]) => page)
	];
	for (const legacy of [
		'Stogas-Receipt',
		'X-Stogas-Processed-Hash',
		'X-Stogas-Processed-Signature',
		'X-Stogas-Quote',
		'X-Stogas-Report-Data'
	]) {
		for (const page of pages) expect(page).not.toContain(legacy);
	}
	expect(verification).not.toMatch(/drand|excluded_nodes|BLS signature|Quicknet/);
});

test('uses supported transport entry points without retired modes or polling controls', () => {
	for (const page of [javascript, browserWorkers]) {
		for (const control of ['StogasTransport.create', 'openAIOptions', 'await transport.close()']) {
			expect(page).toContain(control);
		}
		expect(page).not.toContain('bundleRefreshIntervalSeconds');
	}
	for (const control of [
		'Stogas-Metadata',
		'maxConnections',
		'baseURL',
		'fetch',
		'refreshEvidence',
		'evidenceSnapshot',
		'proxied'
	]) {
		expect(javascript).toContain(control);
	}

	expect(languagePages.length).toBeGreaterThan(20);
	for (const [name, page] of languagePages) {
		expect(page, name).not.toMatch(/bundle_refresh|bundle_url|SecurityMode::Both|["']both["']/);
		expect(page.toLowerCase(), name).toMatch(/close|free|drop|release|\busing\b|try \(|\.use/);
	}
});
