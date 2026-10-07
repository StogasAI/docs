import policy from '@/content/schemas/key-config-v1.json';

const sections = {
	document: policy,
	routing: policy.properties.routing,
	rule: policy.properties.rules.additionalProperties,
	delegation: policy.properties.delegation,
	input: policy.properties.input,
	exportDestination:
		policy.properties.plugins.anyOf[0].properties.stogasExport!.properties.destinations.items,
	recurringSpend:
		policy.properties.limits.properties.spend.properties.recurring.additionalProperties,
	requestLimit: policy.properties.limits.properties.requests.additionalProperties,
	tokenLimit: policy.properties.limits.properties.tokens.additionalProperties,
	accessPeriod: policy.properties.access.properties.deny.items,
	literalRule:
		policy.properties.plugins.anyOf[0].properties.stogasRedaction!.properties.literals.items
};
export type PolicySection = keyof typeof sections;

export const policySectionNames: Record<PolicySection, string> = {
	document: 'Policy document',
	routing: 'routing',
	rule: 'rules.<name>',
	delegation: 'delegation',
	input: 'input',
	exportDestination: 'plugins.stogasExport.destinations[]',
	recurringSpend: 'limits.spend.recurring.<name>',
	requestLimit: 'limits.requests.<name>',
	tokenLimit: 'limits.tokens.<name>',
	accessPeriod: 'access.deny[]',
	literalRule: 'plugins.stogasRedaction.literals[]'
};

// The order follows the document's controls, then its groups of restrictions.
const documentFields = {
	encryption: {
		description: 'Register customer encryption key identifiers by label on an organization policy.',
		href: '/docs/cli#encrypt-plugin-settings'
	},
	$schema: {
		description: 'Optional JSON Schema URL for editor completion. It does not change enforcement.',
		href: '/docs/policies/editing#use-an-external-editor'
	},
	routing: {
		description: 'Filter catalog candidates, choose their order, and bound candidate checks.',
		href: '/docs/policies/routing'
	},
	limits: {
		description: 'Cap spending, tokens, request rates, and concurrent requests.',
		href: '/docs/policies/limits'
	},
	access: {
		description: 'Deny access during scheduled periods.',
		href: '/docs/policies/access#deny-periods'
	},
	input: {
		description: 'Require ASCII-only prompt text before redaction.',
		href: '/docs/plugins/pii-redaction#ascii-only-input'
	},
	plugins: {
		description: 'Extract or redact request text, and export traces to your own destination.',
		href: '/docs/policies#plugins'
	},
	delegation: {
		description: 'Allow or deny saved-policy edits and request policies.',
		href: '/docs/policies/scopes#permission-to-edit-saved-policies'
	},
	rules: {
		description: 'Apply conditional requirements or replaceable defaults using flat named rules.',
		href: '/docs/policies/scopes#conditional-rules'
	}
} satisfies Record<keyof typeof policy.properties, { description: string; href?: string }>;

export function policyDocumentFields() {
	return Object.entries(documentFields).map(([name, summary]) => {
		const field = policy.properties[name as keyof typeof policy.properties];
		return {
			name,
			type:
				'const' in field && name !== '$schema'
					? JSON.stringify(field.const)
					: 'type' in field
						? field.type
						: 'object',
			required:
				'required' in policy && Array.isArray(policy.required) && policy.required.includes(name),
			...summary
		};
	});
}

export function policySection(section: PolicySection) {
	if (!Object.hasOwn(sections, section)) throw new Error(`Unknown policy section: ${section}`);
	return sections[section];
}

// Use the same definitions in the page, Copy Markdown, search and llms-full.txt.
export function policySectionMarkdown(section: PolicySection) {
	if (section === 'document') {
		const rows = policyDocumentFields().map(
			({ name, type, required, description, href }) =>
				`| [\`${name}\`](${href}) | \`${type}\` | ${required ? 'Yes' : 'No'} | ${description.replaceAll('|', '\\|')} |`
		);
		return `\n| Field | Type | Required | Description |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n`;
	}
	return `\n\`\`\`json\n${JSON.stringify(policySection(section), null, 2)}\n\`\`\`\n`;
}
