import { createCodeUsageGeneratorRegistry } from 'fumadocs-openapi/requests/generators';
import { csharp } from 'fumadocs-openapi/requests/generators/csharp';
import { curl } from 'fumadocs-openapi/requests/generators/curl';
import { go } from 'fumadocs-openapi/requests/generators/go';
import { java } from 'fumadocs-openapi/requests/generators/java';
import { javascript } from 'fumadocs-openapi/requests/generators/javascript';
import { python } from 'fumadocs-openapi/requests/generators/python';
import { rust } from 'fumadocs-openapi/requests/generators/rust';

// The samples use only the languages that lib/api-highlight.ts loads. Shiki's Ruby grammar
// embeds a dozen other languages, about 2 MB, so the Ruby sample stays out.
export const codeUsages = createCodeUsageGeneratorRegistry();

codeUsages.add('curl', curl);
codeUsages.add('js', javascript);
codeUsages.add('go', go);
codeUsages.add('python', python);
codeUsages.add('java', java);
codeUsages.add('csharp', csharp);
codeUsages.add('rust', rust);
