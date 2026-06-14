import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

const withMDX = createMDX();
const appDir = path.dirname(fileURLToPath(import.meta.url));

const createConfig = (phase) => {
	/** @type {import('next').NextConfig} */
	const config = {
		reactStrictMode: true,
		turbopack: {
			root: path.resolve(appDir, '../..')
		}
	};

	if (phase !== PHASE_DEVELOPMENT_SERVER) {
		config.output = 'export';
	}

	return withMDX(config);
};

export default createConfig;
