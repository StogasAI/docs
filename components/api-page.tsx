import client from '@/components/api-page.client';
import { codeUsages } from '@/lib/openapi-code-usage';
import { openapi } from '@/lib/openapi';
import { createAPIPage } from 'fumadocs-openapi/ui';
import { StyleInjector } from './style-injector';

const BaseAPIPage = createAPIPage(openapi, {
  client,
  codeUsages,
  generateTypeScriptDefinitions: false,
  playground: {
    enabled: true,
  },
});

export function APIPage(props: any) {
  return (
    <>
      <StyleInjector />
      <BaseAPIPage {...props} />
    </>
  );
}
