#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" — decides whether a push should redeploy the
# solicitors' web tool.
#
#   exit 0     -> skip the build (nothing the live app serves has changed)
#   exit 1+    -> build and deploy
#
# Why this exists
# ---------------
# This repository holds two unrelated things: the client-side web tool that
# solicitors use (the files listed in SHIPPED below), and _narrator/, a
# back-office Python tool that runs on Simon's laptop and is never served to
# anyone. Without this gate, backing up a day of narrator work would redeploy
# the solicitors' tool as a side effect. They share a repository on purpose --
# _narrator/templates.py reads content-data.js as its single source of truth --
# so the answer is to decouple the deploy, not the repository.
#
# Failure direction
# -----------------
# Two things can go wrong, and they are not equally bad:
#
#   * Skipping when we should have built  -> a real change to the solicitors'
#     tool silently never reaches them. Simon believes he has shipped a fix
#     that is not live. This is the dangerous one.
#   * Building when we needn't have       -> Vercel redeploys byte-identical
#     static files. Costs a deployment slot and nothing else.
#
# So every uncertain path below exits 1 and builds.

set -u

# Everything the live site actually serves. Adding a file to the web tool means
# adding it here, or its changes will not deploy.
SHIPPED=(
  index.html
  script.js
  style.css
  content-data.js
  favicon.ico
  your-logo-transparent.png
  stylised-blossom.png
  greenHelpButton.png
  "Costs_Assessment_Guidance_2024_SCC_-_Version_1a-_23_September_2024.pdf"
  vercel.json
  .vercelignore
  _vercel-should-build.sh
)

# Vercel's own documented example is `git diff --quiet HEAD^ HEAD`, which is
# wrong for how this repo is pushed. Work here happens in batches -- six or a
# dozen commits go up at once -- and the tip commit is usually narrator work.
# Comparing only the tip against its parent would hide a content-data.js change
# sitting three commits back and skip a deploy that was needed.
#
# Vercel shallow-clones with --depth=10, so nine commits back is the furthest we
# can reliably reach. The cost of the wider window is that the nine pushes
# following a genuine web change each redeploy unnecessarily; per the failure
# direction above, that is the side to err on.
BASE=""
if git rev-parse --verify -q "HEAD~9^{commit}" >/dev/null 2>&1; then
  BASE="HEAD~9"
elif [ "$(git rev-parse --is-shallow-repository 2>/dev/null)" = "true" ]; then
  # We cannot reach nine commits back and the clone is shallow, so the history
  # is truncated rather than short. This branch must not fall through to the
  # root-commit case below: in a shallow clone git reports the truncated base
  # as a root commit (no parents), so that fallback would quietly compare only
  # the couple of commits on hand and report a clean result -- reintroducing
  # exactly the HEAD^ blind spot this script exists to close.
  echo "Shallow clone cannot reach far enough back to compare. Building, to be safe."
  exit 1
elif ROOT=$(git rev-list --max-parents=0 HEAD 2>/dev/null | tail -1) && [ -n "$ROOT" ]; then
  # A complete clone with fewer than ten commits: this really is the first one.
  BASE="$ROOT"
fi

if [ -z "$BASE" ]; then
  echo "Could not establish a comparison base in this clone. Building, to be safe."
  exit 1
fi

if ! git diff --quiet "$BASE" HEAD -- "${SHIPPED[@]}" 2>/dev/null; then
  echo "Shipped files changed between $BASE and HEAD -- deploying:"
  git diff --name-only "$BASE" HEAD -- "${SHIPPED[@]}"
  exit 1
fi

# git diff exits 0 for "no differences" and 1 for "differences", but also >1 for
# an actual error. The check above treats any non-zero as "build", so an error
# has already sent us down the deploy path. Reaching here means a clean 0.
echo "No file the live site serves changed between $BASE and HEAD."
echo "This looks like back-office (_narrator/) work only -- skipping the deploy."
exit 0
