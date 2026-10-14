'use client';

import { useTranslations } from '@fuma-translate/react';
import { messages } from '@/lib/messages';

import { Custom } from 'fumadocs-openapi/ui/playground/client';
import { useEffect, useId, useRef, useState } from 'react';

export function OpenAPIRequestBody() {
	const t = useTranslations();
	const { value, setValue } = Custom.useController(['body']);
	const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
	const [error, setError] = useState('');
	const lastValue = useRef(value);
	const input = useRef<HTMLTextAreaElement>(null);
	const id = useId();

	useEffect(() => {
		if (value === lastValue.current) return;
		lastValue.current = value;
		setText(JSON.stringify(value ?? {}, null, 2));
		setError('');
		input.current?.setCustomValidity('');
	}, [value]);

	return (
		<div className="flex min-w-0 flex-col">
			<textarea
				ref={input}
				aria-label={t(messages.requestJson)}
				name="request-body"
				value={text}
				spellCheck={false}
				autoComplete="off"
				aria-invalid={Boolean(error)}
				aria-describedby={error ? `${id}-error` : undefined}
				className="focus-visible:ring-fd-ring field-sizing-content min-h-60 w-full resize-none bg-transparent px-4 py-3 font-mono text-[0.8125rem] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-inset"
				onChange={(event) => {
					const nextText = event.target.value;
					setText(nextText);
					let message = '';
					try {
						const parsed: unknown = JSON.parse(nextText);
						if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
							message = t(messages.requestObjectRequired);
						} else {
							lastValue.current = parsed;
							setValue(parsed);
						}
					} catch {
						message = t(messages.requestJsonInvalid);
					}
					event.target.setCustomValidity(message);
					setError(message);
				}}
			/>
			<p
				id={`${id}-error`}
				role="status"
				className="text-fd-error border-t px-4 py-2 font-mono text-xs empty:hidden"
			>
				{error}
			</p>
		</div>
	);
}
