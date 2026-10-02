import { defineI18n } from 'fumadocs-core/i18n';
import { uiTranslations } from 'fumadocs-ui/i18n';
import { openapiTranslations } from 'fumadocs-openapi/i18n';
import { messages } from './messages';

export const i18n = defineI18n({
	defaultLanguage: 'en',
	languages: ['en'],
	hideLocale: 'default-locale',
	parser: 'dot'
});

export type Locale = (typeof i18n.languages)[number];

export const translations = i18n
	.translations()
	.extend(uiTranslations())
	.extend(openapiTranslations())
	.extend({ keys: Object.values(messages) })
	.extend({ keys: ['Schema type(schema UI)', 'Content variant'] });

// Server metadata and exports use the same registered messages as the UI provider.
export function getMessage(
	message: (typeof messages)[keyof typeof messages],
	locale: string = i18n.defaultLanguage
): string {
	return (
		translations.get(locale)?.[message] ??
		translations.get(i18n.defaultLanguage)[message] ??
		message
	);
}
