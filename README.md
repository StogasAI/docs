# Stogas.ai Docs

The official documentation site for [Stogas.ai](https://stogas.ai) — providing zero-trust anonymous AI API access.

Built with [Fumadocs](https://fumadocs.dev) + [Next.js](https://nextjs.org).

## Development

```bash
bun install
bun dev
```

Open [http://localhost:3000/docs](http://localhost:3000/docs).

## Structure

| Path | Description |
| --- | --- |
| `content/docs/` | MDX documentation source files |
| `app/docs/` | Docs layout and catch-all page route |
| `app/(home)/` | Landing page |
| `lib/source.ts` | Fumadocs source adapter |
| `lib/shared.ts` | Shared config (app name, GitHub info) |
| `source.config.ts` | Fumadocs MDX content collection config |

## Adding Docs

Create `.mdx` files under `content/docs/`. Use `meta.json` files to control sidebar order.

See [Fumadocs docs](https://fumadocs.dev/docs/mdx) for full MDX options.
