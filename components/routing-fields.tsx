import { FieldTable } from './field-table';
import { createMarkdownRenderer } from 'fumadocs-core/content/md';
import { routingFields, type RoutingFieldGroup } from '@/lib/routing-fields';

const { MarkdownServer } = createMarkdownRenderer();

export function RoutingFields({ group }: { group: RoutingFieldGroup }) {
	return (
		<FieldTable
			label={`${group} routing fields`}
			fields={routingFields(group).map(({ description, ...field }) => ({
				...field,
				description: <MarkdownServer>{description}</MarkdownServer>
			}))}
		/>
	);
}
