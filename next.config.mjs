import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();
const appDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
	output: 'export',
	reactStrictMode: true,
	turbopack: {
		root: path.resolve(appDir, '../..')
	}
};

export default withMDX(config);
