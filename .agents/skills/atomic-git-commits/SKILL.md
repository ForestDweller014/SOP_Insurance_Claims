---
name: atomic-git-commits
description: Review workspace changes, create clean atomic Git commits, and prevent local Graphify query artifacts from being committed or pushed. Use whenever the user asks to commit changes, organize commits, stage files, prepare commit history, or split work into logical commits.
---

# Atomic Git Commit Workflow

Review the current workspace changes and create professional, logically separated Git commits.

## Scope

Respect any path or file scope provided by the user.

Do not stage, modify, revert, or commit files outside that scope.

If no scope is provided, inspect all workspace changes, but do not assume every change should be committed.

## Commit strategy

Before committing:

1. Inspect the working tree and all relevant diffs.
2. Determine the distinct logical changes represented.
3. Divide unrelated changes into separate commits.
4. Preserve dependency order between commits.
5. Keep each commit independently reviewable and revertible.
6. Keep directly related implementation and tests together.
7. Do not split a change so aggressively that a commit becomes incomplete or broken.
8. Use partial staging when one file contains changes belonging to multiple commits.

Normally split:

- A feature and an unrelated bug fix
- A refactor and a behavior change
- Unrelated fixes affecting separate components
- Formatting changes and functional changes
- Documentation unrelated to the implementation change

Normally keep together:

- A bug fix and its regression test
- A feature and its directly related tests
- A rename and all required reference updates
- A change and the minimal supporting types or configuration it requires

## Commit messages

Use Conventional Commits types such as:

- `feat`
- `fix`
- `refactor`
- `test`
- `docs`
- `chore`
- `style`
- `perf`
- `build`
- `ci`

For every commit:

- Format the subject as `<type>: <Summary>`
- Keep the subject under 50 characters
- Capitalize the first word after the type
- Use imperative mood
- Do not end the subject with a period
- Add a blank line after the subject
- Add a bulleted body explaining what changed and why
- Focus on intent and effect, not low-level implementation mechanics
- Avoid vague subjects such as `Update files` or `Fix stuff`

Example:

```text
fix: Prevent duplicate modal submissions

- Block repeated submissions while a request is pending
- Avoid duplicate records caused by rapid user input
```

## Graphify locality guard

Graphify queries and feedback are local working data. They must never be staged,
committed, or pushed. These rules are mandatory and override general staging or
publishing instructions.

Treat all of the following as local-only:

- `graphify-out/memory/` and every saved `query_*`, path, or explain result
- `graphify-out/reflections/`
- `graphify-out/cache/`
- Dated Graphify snapshots such as `graphify-out/YYYY-MM-DD/`
- Runtime and learning sidecars such as `graphify-out/.graphify_*` and
  `graphify-out/.vocab.txt`
- Any generated artifact whose contents cite the paths above or saved-query IDs
  such as `query_YYYYMMDD_HHMMSS_*`

When a repository intentionally versions its structural Graphify graph, the only
Graphify paths eligible for staging are:

- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.html`
- `graphify-out/graph.json`
- `graphify-out/manifest.json`

Before every commit:

1. Inspect ignored and untracked Graphify files with
   `git status --short --ignored -- graphify-out`.
2. Never use `git add -f` for a Graphify path. Never use a broad `git add -A`,
   `git add .`, or `git add graphify-out/` without reviewing the resulting index.
3. Stage eligible structural outputs by their exact paths.
4. List all staged Graphify paths with
   `git diff --cached --name-only -- graphify-out` and reject anything outside
   the structural allowlist above.
5. Scan the staged Graphify patch for embedded query residue with:

   ```bash
   git diff --cached -- graphify-out \
     | rg 'graphify-out/(memory|reflections)/|query_[0-9]{8}_[0-9]{6}_'
   ```

   A match blocks the commit. Remove the query-derived data from the staged
   artifact or rebuild the graph from project structure only. Unstage a local
   query path with `git restore --staged -- <path>` so its working copy remains
   available locally; do not delete local query data merely to make a commit.

Before every push:

1. Inspect every outgoing commit, not only the current index:

   ```bash
   git log --format= --name-only '@{upstream}'..HEAD -- graphify-out \
     | rg '^graphify-out/(memory/|reflections/|cache/|[0-9]{4}-[0-9]{2}-[0-9]{2}/|\.graphify_|\.vocab\.txt|.*query_[0-9]{8}_[0-9]{6}_)'
   ```

2. Scan the Graphify contents of every outgoing commit for embedded query
   paths or saved-query IDs. Use `git rev-list '@{upstream}'..HEAD` with
   `git grep` so an earlier outgoing commit cannot hide residue that a later
   commit deletes:

   ```bash
   for commit in $(git rev-list '@{upstream}'..HEAD); do
     if git grep -I -n -E \
       'graphify-out/(memory|reflections)/|query_[0-9]{8}_[0-9]{6}_' \
       "$commit" -- graphify-out; then
       echo "Graphify query residue blocks push at $commit" >&2
       exit 1
     fi
   done
   ```

   Also inspect structural outputs for copied raw prompts or answers that do not
   carry a standard saved-query ID; they are local query data too.
3. A match blocks the push. Rewrite each affected commit before continuing;
   deleting the file only in the tip commit is insufficient.
4. If the branch has no upstream, perform the same checks against the explicit
   remote base that will be pushed.
5. If an affected commit is already published, stop and coordinate the required
   remote history rewrite before force-pushing anything.

Do not invoke a Graphify auto-publisher unless its staging allowlist and outgoing
commit checks satisfy this section. If a helper script conflicts with these
rules, the locality guard wins and the push must stop.
