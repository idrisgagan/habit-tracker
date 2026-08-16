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

# Every invocation is logged, including the silent no-ops. Without this a
# clean-tree run is indistinguishable from a hook that never fired at all,
# which makes "is the backup actually running?" unanswerable. The log is
# gitignored — if it were tracked, writing it would dirty the tree and the
# hook would commit its own log on every single stop.
log="$repo/.claude/hooks/autocommit.log"
say() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" >>"$log" 2>/dev/null || true; }

say "fired"

git rev-parse --git-dir >/dev/null 2>&1 || { say "skip: not a git repo"; exit 0; }
gitdir="$(git rev-parse --git-dir)"

# Mid-merge/rebase/cherry-pick/bisect the tree is a tool's scratch space, not a
# change worth recording. Committing here would bake in conflict markers.
for marker in MERGE_HEAD REBASE_HEAD CHERRY_PICK_HEAD REVERT_HEAD BISECT_LOG rebase-merge rebase-apply; do
  [ -e "$gitdir/$marker" ] && { say "skip: $marker present (merge/rebase in progress)"; exit 0; }
done

# Detached HEAD: a commit here is unreachable from any branch and would be lost.
branch="$(git symbolic-ref --quiet --short HEAD)" || { say "skip: detached HEAD"; exit 0; }

git remote get-url origin >/dev/null 2>&1 || { say "skip: no origin remote"; exit 0; }

if [ -n "$(git status --porcelain)" ]; then
  git add -A || { say "error: git add failed"; exit 0; }

  files="$(git diff --cached --name-only | head -20)"
  count="$(git diff --cached --name-only | wc -l | tr -d ' ')"
  [ "$count" = "0" ] && { say "noop: nothing staged after add"; exit 0; }

  # Generic by necessity — see the header. The file list is what makes this
  # commit findable later; the subject line cannot be more specific than this.
  git commit -q -F - <<EOF || exit 0
Auto-checkpoint: $count file(s) changed

Committed automatically by the Stop hook so no work sits unsaved. The
intent behind these changes is in the session, not in this message.

$files
EOF
  committed=1
  say "committed: $count file(s) -> $(git rev-parse --short HEAD)"
else
  say "noop: working tree clean"
fi

# Push even when nothing was just committed — this also recovers from an
# earlier push that failed while the commit itself succeeded.
if [ -n "$(git log --oneline "origin/$branch..HEAD" 2>/dev/null || git log --oneline -1)" ]; then
  if git push -q origin "HEAD:$branch" 2>/dev/null; then
    say "pushed: origin/$branch"
    [ "${committed:-0}" = "1" ] && note "Auto-committed $count file(s) and pushed to origin/$branch."
  else
    say "ERROR: push to origin/$branch failed"
    note "Auto-commit succeeded but the push to origin/$branch FAILED — your work is committed locally but not backed up."
  fi
else
  say "noop: nothing to push"
fi

exit 0
