'use client';

import type { AnchorHTMLAttributes, MouseEvent, PointerEvent } from 'react';
import { useEffect, useState } from 'react';

type Environment = 'development' | 'localhost' | 'staging' | 'production';
type Segment = 'marketing' | 'app' | 'api' | 'pay';
type Deployment = Record<Segment, string | undefined>;

const DEPLOYMENTS: Record<Environment, Deployment> = {
	development: {
		api: 'api-dev.stogas.ai',
		app: 'app-dev.stogas.ai',
		marketing: 'dev.stogas.ai',
		pay: undefined
	},
	localhost: {
		api: 'api.stogas.localhost',
		app: 'app.stogas.localhost',
		marketing: 'stogas.localhost',
		pay: undefined
	},
	production: {
		api: 'api.stogas.ai',
		app: 'app.stogas.ai',
		marketing: 'stogas.ai',
		pay: 'pay.stogas.ai'
	},
	staging: {
		api: 'api-staging.stogas.ai',
		app: 'app-staging.stogas.ai',
		marketing: 'staging.stogas.ai',
		pay: undefined
	}
};

const HOST_TO_SEGMENT = new Map<string, { environment: Environment; segment: Segment }>();
for (const [environment, deployment] of Object.entries(DEPLOYMENTS) as [
	Environment,
	Deployment
][]) {
	for (const [segment, host] of Object.entries(deployment) as [Segment, string | undefined][]) {
		if (host) HOST_TO_SEGMENT.set(host, { environment, segment });
	}
}
HOST_TO_SEGMENT.set('www.stogas.ai', { environment: 'production', segment: 'marketing' });

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

function detectEnvironment(hostname: string, isDev: boolean): Environment {
	const host = normalizeHostname(hostname);
	const known = HOST_TO_SEGMENT.get(host);
	if (known) return known.environment;
	if (isLoopbackHostname(host)) return 'localhost';
	return isDev ? 'localhost' : 'production';
}

function rewriteStogasUrl(href: string, environment: Environment): string {
	let url: URL;
	try {
		url = new URL(href);
	} catch {
		return href;
	}

	const target = HOST_TO_SEGMENT.get(url.hostname.toLowerCase());
	if (!target) return href;
	const replacement = DEPLOYMENTS[environment][target.segment];
	if (!replacement) return href;

	url.protocol = 'https:';
	url.hostname = replacement;
	url.port = '';
	if (target.segment === 'app' && url.pathname === '/') url.pathname = '/overview';
	return url.toString();
}

export function getInitialStogasHref(href: string | undefined): string | undefined {
	return href ? rewriteStogasUrl(href, getFallbackEnvironment()) : href;
}

export function resolveStogasHref(href: string | undefined): string | undefined {
	if (!href || typeof window === 'undefined') return getInitialStogasHref(href);
	return rewriteStogasUrl(
		href,
		detectEnvironment(window.location.hostname, process.env.NODE_ENV === 'development')
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
