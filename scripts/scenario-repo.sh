#!/usr/bin/env bash
# Builds the fixture repository for the release-scenarios CI job:
#   v1.0.0 (first) -> v1.0.1 (patch) -> v1.1.0 (minor) -> v1.1.1 (patch)
#   -> v2.0.0-rc.1 (prerelease) -> v2.0.0 (major) -> one untagged commit
set -euo pipefail
dir="$1"
mkdir -p "$dir" && cd "$dir"
git init -q -b main
git config user.email ci@example.com
git config user.name ci
step() { echo "$2" > "$1"; git add .; git commit -qm "$2"; }
step a "feat: first feature";            git tag v1.0.0
step b "fix: crash when the list is empty"; git tag v1.0.1
step c "feat(search): fuzzy search";     git tag v1.1.0
step d "fix(search): ignore accents";    git tag v1.1.1
step e "feat!: new settings page";       git tag v2.0.0-rc.1
step f "fix: settings page layout";      git tag v2.0.0
step g "feat: export to CSV"
