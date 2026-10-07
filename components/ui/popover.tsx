'use client';
import { Popover as Primitive } from '@base-ui/react/popover';
import * as React from 'react';
import { cn } from '../../lib/cn';

export const Popover = Primitive.Root;

export const PopoverTrigger = Primitive.Trigger;

export function PopoverContent({
	className,
	align = 'center',
	sideOffset = 4,
	sticky,
	...props
}: React.ComponentProps<typeof Primitive.Popup> &
	Pick<Primitive.Positioner.Props, 'sideOffset' | 'align' | 'sticky'>) {
	return (
		<Primitive.Portal>
			<Primitive.Positioner
				align={align}
				side="bottom"
				sideOffset={sideOffset}
				sticky={sticky}
				className="z-50"
			>
				<Primitive.Popup
					className={(s) =>
						cn(
							'bg-fd-popover text-fd-popover-foreground data-[closed]:animate-fd-popover-out data-[open]:animate-fd-popover-in z-50 max-h-(--available-height) max-w-[98vw] min-w-[240px] origin-(--transform-origin) overflow-y-auto rounded-xl border p-2 text-sm shadow-lg focus-visible:outline-none',
							typeof className === 'function' ? className(s) : className
						)
					}
					{...props}
				/>
			</Primitive.Positioner>
		</Primitive.Portal>
	);
}

export const PopoverClose = Primitive.Close;
