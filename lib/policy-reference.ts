import policy from '@/content/schemas/key-config-v1.json';
import { withoutEnvelopes } from '@/lib/policy-settings';

const sections = {
	document: policy,
	routing: policy.properties.routing,
	rule: policy.properties.rules.additionalProperties,
	delegation: policy.properties.delegation,
	input: policy.properties.input,
	timeouts: policy.properties.timeouts,
	// A value that can be encrypted takes its settings, the first form, or an envelope.
	exportDestination:
		policy.properties.plugins.properties.export.anyOf[0]!.properties.destinations!.anyOf[0]!
			.items!.anyOf[0]!,
	limit: policy.properties.limits.additionalProperties,
	limitPeriod: policy.properties.limits.additionalProperties.properties.per,
	accessPeriod: policy.properties.access.properties.deny.items,
	literalRule:
		policy.properties.plugins.properties.redaction.anyOf[0]!.properties.literals!.anyOf[0]!.items!
			.anyOf[0]!
};
export type PolicySection = keyof typeof sections;

export const policySectionNames: Record<PolicySection, string> = {
	document: 'Policy document',
	routing: 'routing',
	rule: 'rules.<name>',
	delegation: 'delegation',
	input: 'input',
	timeouts: 'timeouts',
	exportDestination: 'plugins.export.destinations[]',
	limit: 'limits.<name>',
	limitPeriod: 'limits.<name>.per',
	accessPeriod: 'access.deny[]',
	literalRule: 'plugins.redaction.literals[]'
};

// The order follows the document's controls, then its groups of restrictions.
const documentFields = {
	$schema: {
		description: 'Optional JSON Schema URL for editor completion. It does not change enforcement.',
		href: '/docs/policies/editing#use-an-external-editor'
	},
	routing: {
		description: 'Filter catalog candidates, choose deployment targets, and bound total attempts.',
		href: '/docs/policies/routing'
	},
	limits: {
		description: 'Cap spending, tokens, requests and concurrent requests, in total or per period.',
		href: '/docs/policies/limits'
	},
	timeouts: {
		description: 'Bound caller wait time and the wait between useful provider outputs.',
		href: '/docs/policies/timeouts'
	},
	access: {
		description:
			'Deny requests during scheduled periods, or accept them only from listed networks.',
		href: '/docs/policies/access#deny-periods'
	},
	input: {
		description: 'Require ASCII-only prompt text before redaction.',
		href: '/docs/pii-redaction#ascii-only-input'
	},
	plugins: {
		description: 'Extract or redact request text, and export request JSON to your own webhook.',
		href: '/docs/policies#plugins'
	},
	delegation: {
		description: 'Allow or deny saved-policy edits and request policies.',
		href: '/docs/policies/delegation'
	},
	rules: {
		description: 'Apply conditional requirements or replaceable defaults using flat named rules.',
		href: '/docs/policies/rules'
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
	return withoutEnvelopes(sections[section]);
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
