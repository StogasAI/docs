import { ImageResponse } from 'next/og';

export function openGraphImage(title: string, description: string | undefined, section: string) {
	return new ImageResponse(
		<div
			style={{
				background: '#050505',
				color: '#ffffff',
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				justifyContent: 'space-between',
				padding: '72px 80px',
				width: '100%'
			}}
		>
			<div
				style={{
					border: '1px solid #3f3f46',
					borderRadius: 20,
					display: 'flex',
					flexDirection: 'column',
					gap: 24,
					padding: '52px 56px'
				}}
			>
				<div style={{ color: '#a1a1aa', display: 'flex', fontSize: 24 }}>{section}</div>
				<div style={{ display: 'flex', fontSize: 58, fontWeight: 650, lineHeight: 1.08 }}>
					{title}
				</div>
				{description ? (
					<div style={{ color: '#d4d4d8', display: 'flex', fontSize: 27, lineHeight: 1.35 }}>
						{description}
					</div>
				) : null}
			</div>
			<div
				style={{
					alignItems: 'center',
					display: 'flex',
					fontSize: 28,
					fontWeight: 600,
					justifyContent: 'space-between'
				}}
			>
				<span>stogas</span>
				<span style={{ color: '#a1a1aa', fontSize: 22 }}>stogas.ai/docs</span>
			</div>
		</div>,
		{ height: 630, width: 1200 }
	);
}
