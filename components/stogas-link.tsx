'use client';

import Link from 'fumadocs-core/link';
import type { AnchorHTMLAttributes, MouseEvent, PointerEvent } from 'react';
import { useEffect, useState } from 'react';

type Environment = 'development' | 'localhost' | 'staging' | 'production';
type Segment = 'marketing' | 'app' | 'api';
type Deployment = Record<Segment, string>;
type Page = { environment: Environment; onion: boolean };
const ENVIRONMENTS: readonly Environment[] = ['development', 'localhost', 'staging', 'production'];
const SEGMENTS: readonly Segment[] = ['marketing', 'app', 'api'];

const DEPLOYMENTS: Record<Environment, Deployment> = {
	development: {
		api: 'api-dev.stogas.ai',
		app: 'app-dev.stogas.ai',
		marketing: 'dev.stogas.ai'
	},
	localhost: {
		api: 'api.stogas.localhost',
		app: 'app.stogas.localhost',
		marketing: 'stogas.localhost'
	},
	production: {
		api: 'api.stogas.ai',
		app: 'app.stogas.ai',
		marketing: 'stogas.ai'
	},
	staging: {
		api: 'api-staging.stogas.ai',
		app: 'app-staging.stogas.ai',
		marketing: 'staging.stogas.ai'
	}
};

/**
 * The onion website and dashboard of each environment. Stogas builds add them from the private host
 * table, so this public source names no onion address. Onion pages reach the API by its clearnet
 * name, because browsers check its certificate.
 */
const ONION_HOSTS: Partial<Record<Environment, Partial<Record<Segment, string>>>> = JSON.parse(
	process.env.NEXT_PUBLIC_STOGAS_ONION_HOSTS || '{}'
);

const HOST_TO_SEGMENT = new Map<string, Page & { segment: Segment }>();

for (const environment of ENVIRONMENTS) {
	const deployment = DEPLOYMENTS[environment];
	for (const segment of SEGMENTS) {
		HOST_TO_SEGMENT.set(deployment[segment], { environment, segment, onion: false });
		const onion = ONION_HOSTS[environment]?.[segment];
		if (onion) HOST_TO_SEGMENT.set(onion, { environment, segment, onion: true });
	}
}
HOST_TO_SEGMENT.set('www.stogas.ai', {
	environment: 'production',
	segment: 'marketing',
	onion: false
});

function getFallbackEnvironment(): Environment {
	return process.env.NODE_ENV === 'development' ? 'localhost' : 'production';
}

function normalizeHostname(hostname: string) {
	const value = hostname.trim().toLowerCase();
	const bracketed = /^\[([^\]]+)](?::\d+)?$/.exec(value);
	if (bracketed) return bracketed[1];
	return value.includes(':') && !value.includes('::') ? value.replace(/:\d+$/, '') : value;
}

function isLoopbackHostname(hostname: string) {
	if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1')
		return true;
	const octets = hostname.split('.');
	return (
		octets.length === 4 &&
		octets[0] === '127' &&
		octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255)
	);
}

function detectPage(hostname: string, isDev: boolean): Page {
	const host = normalizeHostname(hostname);
	const known = HOST_TO_SEGMENT.get(host);
	if (known) return known;
	if (isLoopbackHostname(host)) return { environment: 'localhost', onion: false };
	return { environment: isDev ? 'localhost' : 'production', onion: false };
}

function rewriteStogasUrl(href: string, page: Page): string {
	let url: URL;
	try {
		url = new URL(href);
	} catch {
		return href;
	}

	const target = HOST_TO_SEGMENT.get(url.hostname.toLowerCase());
	if (!target) return href;
	// Onion pages use plain HTTP, because Tor encrypts the connection.
	const onion = page.onion ? ONION_HOSTS[page.environment]?.[target.segment] : undefined;
	url.protocol = onion ? 'http:' : 'https:';
	url.hostname = onion ?? DEPLOYMENTS[page.environment][target.segment];
	url.port = '';
	return url.toString();
}

function getInitialStogasHref(href: string | undefined): string | undefined {
	return href
		? rewriteStogasUrl(href, { environment: getFallbackEnvironment(), onion: false })
		: href;
}

function resolveStogasHref(href: string | undefined): string | undefined {
	if (!href || typeof window === 'undefined') return getInitialStogasHref(href);
	return rewriteStogasUrl(
		href,
		detectPage(window.location.hostname, process.env.NODE_ENV === 'development')
	);
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
		<Link
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
