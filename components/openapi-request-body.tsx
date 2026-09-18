'use client';

import { Custom } from 'fumadocs-openapi/playground/client';
import { useEffect, useId, useRef, useState } from 'react';

export function OpenAPIRequestBody() {
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
		<div className="flex min-w-0 flex-col gap-2">
			<label htmlFor={id} className="text-fd-muted-foreground text-sm">
				Request JSON
			</label>
			<textarea
				ref={input}
				id={id}
				name="request-body"
				value={text}
				spellCheck={false}
				autoComplete="off"
				aria-invalid={Boolean(error)}
				aria-describedby={error ? `${id}-error` : undefined}
				className="bg-fd-background text-fd-foreground min-h-64 w-full resize-y rounded-lg p-3 font-mono text-sm leading-relaxed"
				onChange={(event) => {
					const nextText = event.target.value;
					setText(nextText);
					let message = '';
					try {
						const parsed: unknown = JSON.parse(nextText);
						if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
							message = 'Enter a JSON object for the request body.';
						} else {
							lastValue.current = parsed;
							setValue(parsed);
						}
					} catch {
						message = 'Enter valid JSON before sending the request.';
					}
					event.target.setCustomValidity(message);
					setError(message);
				}}
			/>
			<p id={`${id}-error`} role="status" className="text-fd-error text-sm empty:hidden">
				{error}
			</p>
		</div>
	);
}
