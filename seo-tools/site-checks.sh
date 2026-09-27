#!/usr/bin/env bash
# AI/search-bot access, llms.txt, server-side rendering, favicon and lightweight performance checks.
# Only GET requests, strictly sequential, DELAY seconds apart. bash 3.2 compatible (macOS default shell).
#
# Usage: ./site-checks.sh DOMAIN [path ...]
#   The first three paths are used for the bot matrix, all paths for the SSR check,
#   paths 1 and 3 for the timing/compression checks.
#   e.g. ./site-checks.sh arworks.hu / /munkaink /munkaink/medtronic /megoldasok /tudaster/webar-a-kampanyokban
# Env: OUTDIR (default .)  DATE (default today)  DELAY (default 0.5)  SECTIONS (default "1 2 3 4 5 6")
# The bot matrix is TAB-separated: content-type values contain ';' ("text/html; charset=utf-8").
set -u
DOMAIN="$1"; shift
BASE="https://$DOMAIN"
DATE="${DATE:-$(date +%F)}"; OUTDIR="${OUTDIR:-.}"; DELAY="${DELAY:-0.5}"
SECTIONS=" ${SECTIONS:-1 2 3 4 5 6} "
HERE="$(cd "$(dirname "$0")" && pwd)"
RAW="$OUTDIR/site-checks-raw-$DATE"; mkdir -p "$RAW"
PATHS=("$@"); [ ${#PATHS[@]} -eq 0 ] && PATHS=("/")
BROWSER_UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
BOTS="OAI-SearchBot/1.0 ChatGPT-User/1.0 GPTBot/1.0 ClaudeBot/1.0 Claude-SearchBot/1.0 PerplexityBot/1.0 Googlebot/2.1 Bingbot/2.0 CCBot/2.0 Google-Extended"
TAB="$(printf '\t')"
want() { case "$SECTIONS" in *" $1 "*) return 0;; esac; return 1; }
cget() { curl -sS --connect-timeout 10 --max-time 40 "$@"; }
slug() { echo "$1" | tr '/?=&: ' '______' | tr -s '_'; }
BOTCSV="$OUTDIR/bot-access-$DOMAIN-$DATE.tsv"
HOMEHTML="$RAW/bot-BROWSER-_.html"; HOMEHDR="$HOMEHTML.headers"

if want 1; then
  echo "== 1. Bot access matrix (status / bytes / seconds / where the <title> is / H1 count)"
  printf 'ua\turl\tstatus\tbytes\ttime_s\tcontent_type\ttitle_where\tdesc_where\tcanonical_where\th1_count\tog_tags\tjsonld\tmain_text_chars\th1\tfirst_p\n' > "$BOTCSV"
  for ua in BROWSER $BOTS; do
    if [ "$ua" = BROWSER ]; then UA="$BROWSER_UA"; else UA="Mozilla/5.0 (compatible; $ua)"; fi
    i=0
    for p in "${PATHS[@]}"; do
      i=$((i+1)); [ $i -gt 3 ] && break
      f="$RAW/bot-$(slug "$ua")-$(slug "$p").html"
      line=$(cget -A "$UA" -o "$f" -D "$f.headers" -w '%{http_code}\t%{size_download}\t%{time_total}\t%{content_type}' "$BASE$p")
      facts=$(python3 "$HERE/html-facts.py" "$f" --tsv 2>/dev/null)
      printf '%s\t%s\t%s\t%s\n' "$ua" "$BASE$p" "$line" "$facts" >> "$BOTCSV"
      printf '  %-20s %-40s %s  title:%s h1:%s\n' "$ua" "$p" "$(echo "$line" | cut -f1-3 | tr '\t' ' ')" \
        "$(echo "$facts" | cut -f1)" "$(echo "$facts" | cut -f4)"
      sleep "$DELAY"
    done
  done
  python3 - "$BOTCSV" <<'PYEOF'
import csv, sys
rows = list(csv.DictReader(open(sys.argv[1], encoding='utf-8'), delimiter='\t', quoting=csv.QUOTE_NONE))
ref = {r['url']: int(r['bytes'] or 0) for r in rows if r['ua'] == 'BROWSER'}
bad = [r for r in rows if r['status'] != '200' or (ref.get(r['url']) and abs(int(r['bytes'] or 0) - ref[r['url']]) / ref[r['url']] > 0.10)]
print('  -> responses that are not 200 or differ >10% in size from the browser UA:', len(bad))
for r in bad:
    print('     ', r['ua'], r['url'], r['status'], r['bytes'])
body = [r for r in rows if 'body' in (r['title_where'] or '')]
print('  -> responses with <title>/<meta>/<link rel=canonical> outside <head> (streamed metadata):', len(body))
for r in body:
    print('     ', r['ua'], r['url'], 'title:', r['title_where'], 'canonical:', r['canonical_where'])
PYEOF
fi

if [ ! -s "$HOMEHTML" ]; then cget -A "$BROWSER_UA" -o "$HOMEHTML" -D "$HOMEHDR" "$BASE/"; sleep "$DELAY"; fi

if want 2; then
  echo; echo "== 2. CDN / WAF / server headers (browser UA, home page)"
  grep -iE '^(server|via|x-powered-by|x-vercel|cf-|x-cache|x-served-by|x-amz|x-akamai|akamai|fastly|x-nextjs|strict-transport|alt-svc|x-frame|content-security|x-robots-tag|vary):' "$HOMEHDR" | sed 's/^/  /'
  grep -qi '^strict-transport-security' "$HOMEHDR" || echo "  (no Strict-Transport-Security header)"
  grep -qiE '^(cf-|x-vercel|via|x-cache|x-served-by|x-amz|akamai|fastly)' "$HOMEHDR" || echo "  (no CDN/WAF fingerprint headers: origin served directly)"
fi

if want 3; then
  echo; echo "== 3. llms.txt family"
  for p in /llms.txt /llms-full.txt /en/llms.txt; do
    f="$RAW/llms-$(slug "$p").txt"
    printf '  %-16s ' "$p"; cget -A "$BROWSER_UA" -o "$f" -w 'status=%{http_code} bytes=%{size_download} type=%{content_type}\n' "$BASE$p"
    sleep "$DELAY"
  done
  f="$RAW/llms-_llms.txt.txt"
  if head -c 300 "$f" | grep -qi '<html'; then echo "  /llms.txt returns HTML, not text"; fi
  rel=$(grep -cE '(^|[ (])/[A-Za-z0-9]' "$f"); md=$(grep -cE '\]\((https?://|/)' "$f")
  echo "  lines with bare relative paths: $rel; markdown [title](url) links: $md"
  echo "  --- links inside /llms.txt, absolute URLs AND bare relative paths (GET each, sequential; non-200 listed):"
  { grep -oE 'https?://[^ )>"<]+' "$f"; grep -oE '(^|[ (])/[A-Za-z0-9._~%/?=&-]*' "$f" | sed -E 's#^[ (]##' | sed "s#^#$BASE#"; } \
    | sed 's/[.,;:]$//' | sort -u > "$RAW/llms-links.txt"
  echo "  $(wc -l < "$RAW/llms-links.txt" | tr -d ' ') unique URLs"
  while read -r u; do
    [ -z "$u" ] && continue
    s=$(cget -A "$BROWSER_UA" -o /dev/null -w '%{http_code}' "$u")
    [ "$s" != 200 ] && echo "    $s  $u"
    sleep 0.2
  done < "$RAW/llms-links.txt"
  echo "  (end of link check)"
fi

if want 4; then
  echo; echo "== 4. Server-side rendering (plain curl UA, no JS): H1 + first <main> paragraph in raw HTML"
  for p in "${PATHS[@]}"; do
    f="$RAW/ssr-$(slug "$p").html"
    cget -o "$f" "$BASE$p"
    echo "  -- $p"; python3 "$HERE/html-facts.py" "$f" | sed 's/^/     /'
    sleep "$DELAY"
  done
fi

if want 5; then
  echo; echo "== 5. Favicon"
  printf '  /favicon.ico          '; cget -o "$RAW/favicon.ico" -w 'status=%{http_code} bytes=%{size_download} type=%{content_type} redirect=%{redirect_url}\n' "$BASE/favicon.ico"
  python3 "$HERE/html-facts.py" "$HOMEHTML" | grep '^icon links' | sed 's/^/  /'
  printf '  google s2 favicons    '; cget -L -o "$RAW/google-s2-favicon.img" -w 'status=%{http_code} bytes=%{size_download} type=%{content_type} final=%{url_effective}\n' "https://www.google.com/s2/favicons?domain=$DOMAIN&sz=48"
  echo "  (open $RAW/google-s2-favicon.img: that is the icon Google shows in results; compare with your current icon)"
fi

if want 6; then
  echo; echo "== 6. Performance hints"
  P3="${PATHS[2]:-${PATHS[0]}}"
  for p in "${PATHS[0]}" "$P3"; do
    for k in 1 2 3; do
      cget -o /dev/null -H 'Accept-Encoding: br, gzip' -w "  $p run$k: ttfb=%{time_starttransfer}s total=%{time_total}s bytes_on_wire=%{size_download}\n" "$BASE$p"
      sleep "$DELAY"
    done
    for enc in br gzip identity; do
      printf '  %-28s Accept-Encoding: %-8s -> ' "$p" "$enc"
      cget -o /dev/null -D - -H "Accept-Encoding: $enc" "$BASE$p" | grep -iE '^(content-encoding|content-length):' | tr '\r\n' '  '; echo
      sleep "$DELAY"
    done
  done
  css=$(grep -oE '/_next/static/[^"]+\.css' "$HOMEHTML" | head -1)
  js=$(grep -oE '/_next/static/chunks/[^"]+\.js' "$HOMEHTML" | head -1)
  logo=$(grep -oE '/assets/[^"]+\.(png|jpg|svg|webp)' "$HOMEHTML" | head -1)
  media=$(grep -oE '/media/[^"]+\.(png|jpg|jpeg|webp)' "$HOMEHTML" | head -1)
  for p in "${PATHS[0]}" "$P3" "$css" "$js" "$logo" "$media" /robots.txt /sitemap.xml /llms.txt; do
    [ -z "$p" ] && continue
    printf '  %-60s ' "$p"
    cget -o /dev/null -D - "$BASE$p" | grep -iE '^(cache-control|x-nextjs-cache|etag|last-modified):' | tr '\r\n' '  '; echo
    sleep "$DELAY"
  done
fi
echo; echo "raw files in $RAW; bot matrix in $BOTCSV"
