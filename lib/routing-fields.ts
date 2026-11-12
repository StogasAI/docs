import registry from '@/content/schemas/routing-fields.json';
import descriptions from '@/content/routing-field-descriptions.json';

export type RoutingFieldGroup =
	| 'author'
	| 'model'
	| 'deployment'
	| 'capabilities'
	| 'data-handling'
	| 'hosting'
	| 'upstream'
	| 'pricing'
	| 'route-provider'
	| 'request';

function groupOf(field: string): RoutingFieldGroup {
	if (field.startsWith('deployment.capabilities.')) return 'capabilities';
	if (field.startsWith('deployment.dataHandling.')) return 'data-handling';
	if (field === 'deployment.hosting' || field === 'deployment.companies') return 'hosting';
	if (field.startsWith('deployment.upstream.')) return 'upstream';
	if (field.startsWith('deployment.pricing.')) return 'pricing';
	if (field.startsWith('route.') || field.startsWith('provider.')) return 'route-provider';
	return field.split('.')[0] as RoutingFieldGroup;
}

// Fields follow the order of the descriptions. An empty description means the name says enough.
for (const name of Object.keys(registry))
	if (!Object.hasOwn(descriptions, name))
		throw new Error(`Missing routing field description: ${name}`);

export function routingFields(group: RoutingFieldGroup) {
	return Object.entries(descriptions)
		.filter(([name]) => groupOf(name) === group)
		.map(([name, description]) => {
			const type = registry[name as keyof typeof registry];
			if (!type) throw new Error(`Unknown routing field: ${name}`);
			return { name, type, description };
		});
}

export function routingFieldsMarkdown(group: RoutingFieldGroup) {
	return (
		'\n| Field | Type | Description |\n| --- | --- | --- |\n' +
		routingFields(group)
			.map(
				({ name, type, description }) =>
					`| \`${name}\` | \`${type}\` | ${description.replaceAll('|', '\\|')} |`
			)
			.join('\n') +
		'\n'
	);
}
