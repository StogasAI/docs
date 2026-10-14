import registry from '@/content/schemas/routing-fields.json';
import descriptions from '@/content/routing-field-descriptions.json';

export type RoutingFieldGroup =
	| 'author'
	| 'model'
	| 'deployment'
	| 'capabilities'
	| 'data-handling'
	| 'upstream'
	| 'pricing'
	| 'route-provider'
	| 'request';

function groupOf(field: string): RoutingFieldGroup {
	if (field.startsWith('deployment.capabilities.')) return 'capabilities';
	if (field.startsWith('deployment.dataHandling.')) return 'data-handling';
	if (field.startsWith('deployment.upstream.')) return 'upstream';
	if (field.startsWith('deployment.pricing.')) return 'pricing';
	if (field.startsWith('route.') || field.startsWith('provider.')) return 'route-provider';
	return field.split('.')[0] as RoutingFieldGroup;
}

export function routingFields(group: RoutingFieldGroup) {
	return Object.entries(registry)
		.filter(([name]) => groupOf(name) === group)
		.map(([name, type]) => {
			const description = descriptions[name as keyof typeof descriptions];
			if (!description) throw new Error(`Missing routing field description: ${name}`);
			return { name, type, description };
		});
}

export function routingFieldsMarkdown(group: RoutingFieldGroup) {
	return (
		'\n| Field | Type | Meaning |\n| --- | --- | --- |\n' +
		routingFields(group)
			.map(
				({ name, type, description }) =>
					`| \`${name}\` | \`${type}\` | ${description.replaceAll('|', '\\|')} |`
			)
			.join('\n') +
		'\n'
	);
}
