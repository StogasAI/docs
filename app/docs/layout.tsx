import { unifiedTree } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import LayoutClient from '@/components/layout-client';
import type { ReactNode } from 'react';
export const dynamic = 'force-static';

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<LayoutClient tree={unifiedTree} baseOptions={baseOptions()}>
			{children}
		</LayoutClient>
	);
}
