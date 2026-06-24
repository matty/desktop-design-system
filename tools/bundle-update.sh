#!/usr/bin/env bash
# Update this design-language bundle to a release version.
# Ships at the bundle root; run it from your app, e.g.:
#   bash src/design-language/update.sh 0.2.0
# Targets its own directory by default; override the target with DL_DEST,
# or the source repo with DL_REPO.
set -euo pipefail

REPO="${DL_REPO:-matty/desktop-design-system}"
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${DL_DEST:-$SELF_DIR}"

VERSION="${1:-}"
[ -n "$VERSION" ] || { echo "usage: $0 <version>  (e.g. 0.2.0)" >&2; exit 2; }
VERSION="${VERSION#v}"                       # accept 0.2.0 or v0.2.0
TAG="v${VERSION}"
ZIP="design-language-${VERSION}.zip"

OLD="none"; [ -f "$DEST/VERSION" ] && OLD="$(cat "$DEST/VERSION")"

# Refuse to clobber uncommitted edits (e.g. locally extended icons) in DEST.
if git -C "$DEST" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  [ -z "$(git -C "$DEST" status --porcelain -- .)" ] || {
    echo "error: $DEST has uncommitted changes — commit or stash first." >&2; exit 1; }
fi

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
echo "Downloading $TAG from $REPO ..."
gh release download "$TAG" --repo "$REPO" --pattern "${ZIP}*" --dir "$TMP"
echo "Verifying checksum ..."
( cd "$TMP" && sha256sum -c "${ZIP}.sha256" )

# Stage the new bundle fully before touching DEST, so a failed download/extract
# can never leave DEST half-removed. cd out of DEST first; this script is
# already loaded, so it survives being replaced under it.
unzip -q "$TMP/$ZIP" -d "$TMP/stage"
[ -f "$TMP/stage/VERSION" ] || { echo "error: extracted bundle missing VERSION" >&2; exit 1; }
cd "$TMP"
echo "Updating $DEST ($OLD -> $VERSION) ..."
rm -rf "$DEST"
mv "$TMP/stage" "$DEST"
echo "Done: $DEST is now design-language $(cat "$DEST/VERSION") (was $OLD)."
echo "Review the diff: git add $DEST && git diff --cached --stat -- $DEST"
