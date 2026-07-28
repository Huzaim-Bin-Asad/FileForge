# FileForge

FileForge is a file conversion tool for everyday document formats — PDF, Word, Markdown, HTML, and plain text — built as a fast, no-frills web app.

Drop in a file, pick a target format, and get a converted copy back. Conversions currently run in-app (no third-party upload service), which keeps things quick and keeps your files private.

## Supported conversions

| Conversion         | Status         |
| ------------------ | -------------- |
| PDF ↔ HTML         | ✅ Supported   |
| PDF ↔ Markdown     | ✅ Supported   |
| Word ↔ Markdown    | ✅ Supported   |
| TXT ↔ PDF          | ✅ Supported   |
| PDF ↔ Word         | ✅ Supported   |
| PDF ↔ Excel        | 🚧 Planned     |
| PDF ↔ PowerPoint   | 🚧 Planned     |
| EPUB ↔ PDF         | 🚧 Planned     |

## Project structure

This is a [Turborepo](https://turborepo.dev/) monorepo managed with pnpm workspaces.

```
apps/
  web/       Next.js app — the FileForge frontend and conversion API routes
  api/       (scaffolded, not yet implemented)
  worker/    (scaffolded, not yet implemented)
packages/
  converters/         (scaffolded, not yet implemented)
  sdk/                (scaffolded, not yet implemented)
  shared/             (scaffolded, not yet implemented)
  types/               (scaffolded, not yet implemented)
  ui/                  shared React component library
  eslint-config/       shared ESLint configs
  typescript-config/   shared tsconfig presets
```

The `web` app is where the working product lives today — file conversion logic is in `apps/web/lib/converters`, and the UI in `apps/web/components/converter-section`. The other apps and packages are placeholders for splitting out a dedicated API, background worker, and shared conversion/SDK logic as the project grows.

## Getting started

Requires Node 18+ and [pnpm](https://pnpm.io/).

```sh
pnpm install
pnpm dev
```

This starts the `web` app in development mode (via Turborepo).

Other useful commands, run from the repo root:

```sh
pnpm build         # build all apps/packages
pnpm lint          # lint all apps/packages
pnpm check-types   # typecheck all apps/packages
pnpm format        # format the codebase with Prettier
```

## Tech stack

- [Next.js](https://nextjs.org/) + React 19
- [Turborepo](https://turborepo.dev/) for monorepo task orchestration
- [pdf-lib](https://github.com/Hopding/pdf-lib) / [pdf-parse](https://www.npmjs.com/package/pdf-parse) for PDF generation and text extraction
- [docx](https://github.com/dolanmiu/docx) / [mammoth](https://github.com/mwilliamson/mammoth.js) for Word document conversion
- Tailwind CSS for styling

## Contributing

This project is under active development — expect rough edges and unimplemented conversions. Issues and PRs are welcome.
