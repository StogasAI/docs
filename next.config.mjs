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
		agentRules: false,
		turbopack: {
			root: path.resolve(appDir, '../..')
		}
	};

	if (phase === PHASE_DEVELOPMENT_SERVER) {
		// The build copies each page's Markdown to its `.md` URL (scripts/copy-markdown.ts).
		config.rewrites = async () => [
			{ source: '/docs.md', destination: '/llms.mdx/docs/content.md' },
			{ source: '/docs/reference.md', destination: '/llms.mdx/reference/content.md' },
			{
				source: '/docs/reference/:path*.md',
				destination: '/llms.mdx/reference/:path*/content.md'
			},
			{ source: '/docs/:path*.md', destination: '/llms.mdx/docs/:path*/content.md' }
		];
	} else {
		config.output = 'export';
	}

	return withMDX(config);
};

export default createConfig;
