import spec from '@/content/openapi/stogas.json';
import { createOpenAPI } from 'fumadocs-openapi/server';

export const openapi = createOpenAPI({
	input: {
		stogas: spec as any
	}
});
