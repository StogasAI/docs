import mdxComponents from 'fumadocs-ui/mdx';
import type { ReactNode } from 'react';

const Table = mdxComponents.table;

export interface ReferenceField {
	name: string;
	type: string;
	description: ReactNode;
	href?: string;
	required?: boolean;
}

export function FieldTable({ fields, label }: { fields: ReferenceField[]; label: string }) {
	return (
		<Table aria-label={label}>
			<thead>
				<tr>
					<th>Field</th>
					<th>Type</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				{fields.map(({ name, type, description, href, required }) => (
					<tr key={name}>
						<th scope="row" className="align-top font-normal">
							{href ? (
								<a href={href}>
									<code>{name}</code>
								</a>
							) : (
								<code>{name}</code>
							)}
							{required && <span className="text-fd-muted-foreground block text-xs">Required</span>}
						</th>
						<td className="align-top">
							<code className="break-words">{type}</code>
						</td>
						<td className="align-top wrap-anywhere sm:min-w-48">{description}</td>
					</tr>
				))}
			</tbody>
		</Table>
	);
}
