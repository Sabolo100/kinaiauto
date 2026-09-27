#!/usr/bin/env bash
# Crawlability audit for a domain, driven by its sitemap.
# Usage: ./crawl-audit.sh DOMAIN [forbidden-strings] [extra-host ...]
#   DOMAIN             e.g. arworks.hu
#   forbidden-strings  comma-separated strings that must never occur in the HTML (old domains, staging
#                      hosts ...). Default "sslip.io,localhost". (Was the "régi-domain-minta" argument.)
#   extra-host         other domains that must redirect to DOMAIN, e.g. arworks.com (www. is added automatically)
# Env: DATE (default today)  CACHE (default ./cache)  BRAND (default first label of DOMAIN)  DELAY (default 0.3)
# Outputs: audit-DOMAIN-DATE-{pages,issues,hreflang}.csv + this console report.
# Requires: curl, python3 (stdlib only). bash 3.2 compatible (macOS /bin/bash).
set -u
DOMAIN="$1"; FORBID="${2:-sslip.io,localhost}"
shift; [ $# -gt 0 ] && shift
BASE="https://$DOMAIN"
DATE="${DATE:-$(date +%F)}"; CACHE="${CACHE:-cache}"; DELAY="${DELAY:-0.3}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="audit-$DOMAIN-$DATE"
cget() { curl -sS --connect-timeout 10 --max-time 30 "$@"; }

# Follow a redirect chain hop by hop and print every status. 301/308 are permanent, 302/303/307 temporary.
chain() {
  local u="$1" n=0 line code loc out="$1" temp=0
  while [ $n -lt 8 ]; do
    line=$(cget -o /dev/null -w '%{http_code} %{redirect_url}' "$u" 2>&1)
    code=${line%% *}; loc=${line#* }; [ "$loc" = "$line" ] && loc=""
    out="$out -> [$code]"
    case "$code" in
      301|308) [ -z "$loc" ] && break; out="$out $loc"; u="$loc"; n=$((n+1));;
      302|303|307) [ -z "$loc" ] && break; out="$out $loc"; u="$loc"; n=$((n+1)); temp=1;;
      *) break;;
    esac
    sleep "$DELAY"
  done
  local flags=""
  [ $temp -eq 1 ] && flags="$flags TEMPORARY-REDIRECT"
  [ $n -gt 1 ] && flags="$flags ${n}-HOPS"
  case "$u" in "$BASE"/*|"$BASE") ;; *) flags="$flags FINAL-NOT-$DOMAIN";; esac
  [ "$code" != 200 ] && flags="$flags FINAL-$code"
  echo "  $out${flags:+   <<$flags}"
}

echo "== 1. Domain variants (every hop is shown; 301/308 = permanent, 302/303/307 = temporary)"
# The "other" variant of DOMAIN: apex for a www-canonical site, www. for an apex-canonical one
# (1.x/2.x always prepended www., which gave www.www.DOMAIN and skipped the apex).
case "$DOMAIN" in www.*) OTHER="${DOMAIN#www.}";; *) OTHER="www.$DOMAIN";; esac
for h in "$DOMAIN" "$OTHER" ${@+"$@"}; do
  case "$h" in www.*|"$DOMAIN") hosts="$h";; *) hosts="$h www.$h";; esac
  for hh in $hosts; do
    for s in http https; do chain "$s://$hh/"; done
  done
done
echo "  path preservation / trailing slash:"
chain "http://$DOMAIN/robots.txt"
chain "https://$OTHER/robots.txt"
for h in ${@+"$@"}; do chain "https://$h/robots.txt"; done

echo; echo "== 2. robots.txt (full) and per-bot verdict (Google longest-match semantics)"
python3 "$HERE/robots-check.py" "$BASE" --paths / /admin /api/x | sed 's/^/  /'

echo; echo "== 3. sitemap.xml"
cget -o /dev/null -w '  HTTP %{http_code}, %{size_download} bytes, %{content_type}\n' "$BASE/sitemap.xml"

echo; echo "== 4. Per-page audit of every sitemap URL -> $OUT-*.csv (cache: $CACHE)"
python3 "$HERE/page-audit.py" "$BASE" --cache "$CACHE" --out "$OUT" --forbid "$FORBID" --delay "$DELAY" \
  ${BRAND:+--brand "$BRAND"}
echo "done."
