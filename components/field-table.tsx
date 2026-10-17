import mdxComponents from 'fumadocs-ui/mdx';
import { Fragment, type ReactNode } from 'react';

const Table = mdxComponents.table;

export interface ReferenceField {
	name: string;
	type: string;
	description: ReactNode;
	href?: string;
	required?: boolean;
}

// On narrow screens each row puts the name and type above a description of full width. Browsers can
// drop table semantics when table elements change display, so the roles are explicit.
export function FieldTable({ fields, label }: { fields: ReferenceField[]; label: string }) {
	return (
		<Table aria-label={label} role="table" className="max-sm:block">
			<thead role="rowgroup" className="max-sm:sr-only">
				<tr role="row">
					<th role="columnheader">Field</th>
					<th role="columnheader">Type</th>
					<th role="columnheader">Description</th>
				</tr>
			</thead>
			<tbody role="rowgroup" className="max-sm:block">
				{fields.map(({ name, type, description, href, required }) => (
					<tr
						key={name}
						role="row"
						className="max-sm:border-fd-border max-sm:flex max-sm:flex-wrap max-sm:items-baseline max-sm:gap-x-2 max-sm:gap-y-1 max-sm:p-2.5 max-sm:not-last:border-b"
					>
						<th
							role="rowheader"
							scope="row"
							className="align-top font-normal max-sm:border-0! max-sm:bg-transparent! max-sm:p-0!"
						>
							{href ? (
								<a href={href}>
									<FieldName name={name} />
								</a>
							) : (
								<FieldName name={name} />
							)}
							{required && <span className="text-fd-muted-foreground block text-xs">Required</span>}
						</th>
						<td role="cell" className="align-top max-sm:border-0! max-sm:p-0!">
							<code className="break-words">{type}</code>
						</td>
						<td
							role="cell"
							className="prose-no-margin align-top wrap-anywhere max-sm:basis-full max-sm:border-0! max-sm:p-0! sm:min-w-48"
						>
							{description}
						</td>
					</tr>
				))}
			</tbody>
		</Table>
	);
}

// A long name can wrap before each dot.
function FieldName({ name }: { name: string }) {
	return (
		<code>
			{name.split('.').map((part, index) => (
				<Fragment key={index}>
					{index > 0 && <wbr />}
					{index > 0 && '.'}
					{part}
				</Fragment>
			))}
		</code>
	);
}
