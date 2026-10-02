import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import json from 'shiki/langs/json.mjs';
import shellscript from 'shiki/langs/shellscript.mjs';
import javascript from 'shiki/langs/javascript.mjs';
import go from 'shiki/langs/go.mjs';
import python from 'shiki/langs/python.mjs';
import java from 'shiki/langs/java.mjs';
import csharp from 'shiki/langs/csharp.mjs';
import rust from 'shiki/langs/rust.mjs';
import light from 'shiki/themes/github-light-high-contrast.mjs';
import dark from 'shiki/themes/github-dark.mjs';
import { createShikiFactory } from 'fumadocs-core/highlight/shiki';

// The API's JSON and seven sample languages can render synchronously, including
// during static export. No Suspense fallback or browser script must reveal them.
let instance: ReturnType<typeof createHighlighterCoreSync>;
export function apiHighlighter() {
	return (instance ??= createHighlighterCoreSync({
		langs: [json, shellscript, javascript, go, python, java, csharp, rust],
		themes: [light, dark],
		engine: createJavaScriptRegexEngine()
	}));
}

export const apiShiki = createShikiFactory({ init: apiHighlighter });
