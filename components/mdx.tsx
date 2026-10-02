import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import { OpenAPIPage } from './openapi-page';
import { StogasLink } from './stogas-link';
import { RoutingFields } from './routing-fields';
import { PolicyFields } from './policy-fields';

export function getMDXComponents(components?: MDXComponents) {
	return {
		...defaultMdxComponents,
		Accordion,
		Accordions,
		OpenAPIPage,
		PolicyFields,
		RoutingFields,
		Step,
		Steps,
		Tab,
		Tabs,
		a: StogasLink,
		...components
	} satisfies MDXComponents;
}

declare global {
	type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
