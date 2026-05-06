'use client';

import { useEffect } from 'react';

const STATUS_TITLES: Record<string, string> = {
	'200': 'OK',
	'400': 'Bad Request Error',
	'401': 'Unauthorized Error',
	'402': 'Payment Required Error',
	'404': 'Not Found Error',
	'413': 'Payload Too Large Error',
	'500': 'Internal Server Error'
};

export function StyleInjector() {
	useEffect(() => {
		const simplifyServerUrlDialog = () => {
			document.querySelectorAll('[role="dialog"]').forEach((dialog) => {
				const hasServerTitle = Array.from(
					dialog.querySelectorAll('h2, [data-slot="dialog-title"]')
				).some((el) => el.textContent?.trim() === 'Server URL');
				if (!hasServerTitle) return;

				Array.from(dialog.querySelectorAll('p')).forEach((paragraph) => {
					if (paragraph.textContent?.trim() === 'The base URL of your API endpoint.') {
						(paragraph as HTMLElement).style.display = 'none';
					}
				});

				const combobox = dialog.querySelector('[role="combobox"]') as HTMLElement | null;
				if (combobox && !combobox.getAttribute('data-stogas-hidden-server-select')) {
					combobox.setAttribute('data-stogas-hidden-server-select', 'true');
					combobox.style.display = 'none';
				}

				dialog.querySelectorAll('label').forEach((label) => {
					const labelText = label.textContent?.trim();
					if (labelText === 'serverUrl' || labelText === 'URL') {
						(label as HTMLElement).style.display = 'none';
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
			document.querySelectorAll('button[aria-expanded]:not([role="tab"])').forEach((el) => {
				let targetTextNode: ChildNode | null = null;
				let text = '';

				for (let i = 0; i < el.childNodes.length; i++) {
					const node = el.childNodes[i];
					if (node.nodeType === Node.TEXT_NODE) {
						const val = node.textContent?.trim();
						if (val && STATUS_TITLES[val]) {
							targetTextNode = node;
							text = val;
							break;
						}
					}
				}

				if (text && targetTextNode && !el.getAttribute('data-styled')) {
					el.setAttribute('data-styled', 'true');

					const pill = document.createElement('span');
					const isError = text.startsWith('4') || text.startsWith('5');
					const isSuccess = text.startsWith('2');

					if (isError) {
						el.classList.add('text-red-500');
						pill.className =
							'bg-red-500/10 px-1.5 py-0.5 rounded-md font-mono font-medium text-sm text-red-500';
					} else if (isSuccess) {
						el.classList.add('text-green-500');
						pill.className =
							'bg-green-500/10 px-1.5 py-0.5 rounded-md font-mono font-medium text-sm text-green-500';
					}

					pill.textContent = text;
					el.replaceChild(pill, targetTextNode);

					// Inject the title (without the dash)
					const titleSpan = document.createElement('span');
					titleSpan.textContent = ` ${STATUS_TITLES[text]}`;
					titleSpan.className = 'ml-2 text-fd-muted-foreground font-sans font-normal text-sm';
					el.appendChild(titleSpan);

					// Sync left accordion click to right pane tabs
					el.addEventListener('click', () => {
						const isOpening = el.getAttribute('aria-expanded') === 'false';

						if (isOpening) {
							const tabs = document.querySelectorAll('button[role="tab"]');
							tabs.forEach((tab) => {
								const tabText = tab.textContent?.trim();
								if (tabText && tabText.startsWith(text)) {
									// Radix UI Tabs often require pointerdown/mousedown instead of just a click
									tab.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
									tab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
									(tab as HTMLElement).click();
								}
							});

							// Enforce type="single" by closing any other open response accordions
							setTimeout(() => {
								const openAccordions = document.querySelectorAll(
									'button[aria-expanded="true"]:not([role="tab"])'
								);
								openAccordions.forEach((acc) => {
									if (acc !== el && acc.getAttribute('data-styled') === 'true') {
										acc.setAttribute('data-programmatic-close', 'true');
										(acc as HTMLElement).click();
									}
								});
							}, 10);
						} else {
							// Accordion is closing
							if (el.getAttribute('data-programmatic-close') === 'true') {
								el.removeAttribute('data-programmatic-close');
							} else {
								// User manually closed it, revert right side to 200
								const tabs = document.querySelectorAll('button[role="tab"]');
								tabs.forEach((tab) => {
									const tabText = tab.textContent?.trim();
									if (tabText && tabText.startsWith('200')) {
										tab.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
										tab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
										(tab as HTMLElement).click();
									}
								});
							}
						}
					});
				}
			});

			// 2. Style the right-side Tabs
			document.querySelectorAll('button[role="tab"]').forEach((el) => {
				let targetTextNode: ChildNode | null = null;
				let text = '';

				for (let i = 0; i < el.childNodes.length; i++) {
					const node = el.childNodes[i];
					if (node.nodeType === Node.TEXT_NODE) {
						const val = node.textContent?.trim();
						if (val && STATUS_TITLES[val]) {
							targetTextNode = node;
							text = val;
							break;
						}
					}
				}

				if (text && targetTextNode && !el.getAttribute('data-styled')) {
					el.setAttribute('data-styled', 'true');

					const pill = document.createElement('span');
					const isError = text.startsWith('4') || text.startsWith('5');
					const isSuccess = text.startsWith('2');

					if (isError) {
						pill.className =
							'bg-red-500/10 px-1.5 py-0.5 rounded-md font-mono font-medium text-sm text-red-500';
					} else if (isSuccess) {
						pill.className =
							'bg-green-500/10 px-1.5 py-0.5 rounded-md font-mono font-medium text-sm text-green-500';
					}

					pill.textContent = text;
					el.replaceChild(pill, targetTextNode);
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
