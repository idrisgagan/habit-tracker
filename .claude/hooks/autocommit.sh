#!/usr/bin/env bash
#
# Stop hook: commit and push any dirty working tree so the project always has a
# saved version on GitHub.
#
# This is a SAFETY NET, not the primary path. A script cannot know why a change
# was made, so its commit messages are generic by construction. Hand-written
# commits are strictly better; this exists to catch what was left uncommitted.
# When the tree is already clean it no-ops, so committing by hand costs nothing.
#
# It declines to act in any state where an automatic commit could do damage,
# and never exits non-zero — a backup mechanism must not break the session.

set -uo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)" || exit 0
cd "$repo" || exit 0

note() { printf '{"systemMessage": %s}\n' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/^/"/; s/$/"/')"; }

git rev-parse --git-dir >/dev/null 2>&1 || exit 0
gitdir="$(git rev-parse --git-dir)"

# Mid-merge/rebase/cherry-pick/bisect the tree is a tool's scratch space, not a
# change worth recording. Committing here would bake in conflict markers.
for marker in MERGE_HEAD REBASE_HEAD CHERRY_PICK_HEAD REVERT_HEAD BISECT_LOG rebase-merge rebase-apply; do
  [ -e "$gitdir/$marker" ] && exit 0
done

# Detached HEAD: a commit here is unreachable from any branch and would be lost.
branch="$(git symbolic-ref --quiet --short HEAD)" || exit 0

git remote get-url origin >/dev/null 2>&1 || exit 0

if [ -n "$(git status --porcelain)" ]; then
  git add -A || exit 0

  files="$(git diff --cached --name-only | head -20)"
  count="$(git diff --cached --name-only | wc -l | tr -d ' ')"
  [ "$count" = "0" ] && exit 0

  # Generic by necessity — see the header. The file list is what makes this
  # commit findable later; the subject line cannot be more specific than this.
  git commit -q -F - <<EOF || exit 0
Auto-checkpoint: $count file(s) changed

Committed automatically by the Stop hook so no work sits unsaved. The
intent behind these changes is in the session, not in this message.

$files
EOF
  committed=1
fi

# Push even when nothing was just committed — this also recovers from an
# earlier push that failed while the commit itself succeeded.
if [ -n "$(git log --oneline "origin/$branch..HEAD" 2>/dev/null || git log --oneline -1)" ]; then
  if git push -q origin "HEAD:$branch" 2>/dev/null; then
    [ "${committed:-0}" = "1" ] && note "Auto-committed $count file(s) and pushed to origin/$branch."
  else
    note "Auto-commit succeeded but the push to origin/$branch FAILED — your work is committed locally but not backed up."
  fi
fi

exit 0
