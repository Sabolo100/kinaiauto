#!/usr/bin/env python3
"""Per-page crawlability / metadata audit for every sitemap URL (called by crawl-audit.sh,
but usable alone).

Usage: python3 page-audit.py https://DOMAIN [--cache DIR] [--out PREFIX] [--forbid sslip.io,localhost]
                             [--brand ARworks] [--title-min 30] [--title-max 65]

Writes PREFIX-pages.csv (one row per sitemap URL), PREFIX-issues.csv (one row per finding),
PREFIX-hreflang.csv (every alternate pair) and prints a summary.
Lengths are counted in Unicode characters after HTML-entity decoding (not bytes).
"""
import argparse
import collections
import csv
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seo_common import (common_args, make_fetcher, base_of, sitemap_entries, parse_html,  # noqa: E402
                        norm_url, same_url, path_of)

HU_CHARS = set('áéíóöőúüűÁÉÍÓÖŐÚÜŰ')

# Internal file-share links (often pasted into CMS text: "Photos: https://drive…"). The share may grant
# edit rights, and the AI-facing outputs (llms-full, chat knowledge) amplify the leak. Public Google Forms
# are fine, so docs.google.com/forms is not flagged.
PRIVATE_SHARE = re.compile(
    r'https?:\\?/\\?/(?:[\w-]+\.)*(?:drive\.google\.com|docs\.google\.com\\?/(?!forms\\?/)|dropbox\.com\\?/(?:s|scl|sh)\\?/'
    r'|1drv\.ms|onedrive\.live\.com|sharepoint\.com|wetransfer\.com|we\.tl)[^\s"\'<>)\\]*', re.I)


def section(path):
    p = path.split('?')[0]
    parts = [x for x in p.split('/') if x]
    lang = ''
    if parts and parts[0] == 'en':
        lang, parts = '/en', parts[1:]
    if not parts:
        return (lang or '') + '/'
    if len(parts) == 1:
        return lang + '/' + parts[0] + ('?filter' if '?' in path else '')
    return lang + '/' + parts[0] + '/*'


def lang_of_path(path):
    return 'en' if path == '/en' or path.startswith('/en/') or path.startswith('/en?') else 'hu'


def main():
    ap = common_args(argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter))
    ap.add_argument('base')
    ap.add_argument('--out', default=None, help='output prefix (default audit-<host>)')
    ap.add_argument('--forbid', default='sslip.io,localhost', help='comma-separated strings that must not occur in HTML')
    ap.add_argument('--brand', default=None, help='brand name that should appear at most once in <title>')
    ap.add_argument('--title-min', type=int, default=30)
    ap.add_argument('--title-max', type=int, default=65)
    ap.add_argument('--desc-min', type=int, default=70)
    ap.add_argument('--desc-max', type=int, default=160)
    ap.add_argument('--sample-pairs', type=int, default=20, help='hreflang pairs listed in the summary')
    args = ap.parse_args()
    base = base_of(args.base)
    host = base.split('//')[1]
    brand = args.brand or host.split('.')[0]
    out = args.out or f'audit-{host}'
    forbid = [s for s in args.forbid.split(',') if s]
    F = make_fetcher(args)

    problems = []
    entries = sitemap_entries(F, base, args, problems)
    for p in problems:
        print('SITEMAP PROBLEM:', p)
    print(f'{len(entries)} sitemap URLs; fetching (cache={args.cache or "off"}) ...', file=sys.stderr)
    locs = [e['loc'] for e in entries]
    loc_norm = {norm_url(u): u for u in locs}
    dup_locs = [u for u, c in collections.Counter(norm_url(u) for u in locs).items() if c > 1]
    foreign = [u for u in locs if norm_url(u).split('/')[2] != host]

    rows, pages = [], {}
    issues = []

    def issue(kind, sev, url, detail=''):
        issues.append({'issue': kind, 'severity': sev, 'url': url, 'detail': detail})

    for i, e in enumerate(entries, 1):
        u = e['loc']
        r = F.get(u)
        if i % 50 == 0:
            print(f'  {i}/{len(entries)}', file=sys.stderr)
        txt = r.text if r.status == 200 else ''
        pg = parse_html(txt) if txt else None
        pages[norm_url(u)] = (r, pg, e)
        row = {'url': u, 'section': section(path_of(u)), 'first_status': r.first_status,
               'final_status': r.status, 'redirect_chain': ' > '.join(f'{s}:{loc}' for _, s, loc in r.chain if loc),
               'elapsed_s': round(r.elapsed, 3), 'html_bytes': len(r.body), 'wire_bytes': r.wire_bytes,
               'content_encoding': r.headers.get('content-encoding', ''),
               'cache_control': r.headers.get('cache-control', ''),
               'x_robots_tag': r.headers.get('x-robots-tag', ''), 'error': r.error or ''}
        if pg:
            canon = pg.canonicals()
            title = pg.titles[0][0] if pg.titles else ''
            desc = pg.meta('description')
            hl = pg.hreflangs()
            main_txt = ''.join(t['text'] for t in pg.paragraphs if 'main' in t['ctx'])
            row.update({
                'canonical': canon[0] if canon else '', 'canonical_count': len(canon),
                'canonical_is_self': ('Y' if canon and same_url(canon[0], u) else
                                      ('slash-only' if canon and norm_url(canon[0]).rstrip('/') == norm_url(u).rstrip('/') else 'N')),
                'robots_meta': ' | '.join(x or '' for x in pg.meta_all('robots')),
                'title': title, 'title_len': len(title), 'title_count': len(pg.titles),
                'title_where': ','.join(w for _, w in pg.titles),
                'canonical_where': ','.join(l['_where'] for l in pg.links if 'canonical' in (l.get('rel') or '').lower().split()),
                'brand_in_title': len(re.findall(re.escape(brand), title, re.I)),
                'meta_description': desc or '', 'desc_len': len(desc or ''),
                'desc_count': len(pg.meta_all('description')),
                'og_url': pg.meta('og:url') or '', 'og_title': pg.meta('og:title') or '',
                'og_description': pg.meta('og:description') or '', 'og_image': pg.meta('og:image') or '',
                'og_type': pg.meta('og:type') or '', 'twitter_card': pg.meta('twitter:card') or '',
                'hreflang': ' | '.join(f'{k}={",".join(v)}' for k, v in sorted(hl.items())),
                'jsonld_blocks': len(pg.jsonld),
                'h1_count': sum(1 for h in pg.headings if h['level'] == 1),
                'h1': ' / '.join(h['text'] for h in pg.headings if h['level'] == 1)[:200],
                'html_lang': pg.html_lang or '',
                'main_text_chars': pg.main_text_chars,
                'hu_char_share_main': round(sum(ch in HU_CHARS for ch in main_txt) / max(1, len(main_txt)) * 100, 2),
                'meta_in_body': sum(1 for m in pg.metas if m['_where'] == 'body' and (m.get('name') or m.get('property'))),
                # React streaming: a Suspense boundary (e.g. Next.js loading.tsx) that was still pending when the
                # HTML was produced leaves the fallback in place and appends the real content at the end of
                # <body> as <div hidden id="S:0">. Crawlers without JS see a skeleton in <main>.
                'streamed_hidden_blocks': len(re.findall(r'<div hidden id="S:\d+"', txt)),
            })
            for s in forbid:
                n = txt.count(s)
                row['forbid_' + s] = n
                if n:
                    k = txt.find(s)
                    issue(f'forbidden string "{s}" in HTML', 'high', u, f'{n}x, e.g. …{txt[max(0, k - 60):k + 40]}…')
            shares = sorted(set(PRIVATE_SHARE.findall(txt)))
            row['private_share_links'] = len(shares)
            if shares:
                issue('internal file-share link in HTML (Drive/Docs/Dropbox/OneDrive/SharePoint/WeTransfer)', 'high', u,
                      f'{len(shares)} distinct, e.g. {shares[0][:100]}')
        rows.append(row)

        # ---------------- per-page flags
        if r.first_status != 200:
            issue('sitemap URL not 200', 'high', u, f'{r.first_status} chain={row["redirect_chain"]} {r.error or ""}')
        if not pg:
            continue
        lang = lang_of_path(path_of(u))
        if row['canonical_count'] == 0:
            issue('canonical missing', 'high', u)
        elif row['canonical_count'] > 1:
            issue('multiple canonicals', 'high', u, ' , '.join(pg.canonicals()))
        if row['canonical_count'] and row['canonical_is_self'] != 'Y':
            issue('canonical != own URL', 'high' if row['canonical_is_self'] == 'N' else 'low', u,
                  row['canonical'] + (' (differs only by trailing slash)' if row['canonical_is_self'] == 'slash-only' else ''))
        if 'noindex' in (row['robots_meta'] + row['x_robots_tag']).lower():
            issue('noindex page in sitemap', 'high', u, row['robots_meta'] or row['x_robots_tag'])
        if not row['og_url']:
            issue('og:url missing', 'medium', u)
        elif row['canonical'] and not same_url(row['og_url'], row['canonical']):
            issue('og:url != canonical', 'medium', u, f'og:url={row["og_url"]} canonical={row["canonical"]}')
        for k in ('og_title', 'og_description', 'og_image'):
            if not row[k]:
                issue(f'{k.replace("_", ":")} missing', 'medium' if k == 'og_image' else 'low', u)
        if not row['twitter_card']:
            issue('twitter:card missing', 'low', u)
        if not row['title']:
            issue('title missing', 'high', u)
        elif row['title_len'] < args.title_min or row['title_len'] > args.title_max:
            issue(f'title length outside {args.title_min}-{args.title_max}', 'low', u, f'{row["title_len"]}: {row["title"]}')
        if row['title_count'] > 1:
            issue('multiple <title> elements', 'medium', u, row['title_where'])
        if row['brand_in_title'] > 1:
            issue(f'brand "{brand}" twice in title', 'low', u, row['title'])
        core = re.sub(r'\s*[—–|-]\s*' + re.escape(brand) + r'.*$', '', row['title'], flags=re.I)  # drop "— Brand" suffix
        if core and core == core.upper() and re.search(r'[A-ZÁÉÍÓÖŐÚÜŰ]{4}', core):
            issue('title in ALL CAPS', 'low', u, row['title'])
        if not row['meta_description']:
            issue('meta description missing', 'medium', u)
        else:
            if row['desc_len'] > args.desc_max or row['desc_len'] < args.desc_min:
                issue(f'meta description length outside {args.desc_min}-{args.desc_max}', 'low', u, f'{row["desc_len"]}: {row["meta_description"][:90]}')
            if not re.search(r'[.!?…)"”»]$', row['meta_description'].strip()) and row['desc_len'] >= args.desc_max - 5:
                issue('meta description hard-truncated mid-sentence', 'low', u, f'…{row["meta_description"][-45:]}')
        if row['h1_count'] != 1:
            issue('H1 count != 1', 'low', u, str(row['h1_count']))
        exp_lang = lang
        if row['html_lang'] and not row['html_lang'].lower().startswith(exp_lang):
            issue('html lang does not match URL language', 'high', u, f'lang="{row["html_lang"]}" expected {exp_lang}')
        if lang == 'en' and row['hu_char_share_main'] > 3.0:   # Hungarian prose ≈ 9-11 %; names alone stay < 2 %
            issue('EN page body looks Hungarian (untranslated)', 'medium', u,
                  f'{row["hu_char_share_main"]}% Hungarian-specific letters in <main> paragraphs')
        if row.get('streamed_hidden_blocks'):
            issue('content streamed into hidden <div hidden id="S:n"> outside <main> (Suspense/loading.tsx fallback in HTML)',
                  'medium', u, f'{row["streamed_hidden_blocks"]} hidden block(s); <main> text {row["main_text_chars"]} chars')
        if row['meta_in_body']:
            issue('metadata tags rendered in <body> (streamed metadata)', 'medium', u,
                  f'{row["meta_in_body"]} meta tags in body; title in {row["title_where"]}; canonical in {row["canonical_where"]}')

    # ---------------- cross-page checks
    def dup_groups(field, minlen=1):
        g = collections.defaultdict(list)
        for row in rows:
            v = (row.get(field) or '').strip()
            if len(v) >= minlen:
                g[v].append(row['url'])
        return {k: v for k, v in g.items() if len(v) > 1}

    dup_titles = dup_groups('title')
    dup_desc = dup_groups('meta_description')

    def alternates_only(us):
        """True if every URL in the group lists all the others as hreflang alternates (HU/EN twins)."""
        for u in us:
            pg = pages.get(norm_url(u), (None, None, None))[1]
            alts = {norm_url(v[0]) for v in pg.hreflangs().values()} if pg else set()
            if not all(norm_url(o) in alts for o in us if o != u):
                return False
        return True

    for kind, groups in (('title', dup_titles), ('meta description', dup_desc)):
        for t, us in groups.items():
            twins = alternates_only(us)
            for u in us:
                if twins:
                    issue(f'same {kind} on hreflang alternates (untranslated)', 'low', u, f'"{t[:80]}"')
                else:
                    issue(f'duplicate {kind}', 'medium', u, f'{len(us)} URLs share "{t[:80]}"')

    # ---------------- hreflang reciprocity (all pairs; HTML alternates, plus sitemap alternates)
    pair_rows = []
    for nu, (r, pg, e) in pages.items():
        if not pg:
            continue
        hl = {k: v[0] for k, v in pg.hreflangs().items()}
        u = e['loc']
        own_lang = lang_of_path(path_of(u))
        if not hl:
            issue('hreflang missing (fine only for single-language pages)', 'low', u)
            continue
        if own_lang not in hl or not same_url(hl[own_lang], u):
            issue('hreflang self-reference missing/wrong', 'medium', u, f'{own_lang}={hl.get(own_lang)}')
        if 'x-default' not in hl:
            issue('hreflang x-default missing', 'low', u)
        sm_alts = e.get('alternates') or {}
        for k, v in sm_alts.items():
            if k in hl and not same_url(hl[k], v):
                issue('sitemap hreflang != HTML hreflang', 'medium', u, f'{k}: sitemap={v} html={hl[k]}')
        for k, target in hl.items():
            if k == 'x-default' or same_url(target, u):
                continue
            t = pages.get(norm_url(target))
            if t is None:
                status = 'not in sitemap'
                tr = F.get(target)
                back = None
                tpg = parse_html(tr.text) if tr.status == 200 else None
                status += f' (HTTP {tr.first_status})'
            else:
                tr, tpg, _ = t
                status = f'HTTP {tr.first_status}'
            back_map = {kk: vv[0] for kk, vv in tpg.hreflangs().items()} if tpg else {}
            back = any(same_url(v, u) for kk, v in back_map.items() if kk != 'x-default')
            tcanon = tpg.canonicals()[0] if tpg and tpg.canonicals() else ''
            ok = tr.first_status == 200 and back and 'x-default' in back_map and same_url(tcanon, target)
            pair_rows.append({'from': u, 'from_lang': own_lang, 'to_lang': k, 'to': target, 'to_status': status,
                              'to_lists_from': 'Y' if back else 'N',
                              'to_has_x_default': 'Y' if 'x-default' in back_map else 'N',
                              'to_self_canonical': 'Y' if same_url(tcanon, target) else f'N ({tcanon})',
                              'ok': 'Y' if ok else 'N'})
            if not ok:
                issue('hreflang not reciprocal / target broken', 'high', u,
                      f'{k}={target} status={status} back={back} x-default={"x-default" in back_map} canonical={tcanon}')

    # ---------------- write outputs
    cols = []
    for row in rows:
        for k in row:
            if k not in cols:
                cols.append(k)
    with open(out + '-pages.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    with open(out + '-issues.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['issue', 'severity', 'url', 'detail'])
        w.writeheader()
        w.writerows(issues)
    with open(out + '-hreflang.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['from', 'from_lang', 'to_lang', 'to', 'to_status', 'to_lists_from',
                                          'to_has_x_default', 'to_self_canonical', 'ok'])
        w.writeheader()
        w.writerows(pair_rows)

    # ---------------- summary
    print(f'\n== Sitemap: {len(locs)} URLs, {len(set(norm_url(u) for u in locs))} unique, '
          f'{len(foreign)} outside {host}' + (f': {foreign[:5]}' if foreign else ''))
    if dup_locs:
        print('  duplicate <loc>:', dup_locs[:10])
    st = collections.Counter(r['first_status'] for r in rows)
    print('== Status of sitemap URLs (no redirect following):', dict(st))
    print('== Sections:', dict(collections.Counter(r['section'] for r in rows)))
    print(f'== Issues ({len(issues)} rows) by type:')
    by = collections.defaultdict(list)
    for x in issues:
        by[(x['severity'], x['issue'])].append(x)
    order = {'high': 0, 'medium': 1, 'low': 2}
    for (sev, kind), xs in sorted(by.items(), key=lambda kv: (order.get(kv[0][0], 3), -len(kv[1]))):
        ex = xs[0]
        print(f'  [{sev:6}] {kind}: {len(xs)}  e.g. {ex["url"]}  {ex["detail"][:110]}')
    print(f'== Duplicate title groups: {len(dup_titles)}; duplicate description groups: {len(dup_desc)}')
    for t, us in sorted(dup_titles.items(), key=lambda kv: -len(kv[1]))[:10]:
        print(f'  {len(us)}x title "{t}": {us[:3]}')
    for d, us in sorted(dup_desc.items(), key=lambda kv: -len(kv[1]))[:10]:
        print(f'  {len(us)}x desc "{d[:70]}…": {us[:3]}')
    okp = sum(1 for p in pair_rows if p['ok'] == 'Y')
    print(f'== hreflang pairs checked: {len(pair_rows)}, fully OK: {okp}')
    hu_first = [p for p in pair_rows if p['from_lang'] == 'hu'][:args.sample_pairs]
    for p in hu_first:
        rev = next((q for q in pair_rows if same_url(q['from'], p['to']) and same_url(q['to'], p['from'])), None)
        print(f'  {path_of(p["from"])} <-> {path_of(p["to"])}: HU→EN {p["ok"]}, EN→HU {rev["ok"] if rev else "missing"}'
              f' (EN lists HU={p["to_lists_from"]}, EN x-default={p["to_has_x_default"]})')
    print(f'\nFiles: {out}-pages.csv, {out}-issues.csv, {out}-hreflang.csv; network requests this run: {F.network_requests}')


if __name__ == '__main__':
    main()
