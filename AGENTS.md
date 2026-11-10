<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## CRM calculator parity

The owner explicitly requires every website calculator update to also update the CRM calculator (10 November 2026, CRM-13). The sibling `aqyr-crm-sample` project reuses a frozen, hashed snapshot of the website calculator, including its module dependency graph, markup and stylesheet. After changing calculator code/rules, nomination or English modules, occupation/postcode references, source markup or relevant styling, run `npm run sync:calculator` in that CRM project, run `npm run check:calculator-sync`, verify both projects and representative score/UI parity, and release both updates together after the applicable explicit sync instruction. Do not treat website-only publication as completion of calculator work. Preserve unrelated worktrees and never edit the generated CRM snapshot by hand. Details: `../aqyr-crm-sample/docs/calculator-sync.md`.

## Release numbering

The owner clarified on 10 November 2026 that releases must reflect change scope: patch for fixes/small adjustments, minor for substantial new features, and a separately reviewed major increment for major architecture/compatibility changes. Do not increment only the patch for every delivery; keep website and CRM version histories appropriate to their own releases.
