#!/usr/bin/env bash
set -euo pipefail

# One-shot Arc branch cleanup from the 2026-09-15 exhaustive repository audit.
# Keeps only origin/main as a branch. Historically useful donor tips are preserved as tags first.

EXPECTED_REPO='waxandwing/arc-greenfield'
AUDIT_BASE='b1a3a6f55130bb12b318550e221bc7f9f4f195a8'
# Abort rather than delete any non-main branch whose tip was created after the audited window.
AUDIT_CUTOFF_EPOCH=1789511400 # 2026-09-15 22:30:00 UTC

remote_url="$(git remote get-url origin 2>/dev/null || true)"
if [[ "$remote_url" != *"github.com/${EXPECTED_REPO}"* ]]; then
  echo "Refusing to prune: origin is '$remote_url', expected ${EXPECTED_REPO}." >&2
  exit 1
fi

git fetch origin --prune --tags

if ! git merge-base --is-ancestor "$AUDIT_BASE" origin/main; then
  echo "Refusing to prune: origin/main does not contain audited baseline $AUDIT_BASE." >&2
  echo "Re-audit the repository before deleting branches." >&2
  exit 1
fi

mapfile -t newer_branches < <(
  git for-each-ref --format='%(refname:short)|%(committerdate:unix)' refs/remotes/origin/ \
    | awk -F'|' -v cutoff="$AUDIT_CUTOFF_EPOCH" '$1 != "origin/main" && $1 != "origin/HEAD" && $2 > cutoff { print $1 }'
)

if (( ${#newer_branches[@]} > 0 )); then
  echo "Refusing to prune because these branches moved or appeared after the audit cutoff:" >&2
  printf '  %s\n' "${newer_branches[@]}" >&2
  echo "Re-audit them first." >&2
  exit 1
fi

donor_branches=(
  'develop'
  'architecture/fridge-scheduling-drag-contracts'
  'archive/audit-cleanup-duplicate-2026-09-03'
  'archive/main-pre-green-2026-09-07'
  'archive/pre-frame-reset-2026-09-02'
  'codex/b00-5-core-prune'
  'codex/day-notes-magnets'
  'codex/day-notes-persistence-slice'
  'codex/founder-laws-active-reconciliation'
  'codex/reconcile-founder-laws'
  'codex/recovery-desk-constitution'
  'easel/develop'
  'feature/day-teaching-continuity'
  'feature/drag-reactive-preview'
  'feature/fridge-door-domain'
  'feature/fridge-door-nondrag-interface'
  'feature/fridge-door-spatial-persistence'
  'feature/fridge-door-stacks-interface'
  'feature/fridge-drag-contract-implementation'
  'feature/month-continuity-interface'
  'feature/object-local-actions-fridge'
  'feature/persistent-priority-depth'
  'feature/quarter-planning-projection'
  'feature/same-day-approval-persistence'
  'feature/same-day-lesson-approval'
  'feature/unified-undo-drag'
  'feature/week-continuity-interface'
  'feature/week-day-hostile-audit'
  'feature/week-day-month-consistency-audit'
  'feature/week-day-planning-projection'
  'rebuild/workspace-operations'
  'release/beta-vertical-slice-20260907'
  'release/production-green-final-20260907'
)

archive_tags=()
for branch in "${donor_branches[@]}"; do
  if git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
    safe_name="${branch//\//--}"
    tag="archive/2026-09-15/$safe_name"
    if ! git show-ref --verify --quiet "refs/tags/$tag"; then
      git tag -a "$tag" "origin/$branch" -m "Archive $branch before Arc branch prune 2026-09-15"
    fi
    archive_tags+=("$tag")
  fi
done

if (( ${#archive_tags[@]} > 0 )); then
  echo "Preserving ${#archive_tags[@]} donor tips as archive tags..."
  git push origin "${archive_tags[@]}"
fi

mapfile -t branches_to_delete < <(
  git for-each-ref --format='%(refname:short)' refs/remotes/origin/ \
    | sed 's#^origin/##' \
    | grep -v '^HEAD$' \
    | grep -v '^main$' \
    | sort -u
)

if (( ${#branches_to_delete[@]} == 0 )); then
  echo 'No non-main remote branches remain.'
  exit 0
fi

echo "Deleting ${#branches_to_delete[@]} audited remote branches; main is preserved."
printf '  %s\n' "${branches_to_delete[@]}"

git push origin --delete "${branches_to_delete[@]}"
git fetch origin --prune

echo
echo 'Remaining remote branches:'
git for-each-ref --format='%(refname:short)' refs/remotes/origin/ | sort

echo
echo 'Archive tags created for donor history:'
printf '  %s\n' "${archive_tags[@]}"
