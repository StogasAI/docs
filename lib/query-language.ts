// Display grammar only. Acceptance and type checking belong to the policy compiler.
export const queryLanguage = {
	name: 'cel',
	displayName: 'CEL',
	scopeName: 'source.cel',
	repository: {},
	patterns: [
		{
			name: 'string.quoted.single',
			begin: "'",
			end: "'",
			patterns: [{ name: 'constant.character.escape', match: "\\\\['\\\\]" }]
		},
		{
			name: 'string.quoted.double',
			begin: '"',
			end: '"',
			patterns: [{ name: 'constant.character.escape', match: '\\\\["\\\\]' }]
		},
		{ name: 'comment.line', begin: '//', end: '$' },
		{ name: 'support.function', match: '\\b[a-zA-Z_][a-zA-Z0-9_]*(?=\\s*\\()' },
		{
			name: 'keyword.control',
			match: '\\bin\\b'
		},
		{ name: 'constant.language.boolean', match: '\\b(?:true|false|null)\\b' },
		{ name: 'constant.numeric', match: '-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?' },
		{ name: 'variable.other', match: '\\b[a-zA-Z_][a-zA-Z0-9_]*(?:\\.[a-zA-Z_][a-zA-Z0-9_]*)*\\b' },
		{ name: 'keyword.operator', match: '==|!=|<=|>=|&&|\\|\\||[!<>+*/%?:=-]' },
		{ name: 'punctuation', match: '[(),{}\\[\\]]' }
	]
};
