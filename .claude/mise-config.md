# Mise Configuration

Ship: merge (squash)

## Quality commands

- Format: yarn format
- Check: yarn typecheck
- Unit tests: yarn test

## Test exceptions

- Changes to markdown that ships as guidance — skill instruction files, `docs/`, and `README.md` — verify with a dry-run walkthrough of the changed file, or a term-for-term check against the file it documents; no unit test
- Anything that would need an e2e test (no e2e infrastructure exists) — verify with unit tests plus manual verification

## Skills & guides

- docs/skill-authoring.md (doc, required): when writing or editing any skill instruction file
- docs/line-evidence.md (doc, required): when adding, removing or moving a line in a shipped skill file
