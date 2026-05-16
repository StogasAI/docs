'use client';

import type { AnchorHTMLAttributes, MouseEvent, PointerEvent } from 'react';
import { useEffect, useState } from 'react';
import {
	rewriteStogasUrlForEnvironment,
	rewriteStogasUrlForHost,
	type Environment
} from '@stogas/shared/runtime/config';

function getFallbackEnvironment(): Environment {
	return process.env.NODE_ENV === 'development' ? 'localhost' : 'production';
}

export function getInitialStogasHref(href: string | undefined): string | undefined {
	return href ? rewriteStogasUrlForEnvironment(href, getFallbackEnvironment()) : href;
}

export function resolveStogasHref(href: string | undefined): string | undefined {
	if (!href || typeof window === 'undefined') return getInitialStogasHref(href);
	return rewriteStogasUrlForHost(href, window.location.hostname, {
		isDev: process.env.NODE_ENV === 'development'
	});
}

export function StogasLink({
	href,
	onClick,
	onPointerDown,
	...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
	const [resolvedHref, setResolvedHref] = useState(() => getInitialStogasHref(href));

	const syncHref = (event: MouseEvent<HTMLAnchorElement> | PointerEvent<HTMLAnchorElement>) => {
		const nextHref = resolveStogasHref(href);
		if (!nextHref) return;

		setResolvedHref(nextHref);
		event.currentTarget.href = nextHref;
	};

	useEffect(() => {
		setResolvedHref(resolveStogasHref(href));
	}, [href]);

	return (
		<a
			{...props}
			href={resolvedHref}
			onClick={(event) => {
				syncHref(event);
				onClick?.(event);
			}}
			onPointerDown={(event) => {
				syncHref(event);
				onPointerDown?.(event);
			}}
		/>
	);
}
