# Stogas Docs

The source of the [Stogas documentation](https://stogas.ai/docs), built with [Fumadocs](https://fumadocs.dev) and [Next.js](https://nextjs.org). Pages live in `content/docs/`.

## Develop

```sh
bun install --frozen-lockfile
bun run dev
```

Before you commit, run the checks:

```sh
bun run format:check
bun run typecheck
bun run build
bun run test
```

`test` runs the browser tests against the build, so run `build` first.

## License

[Apache-2.0](LICENSE). [NOTICE](NOTICE) credits Fumadocs.
