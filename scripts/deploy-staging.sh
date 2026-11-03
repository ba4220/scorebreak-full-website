#!/usr/bin/env bash
# Build the site and publish it to the staging GCS bucket.
# Staging-only extras: every page gets <meta name="robots" content="noindex">, so search engines skip it.
set -euo pipefail

BUCKET="${BUCKET:-gs://scorebreak-marketing-site-staging}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# gsutil's multiprocessing crashes Python on macOS; threads only.
gs() { gsutil -o "GSUtil:parallel_process_count=1" "$@"; }

# Text files are stored gzipped (Content-Encoding: gzip); GCS unzips them for the rare client that can't take gzip.
GZIP_EXTS=html,css,js,svg,txt,xml,json
# HTML may be cached for a minute (CDN and browser), so a deploy shows up within ~1 minute.
HTML_CACHE="public, max-age=60"

cd "$ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Warning: working tree has uncommitted changes; they will be deployed." >&2
fi
echo "Deploying $(git rev-parse --short HEAD) ($(git rev-parse --abbrev-ref HEAD)) to $BUCKET"
read -r -p "Continue? [y/N] " answer
[[ "$answer" == "y" || "$answer" == "Y" ]] || exit 1

PUBLIC_API_HOST=https://staging-api2.scorebreak.io npm run build

# Staging-only edits go on a copy, not dist/.
cp -R dist/. "$STAGE/"
find "$STAGE" -name '*.html' -exec perl -pi -e 's|<head>|<head><meta name="robots" content="noindex, nofollow">|' {} +

# Full copy rather than `gsutil rsync`, which skipped changed files against this bucket.
gs -m cp -z "$GZIP_EXTS" -r "$STAGE"/* "$BUCKET/"

# Serve /support (no trailing slash) directly instead of GCS redirecting to /support/index.html.
# Direct API PUT: `gsutil cp` treats "support" as the existing support/ folder and writes inside it.
pages=$(cd "$STAGE" && find . -mindepth 2 -name index.html | sed 's|^\./||; s|/index\.html$||')
token=$(gcloud auth print-access-token)
for page in $pages; do
  gzip -9 -c "$STAGE/$page/index.html" > "$STAGE/page.gz"
  curl -sSf -o /dev/null -X PUT -T "$STAGE/page.gz" \
    -H "Authorization: Bearer $token" -H "Content-Type: text/html" -H "Content-Encoding: gzip" \
    -H "Cache-Control: $HTML_CACHE" "https://storage.googleapis.com/${BUCKET#gs://}/$page"
done
rm "$STAGE/page.gz"

# _astro/ files are content-hashed, so they can be cached forever.
gs -m -q setmeta -h "Cache-Control:$HTML_CACHE" "$BUCKET/**.html"
gs -m -q setmeta -h "Cache-Control:public, max-age=31536000, immutable" "$BUCKET/_astro/**"

gs web set -m index.html -e 404.html "$BUCKET"

# Stale objects: in the bucket but not in this build. Listed, then removed only on confirmation.
expected=$( (cd "$STAGE" && find . -type f | sed 's|^\./||'; echo "$pages") | sort -u)
actual=$(gs ls -r "$BUCKET/**" | sed "s|^$BUCKET/||" | sort -u)
stale=$(comm -13 <(echo "$expected") <(echo "$actual"))
if [[ -n "$stale" ]]; then
  echo "Objects in $BUCKET not in this build:"
  echo "$stale" | sed 's/^/  /'
  read -r -p "Delete them? [y/N] " answer
  if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    echo "$stale" | sed "s|^|$BUCKET/|" | gs -m rm -I
  fi
fi

echo "Done: $BUCKET"
