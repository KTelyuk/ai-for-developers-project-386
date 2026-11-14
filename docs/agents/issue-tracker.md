# Issue tracker: Local Markdown in `docs/`

The spec and tickets for this repo live as markdown files in `docs/`, committed to git. The project has one spec, so there are no per-feature directories.

## Conventions

- The spec is `docs/spec.md`
- Implementation tickets are one file per ticket at `docs/tickets/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Each ticket has these lines near the top:
  - `Status:` the triage state (see `triage-labels.md` for the role strings), or `done` once implemented
  - `Blocked by: NN, NN` the tickets that must be `done` first; omit the line when nothing blocks it
- A ticket is unblocked when every ticket in its `Blocked by` line is `done`
- Comments and conversation history append to the bottom of the file under a `## Comments` heading
- **Close a ticket**: append what was done (with the commit hash) under `## Comments`, then set `Status: done`

## When a skill says "publish to the issue tracker"

A spec goes to `docs/spec.md`; a ticket is a new file under `docs/tickets/` with the next free number.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the ticket number directly (`03` → `docs/tickets/03-*.md`).

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `docs/wayfinder/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `docs/wayfinder/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `docs/wayfinder/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
