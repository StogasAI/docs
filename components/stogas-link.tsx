'use client';

import type { AnchorHTMLAttributes, MouseEvent, PointerEvent } from 'react';
import { useEffect, useState } from 'react';

const deployments = {
	localhost: {
		api: 'api.stogas.localhost',
		app: 'app.stogas.localhost',
		marketing: 'stogas.localhost'
	},
	staging: {
		api: 'api-staging.stogas.ai',
		app: 'app-staging.stogas.ai',
		marketing: 'staging.stogas.ai'
	},
	production: {
		api: 'api.stogas.ai',
		app: 'app.stogas.ai',
		marketing: 'stogas.ai'
	}
} as const;

type Deployment = keyof typeof deployments;
type Segment = keyof (typeof deployments)['production'];

const stogasHosts = new Map<string, Segment>();
for (const deployment of Object.values(deployments)) {
	stogasHosts.set(deployment.api, 'api');
	stogasHosts.set(deployment.app, 'app');
	stogasHosts.set(deployment.marketing, 'marketing');
}
stogasHosts.set('www.stogas.ai', 'marketing');

function getCurrentDeployment(hostname: string): Deployment {
	const host = hostname.toLowerCase();
	if (host === 'staging.stogas.ai') return 'staging';
	if (host === 'stogas.localhost' || host.endsWith('.localhost') || host === 'localhost' || host === '127.0.0.1') return 'localhost';
	return 'production';
}

function getFallbackDeployment(): Deployment {
	return process.env.NODE_ENV === 'development' ? 'localhost' : 'production';
}

function rewriteHrefForDeployment(href: string, deployment: Deployment): string {
	let url: URL;
	try {
		url = new URL(href);
	} catch {
		return href;
	}

	const segment = stogasHosts.get(url.hostname.toLowerCase());
	if (!segment) return href;

	url.protocol = 'https:';
	url.hostname = deployments[deployment][segment];
	url.port = '';
	if (segment === 'app' && url.pathname === '/') url.pathname = '/overview';
	return url.toString();
}

export function getInitialStogasHref(href: string | undefined): string | undefined {
	return href ? rewriteHrefForDeployment(href, getFallbackDeployment()) : href;
}

export function resolveStogasHref(href: string | undefined): string | undefined {
	if (!href || typeof window === 'undefined') return getInitialStogasHref(href);
	return rewriteHrefForDeployment(href, getCurrentDeployment(window.location.hostname));
}

export function StogasLink({ href, onClick, onPointerDown, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
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
