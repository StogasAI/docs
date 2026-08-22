'use client';

import { useEffect } from 'react';

const STATUS_TITLES: Record<string, string> = {
	'200': 'OK',
	'400': 'Bad Request Error',
	'401': 'Unauthorized Error',
	'402': 'Payment Required Error',
	'403': 'Forbidden Error',
	'404': 'Not Found Error',
	'409': 'Conflict Error',
	'413': 'Payload Too Large Error',
	'429': 'Too Many Requests Error',
	'500': 'Internal Server Error',
	'503': 'Service Unavailable Error'
};

function responseStatusText(element: Element) {
	for (const node of element.childNodes) {
		const status = node.nodeType === Node.TEXT_NODE ? node.textContent?.trim() : undefined;
		if (status && STATUS_TITLES[status]) return { node, status };
	}
	return null;
}

function responseStatusPill(status: string) {
	const pill = document.createElement('span');
	pill.className = status.startsWith('2')
		? 'bg-green-500/10 px-1.5 py-0.5 rounded-md font-mono font-medium text-sm text-green-500'
		: 'bg-red-500/10 px-1.5 py-0.5 rounded-md font-mono font-medium text-sm text-red-500';
	pill.textContent = status;
	return pill;
}

export function StyleInjector() {
	useEffect(() => {
		const simplifyServerUrlDialog = () => {
			document.querySelectorAll('[role="dialog"]').forEach((dialog) => {
				const hasServerTitle = Array.from(
					dialog.querySelectorAll('h2, [data-slot="dialog-title"]')
				).some((el) => el.textContent?.trim() === 'Server URL');
				if (!hasServerTitle) return;

				dialog.querySelectorAll<HTMLParagraphElement>('p').forEach((paragraph) => {
					if (paragraph.textContent?.trim() === 'The base URL of your API endpoint.') {
						paragraph.style.display = 'none';
					}
				});

				const combobox = dialog.querySelector<HTMLElement>('[role="combobox"]');
				if (combobox && !combobox.getAttribute('data-stogas-hidden-server-select')) {
					combobox.setAttribute('data-stogas-hidden-server-select', 'true');
					combobox.style.display = 'none';
				}

				dialog.querySelectorAll<HTMLLabelElement>('label').forEach((label) => {
					const labelText = label.textContent?.trim();
					if (labelText === 'serverUrl' || labelText === 'URL') {
						label.style.display = 'none';
					}
				});
			});
		};

		const syncPlaygroundNumberInputs = () => {
			document.querySelectorAll('input[type="number"]:not([step])').forEach((input) => {
				input.setAttribute('step', '0.01');
			});
		};

		const observer = new MutationObserver(() => {
			simplifyServerUrlDialog();
			syncPlaygroundNumberInputs();

			// 1. Style the left-side Accordion triggers
			document
				.querySelectorAll<HTMLButtonElement>('button[aria-expanded]:not([role="tab"])')
				.forEach((el) => {
					const responseStatus = responseStatusText(el);
					if (responseStatus && !el.getAttribute('data-styled')) {
						const { node, status } = responseStatus;
						el.setAttribute('data-styled', 'true');
						if (status.startsWith('4') || status.startsWith('5')) {
							el.classList.add('text-red-500');
						} else {
							el.classList.add('text-green-500');
						}
						el.replaceChild(responseStatusPill(status), node);

						// Inject the title (without the dash)
						const titleSpan = document.createElement('span');
						titleSpan.textContent = ` ${STATUS_TITLES[status]}`;
						titleSpan.className = 'ml-2 text-fd-muted-foreground font-sans font-normal text-sm';
						el.appendChild(titleSpan);

						// Sync left accordion click to right pane tabs
						el.addEventListener('click', () => {
							const isOpening = el.getAttribute('aria-expanded') === 'false';

							if (isOpening) {
								const tabs = document.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
								tabs.forEach((tab) => {
									const tabText = tab.textContent?.trim();
									if (tabText && tabText.startsWith(status)) {
										// Radix UI Tabs often require pointerdown/mousedown instead of just a click
										tab.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
										tab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
										tab.click();
									}
								});

								// Enforce type="single" by closing any other open response accordions
								setTimeout(() => {
									const openAccordions = document.querySelectorAll<HTMLButtonElement>(
										'button[aria-expanded="true"]:not([role="tab"])'
									);
									openAccordions.forEach((acc) => {
										if (acc !== el && acc.getAttribute('data-styled') === 'true') {
											acc.setAttribute('data-programmatic-close', 'true');
											acc.click();
										}
									});
								}, 10);
							} else {
								// Accordion is closing
								if (el.getAttribute('data-programmatic-close') === 'true') {
									el.removeAttribute('data-programmatic-close');
								} else {
									// User manually closed it, revert right side to 200
									const tabs = document.querySelectorAll<HTMLButtonElement>('button[role="tab"]');
									tabs.forEach((tab) => {
										const tabText = tab.textContent?.trim();
										if (tabText && tabText.startsWith('200')) {
											tab.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
											tab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
											tab.click();
										}
									});
								}
							}
						});
					}
				});

			// 2. Style the right-side Tabs
			document.querySelectorAll<HTMLButtonElement>('button[role="tab"]').forEach((el) => {
				const responseStatus = responseStatusText(el);
				if (responseStatus && !el.getAttribute('data-styled')) {
					el.setAttribute('data-styled', 'true');
					el.replaceChild(responseStatusPill(responseStatus.status), responseStatus.node);
				}
			});
		});

		observer.observe(document.body, { childList: true, subtree: true });
		simplifyServerUrlDialog();
		syncPlaygroundNumberInputs();
		return () => observer.disconnect();
	}, []);

	return null;
}
