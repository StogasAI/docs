'use client';

import { Schema } from './api/schema';
import type { JsonSchema } from '@fumadocs/json-schema';

export function PolicyFieldsClient({
	root,
	name,
	rootId
}: {
	root: JsonSchema;
	name: string;
	rootId: string;
}) {
	return (
		<Schema
			root={root}
			client={{ rootId, name, as: 'body' }}
			renderMarkdown={(text) => <p>{text}</p>}
			renderCodeblock={({ code }) => (
				<pre>
					<code>{code}</code>
				</pre>
			)}
		/>
	);
}
