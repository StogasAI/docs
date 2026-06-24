'use client';

import { codeUsages } from '@/lib/openapi-code-usage';
import { defineClientConfig } from 'fumadocs-openapi/ui/client';

export default defineClientConfig({
	codeUsages,
	playground: {
		requestTimeout: 45_000
	}
});
