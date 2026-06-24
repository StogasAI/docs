import { source, apiSource } from './lib/source';
const tree = {
	name: 'Docs',
	children: [
		{
			type: 'folder',
			name: 'Docs',
			url: '/docs',
			children: source.getPageTree().children
		},
		{
			type: 'folder',
			name: 'API Reference',
			url: '/docs/reference',
			children: apiSource.getPageTree().children
		}
	]
};
console.log(tree);
