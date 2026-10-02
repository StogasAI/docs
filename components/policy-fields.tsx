import type { JsonSchema } from '@fumadocs/json-schema';
import {
	policySection,
	policySectionNames,
	policyDocumentFields,
	type PolicySection
} from '@/lib/policy-reference';
import { PolicyFieldsClient } from './policy-fields.client';
import { FieldTable } from './field-table';

export function PolicyFields({ section }: { section: PolicySection }) {
	if (section === 'document')
		return <FieldTable label="Policy document fields" fields={policyDocumentFields()} />;
	return (
		<PolicyFieldsClient
			root={policySection(section) as JsonSchema}
			name={policySectionNames[section]}
			rootId={`policy-fields.${section}`}
		/>
	);
}
