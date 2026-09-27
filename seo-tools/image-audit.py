#!/usr/bin/env python3
"""Image audit for every sitemap page: alt text (missing vs empty, decorative vs content), repeated alts,
file size of EVERY unique same-host image (HEAD, falls back to a 1-byte range GET when Content-Length is
missing), formats (by Content-Type, not by extension guess), width/height, lazy loading of the first image.

Usage: python3 image-audit.py https://DOMAIN [--cache DIR] [--out PREFIX] [--max-kb 300] [--external]
Outputs PREFIX-img-occurrences.csv (every <img>), PREFIX-img-files.csv (every unique file) + summary.

Empty-alt categories:
  decorative      aria-hidden / role=presentation|none / decorative class (motif, decor, ornament, bg, icon…)
  in-labelled-control  inside an <a>/<button> that has its own text or aria-label (a11y OK, image-search signal lost)
  content         everything else (real problem)
"""
import argparse
import collections
import csv
import os
import re
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seo_common import common_args, make_fetcher, base_of, sitemap_entries, parse_html, path_of  # noqa: E402

DECOR_RE = re.compile(r'(^|[\s_-])(motif|decor|decoration|ornament|bg|background|pattern|divider|icon|spacer|shape|blob)([\s_-]|$)', re.I)
VIDEO_HOST_RE = re.compile(r'(i\.ytimg\.com|img\.youtube\.com|vimeocdn\.com)', re.I)  # 'video' in a file PATH is not a signal


def main():
    ap = common_args(argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter))
    ap.add_argument('base')
    ap.add_argument('--out', default=None)
    ap.add_argument('--max-kb', type=int, default=300)
    ap.add_argument('--external', action='store_true', help='also measure images on other hosts')
    ap.add_argument('--img-delay', type=float, default=0.1, help='delay between image HEAD requests')
    args = ap.parse_args()
    base = base_of(args.base)
    host = base.split('//')[1]
    out = args.out or f'images-{host}'
    F = make_fetcher(args)
    urls = [e['loc'] for e in sitemap_entries(F, base, args)]

    occ = []
    per_page_srcs = collections.defaultdict(set)
    lazy_first = []
    for i, u in enumerate(urls, 1):
        r = F.get(u)
        if r.status != 200:
            continue
        pg = parse_html(r.text)
        page = path_of(u)
        alts_on_page = collections.Counter((im['attrs'].get('alt') or '').strip() for im in pg.imgs
                                           if (im['attrs'].get('alt') or '').strip())
        srcs_on_page = collections.defaultdict(set)
        for im in pg.imgs:
            a = im['attrs']
            srcs_on_page[(a.get('alt') or '').strip()].add(a.get('src'))
        for im in pg.imgs:
            a = im['attrs']
            src = urllib.parse.urljoin(u, a.get('src') or a.get('data-src') or '')
            per_page_srcs[page].add(src)
            alt = a.get('alt')
            cls = a.get('class', '')
            link, btn = im['link'], im['button']
            ctl_label = ''
            if link is not None:
                ctl_label = link['text'] or link['attrs'].get('aria-label', '') or link['attrs'].get('title', '')
            if btn is not None and not ctl_label:
                ctl_label = btn['text'] or btn['attrs'].get('aria-label', '')
            if alt is None:
                state, cat = 'missing', 'missing-attribute'
            elif alt.strip() == '':
                state = 'empty'
                if ('hidden' in im['ctx'] or (a.get('role') or '').lower() in ('presentation', 'none')
                        or DECOR_RE.search(cls)):
                    cat = 'decorative'
                elif ctl_label:
                    cat = 'in-labelled-control'
                else:
                    cat = 'content'
            else:
                state = 'ok'
                cat = ''
                if len(srcs_on_page[alt.strip()]) > 2:
                    cat = 'same-alt-for-%d-different-images' % len(srcs_on_page[alt.strip()])
                elif re.search(r'\.(jpe?g|png|webp|gif|avif)$|^(img|image|kep|foto|dsc)[\s_-]?\d+$', alt.strip(), re.I):
                    cat = 'filename-like-alt'
            role = ('video-thumbnail' if VIDEO_HOST_RE.search(src) or re.search(r'video', cls, re.I) else
                    'logo' if 'logo' in src.lower() else
                    'chrome' if im['ctx'] & {'header', 'nav', 'footer'} else 'content')
            occ.append({'page': page, 'src': src, 'class': cls, 'alt_state': state, 'alt_category': cat,
                        'image_role': role, 'alt': (alt or '')[:100], 'enclosing_control_label': ctl_label[:80],
                        'width': a.get('width', ''), 'height': a.get('height', ''),
                        'loading': a.get('loading', ''), 'fetchpriority': a.get('fetchpriority', ''),
                        'srcset': 'Y' if a.get('srcset') else '', 'index_in_main': im['index_in_main']})
            if im['index_in_main'] == 0 and (a.get('loading') or '').lower() == 'lazy':
                lazy_first.append((page, src, cls))
        if i % 100 == 0:
            print(f'  {i}/{len(urls)} pages parsed', file=sys.stderr)

    # ---------------- sizes of unique files
    uniq = sorted({o['src'] for o in occ})
    measure = [s for s in uniq if args.external or urllib.parse.urlsplit(s).hostname == host]
    print(f'measuring {len(measure)} unique image files (of {len(uniq)}) ...', file=sys.stderr)
    F.delay = args.img_delay
    files = {}
    for j, s in enumerate(measure, 1):
        r = F.head(s)
        size = r.headers.get('content-length')
        method = 'HEAD'
        if r.status == 200 and not size:
            g = F.get(s, headers={'Range': 'bytes=0-0'})
            cr = g.headers.get('content-range', '')
            size = cr.split('/')[-1] if '/' in cr else (str(len(g.body)) if g.status == 200 else '')
            method = 'RANGE'
        files[s] = {'src': s, 'status': r.status, 'bytes': int(size) if size and size.isdigit() else '',
                    'content_type': r.headers.get('content-type', ''), 'cache_control': r.headers.get('cache-control', ''),
                    'etag': 'Y' if r.headers.get('etag') else '', 'last_modified': r.headers.get('last-modified', ''),
                    'method': method, 'used_on_pages': 0}
        if j % 200 == 0:
            print(f'  {j}/{len(measure)} files', file=sys.stderr)
    pages_using = collections.Counter()
    for p, ss in per_page_srcs.items():
        for s in ss:
            pages_using[s] += 1
    for s, f in files.items():
        f['used_on_pages'] = pages_using[s]

    with open(out + '-img-occurrences.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=list(occ[0].keys()))
        w.writeheader()
        w.writerows(occ)
    with open(out + '-img-files.csv', 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=['src', 'status', 'bytes', 'content_type', 'cache_control', 'etag',
                                           'last_modified', 'method', 'used_on_pages'])
        w.writeheader()
        w.writerows(sorted(files.values(), key=lambda f: -(f['bytes'] or 0)))

    # ---------------- summary
    print(f'{len(urls)} pages, {len(occ)} <img> occurrences, {len(uniq)} unique src '
          f'({len(uniq) - len(measure)} external not measured)')
    ext = collections.Counter(os.path.splitext(urllib.parse.urlsplit(s).path)[1].lower() or '(none)' for s in uniq)
    ctype = collections.Counter(f['content_type'] for f in files.values())
    print('Formats by extension (unique):', dict(ext.most_common()))
    print('Formats by Content-Type (measured):', dict(ctype.most_common()))
    print('Alt state (occurrences):', dict(collections.Counter(o['alt_state'] for o in occ)))
    print('Empty/missing alt by category and image role (occurrences / unique src):')
    grp = collections.defaultdict(list)
    for o in occ:
        if o['alt_state'] != 'ok':
            grp[(o['alt_category'], o['image_role'], o['class'].split(' ')[0] or '(no class)')].append(o)
    for (cat, role, cls), xs in sorted(grp.items(), key=lambda kv: -len(kv[1])):
        print(f'  {cat:20} {role:16} {cls:22} {len(xs):5} / {len(set(x["src"] for x in xs)):4}  e.g. {xs[0]["page"]} {xs[0]["src"].replace(base, "")}')
    other = collections.Counter(o['alt_category'] for o in occ if o['alt_state'] == 'ok' and o['alt_category'])
    if other:
        print('Alt quality:', dict(other))
        seen_ex, ex = set(), []
        for o in occ:
            if o['alt_category'].startswith('same-alt') and o['page'] not in seen_ex:
                seen_ex.add(o['page'])
                ex.append(o)
        for o in ex[:3]:
            print(f'  e.g. {o["page"]}: alt="{o["alt"]}" ({o["alt_category"]})')
    big = sorted((f for f in files.values() if f['bytes'] and f['bytes'] > args.max_kb * 1024), key=lambda f: -f['bytes'])
    print(f'\nFILES > {args.max_kb} kB: {len(big)} (of {len(files)} measured; total measured '
          f'{sum(f["bytes"] or 0 for f in files.values()) / 1048576:.1f} MB)')
    for f in big[:30]:
        print(f'  {f["bytes"] / 1024:7.0f} kB  {f["content_type"]:12} on {f["used_on_pages"]:3} pages  {f["src"].replace(base, "")}')
    bad = [f for f in files.values() if f['status'] != 200]
    if bad:
        print(f'\nBROKEN IMAGES: {len(bad)}')
        for f in bad[:20]:
            print(f'  {f["status"]}  {f["src"]}')
    nodim = collections.Counter(o['class'].split(' ')[0] or '(no class)' for o in occ if not (o['width'] and o['height']))
    print(f'\nNo width+height attributes (occurrences, by class): {sum(nodim.values())}  {dict(nodim.most_common(8))}')
    print(f'First image inside <main> is loading="lazy" (possible LCP delay): {len(lazy_first)} pages'
          + (f', e.g. {lazy_first[0]}' if lazy_first else ''))
    cc = collections.Counter(f['cache_control'] for f in files.values())
    print('Cache-Control on image files:', dict(cc.most_common(5)))
    heavy = sorted(((sum(files.get(s, {}).get('bytes') or 0 for s in ss), p) for p, ss in per_page_srcs.items()), reverse=True)[:8]
    print('Heaviest pages by total unique same-host image bytes:', [(p, f'{b / 1048576:.1f} MB') for b, p in heavy])
    print(f'Files: {out}-img-occurrences.csv, {out}-img-files.csv; network requests this run: {F.network_requests}')


if __name__ == '__main__':
    main()
