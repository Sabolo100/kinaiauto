#!/usr/bin/env python3
"""Internal link map for all sitemap URLs.

Usage: python3 internal-links.py https://DOMAIN [--cache DIR] [--out PREFIX]
         [--focus /megoldasok/ --focus /szektorok ...]
         [--outlink-check '^/munkaink/[^/?]+$=^/(megoldasok|szektorok|szolgaltatasok)(/|$)' ...]

Link location is taken from the DOM, not from regex-cut HTML:
  content   = inside <main> (if the page has one) and not inside <header>/<nav>/<footer> (or ARIA landmarks)
  chrome    = everything else (site header, nav, mobile tab bar, footer ...)
  editorial = content links minus boilerplate (the same target + anchor text on > --boilerplate-share of pages,
              e.g. a CTA block repeated in <main> on every page)
Query strings are KEPT (filter URLs such as /munkaink?technologia=vr are real sitemap pages), fragments dropped,
&amp; decoded, relative hrefs resolved. Outputs PREFIX-links.csv (per page) and PREFIX-edges.csv (every link).
"""
import argparse
import collections
import csv
import os
import re
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seo_common import common_args, make_fetcher, base_of, sitemap_entries, parse_html, norm_url, path_of  # noqa: E402

CHROME = {'header', 'nav', 'footer'}


def main():
    ap = common_args(argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter))
    ap.add_argument('base')
    ap.add_argument('--out', default=None)
    ap.add_argument('--focus', action='append', default=[], help='path prefix to report in detail (repeatable)')
    ap.add_argument('--outlink-check', action='append', default=[],
                    help='SRC_PATH_REGEX=TARGET_PATH_REGEX: do matching pages link (content) to matching targets?')
    ap.add_argument('--boilerplate-share', type=float, default=0.3,
                    help='share of all pages above which an identical target+anchor text in <main> counts as template boilerplate (0.3: per-language templates on bilingual sites cover ~50%% of pages)')
    ap.add_argument('--lowest', type=int, default=30)
    args = ap.parse_args()
    base = base_of(args.base)
    host = base.split('//')[1]
    out = args.out or f'links-{host}'
    F = make_fetcher(args)
    entries = sitemap_entries(F, base, args)
    urls = [e['loc'] for e in entries]
    key = {norm_url(u): path_of(u) for u in urls}            # normalised URL -> path(+query)
    paths = [path_of(u) for u in urls]
    pset = set(paths)

    inbound_any = collections.defaultdict(set)
    inbound_content = collections.defaultdict(set)
    inbound_chrome = collections.defaultdict(set)
    content_occ = collections.Counter()
    out_content = collections.defaultdict(set)
    out_any = collections.defaultdict(set)
    sig_pages = collections.defaultdict(set)                 # (target, text) -> source pages (content)
    edges = []
    nonsitemap = collections.defaultdict(set)                # internal targets not in the sitemap
    redirect_forms = collections.Counter()
    has_main = {}

    for i, u in enumerate(urls, 1):
        src = path_of(u)
        r = F.get(u)
        if i % 100 == 0:
            print(f'  {i}/{len(urls)}', file=sys.stderr)
        if r.status != 200:
            continue
        pg = parse_html(r.text)
        main_present = any('main' in a['ctx'] for a in pg.anchors) or '<main' in r.text
        has_main[src] = main_present
        for a in pg.anchors:
            href = (a['href'] or '').strip()
            if not href or href.startswith(('mailto:', 'tel:', 'javascript:', 'data:')) or href.startswith('#'):
                continue
            absu = urllib.parse.urljoin(u, href)
            sp = urllib.parse.urlsplit(absu)
            if sp.scheme not in ('http', 'https'):
                continue
            h = (sp.hostname or '').lower()
            if h != host:
                if h == 'www.' + host or (sp.scheme == 'http' and h == host):
                    redirect_forms['www/http form'] += 1
                continue
            n = norm_url(absu)
            if sp.scheme == 'http':
                redirect_forms['http:// internal link'] += 1
            tgt = key.get(n)
            if tgt is None and n.endswith('/') and n.rstrip('/') in key:
                tgt = key[n.rstrip('/')]
                redirect_forms['trailing-slash form'] += 1
            ctx = a['ctx']
            is_content = (('main' in ctx) or not main_present) and not (ctx & CHROME)
            text = a['text'] or ' '.join(x for x in a['img_alts'] if x) or a['attrs'].get('aria-label', '')
            tpath = tgt if tgt is not None else path_of(n)
            edges.append({'source': src, 'target': tpath, 'in_sitemap': 'Y' if tgt else 'N',
                          'location': 'content' if is_content else 'chrome', 'text': text[:80],
                          'ctx': ','.join(sorted(ctx & {'header', 'nav', 'footer', 'main', 'aside', 'article'}))})
            if tgt is None:
                nonsitemap[tpath].add(src)
                continue
            if tgt == src:
                continue
            inbound_any[tgt].add(src)
            out_any[src].add(tgt)
            if is_content:
                inbound_content[tgt].add(src)
                content_occ[tgt] += 1
                out_content[src].add(tgt)
                sig_pages[(tgt, text.strip().lower())].add(src)
            else:
                inbound_chrome[tgt].add(src)

    n_pages = len(urls)
    boiler = {sig for sig, s in sig_pages.items() if len(s) > args.boilerplate_share * n_pages}
    inbound_editorial = collections.defaultdict(set)
    for (tgt, txt), srcs in sig_pages.items():
        if (tgt, txt) not in boiler:
            inbound_editorial[tgt] |= srcs

    rows = []
    for p in paths:
        rows.append({'page': p, 'inbound_any': len(inbound_any[p]), 'inbound_content': len(inbound_content[p]),
                     'inbound_editorial': len(inbound_editorial[p]), 'inbound_chrome_only': len(inbound_chrome[p] - inbound_content[p]),
                     'content_link_occurrences': content_occ[p], 'outbound_content_unique': len(out_content[p]),
                     'outbound_any_unique': len(out_any[p]),
                     'sample_content_sources': ' '.join(sorted(inbound_content[p])[:5])})
    with open(out + '-links.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    with open(out + '-edges.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['source', 'target', 'in_sitemap', 'location', 'text', 'ctx'])
        w.writeheader()
        w.writerows(edges)

    # ---------------- summary
    print(f'{n_pages} sitemap pages, {len(edges)} internal links parsed '
          f'({sum(1 for e in edges if e["location"] == "content")} in content). Pages without <main>: '
          f'{sum(1 for v in has_main.values() if not v)}')
    if boiler:
        print(f'Boilerplate content links (same target+text on >{args.boilerplate_share:.0%} of pages, excluded from "editorial"):')
        for (t, txt) in sorted(boiler):
            print(f'  {t}  «{txt}»  on {len(sig_pages[(t, txt)])} pages')
    orphan_any = [p for p in paths if not inbound_any[p]]
    orphan_content = [p for p in paths if not inbound_content[p]]
    print(f'\nTRUE ORPHANS (no inbound link at all): {len(orphan_any)}')
    for p in orphan_any[:40]:
        print('  ', p)
    print(f'CONTENT ORPHANS (only nav/footer links or none): {len(orphan_content)}')
    for p in orphan_content[:60]:
        print(f'   {p}  (any={len(inbound_any[p])})')
    print(f'\nFEWEST CONTENT INBOUND (page / any / content / editorial / outbound content):')
    for r in sorted(rows, key=lambda r: (r['inbound_content'], r['inbound_editorial'], r['inbound_any']))[:args.lowest]:
        print(f'  {r["page"]:70} {r["inbound_any"]:4} {r["inbound_content"]:5} {r["inbound_editorial"]:5} {r["outbound_content_unique"]:5}')
    for pref in args.focus:
        sel = [r for r in rows if r['page'] == pref or r['page'].startswith(pref)]
        print(f'\nFOCUS {pref}: {len(sel)} pages (any / content / editorial inbound; content sources)')
        for r in sel:
            print(f'  {r["page"]:60} {r["inbound_any"]:4} {r["inbound_content"]:4} {r["inbound_editorial"]:4}  {r["sample_content_sources"][:120]}')
    for chk in args.outlink_check:
        s_re, t_re = [re.compile(x) for x in chk.split('=', 1)]
        srcs = [p for p in paths if s_re.search(p)]
        hit = {p: sorted(t for t in out_content[p] if t_re.search(t)) for p in srcs}
        n_hit = sum(1 for v in hit.values() if v)
        print(f'\nOUTLINK CHECK {s_re.pattern} -> {t_re.pattern}: {n_hit}/{len(srcs)} source pages have a content link')
        tc = collections.Counter(t for v in hit.values() for t in v)
        for t, c in tc.most_common(15):
            print(f'  {c:4}  {t}')
    if nonsitemap:
        print(f'\nINTERNAL LINK TARGETS NOT IN SITEMAP: {len(nonsitemap)} (top by linking pages)')
        for t, s in sorted(nonsitemap.items(), key=lambda kv: -len(kv[1]))[:25]:
            print(f'  {len(s):4}  {t}')
    if redirect_forms:
        print('\nLinks in a redirecting form:', dict(redirect_forms))
    print(f'\nFiles: {out}-links.csv, {out}-edges.csv; network requests this run: {F.network_requests}')


if __name__ == '__main__':
    main()
