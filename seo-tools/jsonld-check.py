#!/usr/bin/env python3
"""JSON-LD audit: is every <script type="application/ld+json"> valid JSON, which @types exist on
which pages, are required fields present, is the Organization entity well-formed (@id, sameAs, logo),
do given page groups carry the expected types, and is there visible FAQ content without FAQPage markup.

Usage:
  python3 jsonld-check.py --sitemap https://DOMAIN [--cache DIR] [--out PREFIX]
          [--expect '/munkaink/[^/]+$=CreativeWork|VideoObject|BreadcrumbList' ...]
  python3 jsonld-check.py https://DOMAIN/page1 https://DOMAIN/page2 ...

Pages WITHOUT any JSON-LD are reported (the original script silently treated them as fine).
Outputs PREFIX-jsonld.csv (one row per page) and a summary on stdout.
"""
import argparse
import collections
import csv
import html as htmllib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seo_common import common_args, make_fetcher, base_of, sitemap_entries, parse_html, path_of  # noqa: E402

REQ = {'Organization': ['name', 'url'], 'LocalBusiness': ['name', 'address'], 'Person': ['name'],
       'Service': ['name', 'provider'], 'FAQPage': ['mainEntity'], 'Question': ['name', 'acceptedAnswer'],
       'BreadcrumbList': ['itemListElement'], 'WebPage': ['name', 'url'], 'WebSite': ['name', 'url'],
       'Article': ['headline', 'author', 'datePublished'], 'BlogPosting': ['headline', 'author', 'datePublished'],
       'NewsArticle': ['headline', 'author', 'datePublished'], 'Course': ['name', 'provider'],
       'Event': ['name', 'startDate', 'location'], 'SoftwareApplication': ['name', 'applicationCategory'],
       'CreativeWork': ['name'], 'VideoObject': ['name', 'thumbnailUrl', 'uploadDate'],
       'ItemList': ['itemListElement'], 'Product': ['name'], 'ImageObject': ['contentUrl']}
ORG_TYPES = {'Organization', 'Corporation', 'LocalBusiness', 'ProfessionalService', 'OnlineBusiness', 'NGO'}
def norm_ws(t):
    return re.sub(r'\s+', ' ', t).strip()


FAQ_HEAD_RE = re.compile(r'\b(GYIK|Gyakori kérdések|Gyakran ismételt kérdések|Kérdések és válaszok|FAQs?|'
                         r'Frequently asked questions|Common questions|Q&A)\b', re.I)
VIDEO_RE = re.compile(r'(youtube\.com/embed/|youtube-nocookie\.com/embed/|i\.ytimg\.com/vi/|player\.vimeo\.com/|<video\b)')


def walk(node, out, depth=0):
    """Collect every typed node, recursing into nested objects/arrays and @graph."""
    if isinstance(node, list):
        for x in node:
            walk(x, out, depth)
    elif isinstance(node, dict):
        if '@type' in node:
            out.append((node, depth))
        for k, v in node.items():
            if k != '@context':
                walk(v, out, depth + 1 if '@type' in node else depth)


def is_ref(node):
    return set(node.keys()) <= {'@id', '@type'}


def types_of(node):
    t = node.get('@type')
    return [x for x in (t if isinstance(t, list) else [t]) if isinstance(x, str)]


def main():
    ap = common_args(argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter))
    ap.add_argument('targets', nargs='+', help='--sitemap DOMAIN, or explicit page URLs')
    ap.add_argument('--sitemap', action='store_true', help='check every URL of DOMAIN/sitemap.xml')
    ap.add_argument('--out', default=None)
    ap.add_argument('--expect', action='append', default=[],
                    help='PATH_REGEX=Type1|Type2 : pages whose path matches must contain one of the types')
    args = ap.parse_args()
    F = make_fetcher(args)
    if args.sitemap:
        base = base_of(args.targets[0])
        urls = [e['loc'] for e in sitemap_entries(F, base, args)]
    else:
        urls = args.targets
        base = base_of('/'.join(urls[0].split('/')[:3]))
    host = base.split('//')[1]
    out = args.out or f'jsonld-{host}'
    expects = []
    for x in args.expect:
        rx, types = x.split('=', 1)
        expects.append((re.compile(rx), set(types.split('|'))))

    rows = []
    typesum = collections.Counter()      # pages per type
    org_ids = collections.defaultdict(set)
    org_full, org_refs = collections.defaultdict(set), collections.defaultdict(set)
    for i, u in enumerate(urls, 1):
        r = F.get(u)
        if i % 100 == 0:
            print(f'  {i}/{len(urls)}', file=sys.stderr)
        row = {'url': u, 'status': r.status, 'blocks': 0, 'json_errors': '', 'types_top': '', 'types_nested': '',
               'org_id': '', 'org_sameAs': '', 'org_logo': '', 'problems': '', 'expected': '', 'expect_ok': '',
               'faq_like_content': '', 'faq_markup': '', 'faq_questions_not_visible': '', 'video_embed': '', 'video_markup': ''}
        if r.status != 200:
            row['problems'] = f'HTTP {r.status}'
            rows.append(row)
            continue
        text = r.text
        pg = parse_html(text)
        row['blocks'] = len(pg.jsonld)
        faq_questions = []
        probs, top, nested, errors = [], [], [], []
        for b in pg.jsonld:
            try:
                d = json.loads(b)
            except Exception as e:
                try:
                    json.loads(htmllib.unescape(b))
                    errors.append(f'HTML-escaped JSON (entities inside <script>): {e}')
                except Exception:
                    errors.append(f'invalid JSON: {e} :: {b.strip()[:80]}')
                continue
            nodes = []
            walk(d, nodes)
            for n, depth in nodes:
                ts = types_of(n)
                if 'Question' in ts and isinstance(n.get('name'), str):
                    faq_questions.append(n['name'])
                (top if depth == 0 else nested).extend(ts)
                if is_ref(n):
                    continue
                for t in ts:
                    for k in REQ.get(t, []):
                        if k not in n:
                            probs.append(f'{t}: missing {k}')
                    # @id-only reference (e.g. {"@type":"Organization","@id":…,"name":…}) to an entity that is
                    # defined in full elsewhere (usually the home page): not judged on sameAs/logo, but the
                    # summary checks that the full definition exists somewhere.
                    if t in ORG_TYPES and depth == 0 and n.get('@id') and set(n) <= {'@type', '@id', 'name', 'url'}:
                        org_ids[n['@id']].add(u)
                        org_refs[n['@id']].add(u)
                        row['org_id'] = row.get('org_id') or n['@id'] + ' (ref)'
                    elif t in ORG_TYPES and depth == 0:
                        org_full[n.get('@id', '(none)')].add(u)
                        row['org_id'] = n.get('@id', '') or 'MISSING'
                        sa = n.get('sameAs') or []
                        sa = [sa] if isinstance(sa, str) else sa
                        row['org_sameAs'] = ' '.join(sa) if sa else 'MISSING'
                        lg = n.get('logo')
                        row['org_logo'] = (lg if isinstance(lg, str) else (lg or {}).get('url', 'object')) if lg else 'MISSING'
                        org_ids[n.get('@id', '(none)')].add(u)
                        if not n.get('@id'):
                            probs.append(f'{t}: no @id (cannot be referenced from other pages)')
                        if len(sa) < 2:
                            probs.append(f'{t}: sameAs has {len(sa)} profile(s)')
                idv = n.get('@id')
                if isinstance(idv, str) and idv.startswith('http') and host not in idv.split('/')[2]:
                    probs.append(f'@id on foreign domain: {idv}')
        typesum.update(set(top + nested))
        row['types_top'] = ' '.join(sorted(set(top)))
        row['types_nested'] = ' '.join(sorted(set(nested) - set(top)))
        row['json_errors'] = ' | '.join(errors)
        path = path_of(u)
        all_types = set(top + nested)
        for rx, want in expects:
            if rx.search(path):
                row['expected'] = '|'.join(sorted(want))
                row['expect_ok'] = 'Y' if all_types & want else 'N'
        # visible FAQ-like content: an FAQ label (heading OR any short text node such as a "kicker"
        # div: "Gyakori kérdések", "Kérdés–válasz", "Q&A") plus question-like items, or several
        # question items (summary/dt/aria-expanded buttons/.faq*/.accordion* elements, question headings)
        labels = list(dict.fromkeys(pg.faq_labels + [h['text'] for h in pg.headings if FAQ_HEAD_RE.search(h['text'])]))
        q_items = list(dict.fromkeys(q['text'] for q in pg.qa_items if q['text'].rstrip().endswith('?')
                                     and 'nav' not in q['ctx'] and 'footer' not in q['ctx']))
        q_heads = [h['text'] for h in pg.headings if h['level'] >= 2 and h['text'].rstrip().endswith('?') and 'main' in h['ctx']]
        if (labels and (q_items or q_heads)) or len(q_items) >= 2 or len(q_heads) >= 3:
            row['faq_like_content'] = (f'label={"/".join(labels) or "-"}; {len(q_items)} question items; '
                                       + '; '.join((q_items or q_heads)[:3]))[:240]
        row['faq_markup'] = 'Y' if all_types & {'FAQPage', 'QAPage'} else 'N'
        v = VIDEO_RE.search(text)
        row['video_embed'] = v.group(1) if v else ''
        row['video_markup'] = 'Y' if 'VideoObject' in all_types else 'N'
        if row['faq_like_content'] and row['faq_markup'] == 'N':
            probs.append('FAQ-like content without FAQPage markup')
        # The reverse: FAQPage questions that do not appear in the visible text (Google: the Q&A must be
        # visible on the page). Visible text = HTML without <script>/<style>/<template>, tags stripped.
        if faq_questions:
            vis = re.sub(r'<(script|style|template)\b.*?</\1>', ' ', text, flags=re.S | re.I)
            vis = norm_ws(htmllib.unescape(re.sub(r'<[^>]+>', ' ', vis))).lower()
            hidden_q = [q for q in faq_questions if norm_ws(q).lower() not in vis]
            row['faq_questions_not_visible'] = f'{len(hidden_q)}/{len(faq_questions)}'
            if hidden_q:
                probs.append(f'FAQPage: {len(hidden_q)}/{len(faq_questions)} question(s) not visible on the page')
        if not pg.jsonld:
            probs.append('no JSON-LD at all')
        row['problems'] = ' | '.join(sorted(set(probs)))
        rows.append(row)

    with open(out + '-jsonld.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    # ---------------- summary
    n = len(rows)
    none = [r for r in rows if r['blocks'] == 0 and r['status'] == 200]
    print(f'{n} URLs; with JSON-LD: {n - len(none)}; without: {len(none)}; invalid JSON blocks on '
          f'{sum(1 for r in rows if r["json_errors"])} pages')
    print('Pages per @type:', ', '.join(f'{k}×{v}' for k, v in typesum.most_common()))
    sec = collections.defaultdict(lambda: [0, 0])
    for r in rows:
        p = path_of(r['url'])
        parts = [x for x in p.split('?')[0].split('/') if x]
        key = '/' + '/'.join(parts[:2 if parts[:1] == ['en'] else 1]) + ('/*' if len(parts) > (2 if parts[:1] == ['en'] else 1) else '')
        sec[key][0] += 1
        sec[key][1] += r['blocks'] > 0
    print('Sections (pages / with JSON-LD):', ', '.join(f'{k} {v[1]}/{v[0]}' for k, v in sorted(sec.items(), key=lambda kv: -kv[1][0])))
    orgs = [r for r in rows if r['org_id'] and not r['org_id'].endswith(' (ref)')]
    if orgs:
        o = orgs[0]
        print(f'Organization defined in full on {len(orgs)} page(s): @id={o["org_id"]} sameAs={o["org_sameAs"]} logo={o["org_logo"]}')
        print('  pages:', [path_of(r['url']) for r in orgs][:10])
    if org_refs:
        print(f'Organization referenced by @id only on {len(set().union(*org_refs.values()))} page(s)')
        for i, us in org_refs.items():
            if i not in org_full:
                print(f'  WARNING: {i} is only referenced, never defined in full (no sameAs/logo anywhere); e.g. {path_of(sorted(us)[0])}')
    if len(org_ids) > 1:
        print('  WARNING: Organization uses different @ids:', {k: len(v) for k, v in org_ids.items()})
    for rx, want in expects:
        m = [r for r in rows if r['expected'] == '|'.join(sorted(want))]
        ok = sum(1 for r in m if r['expect_ok'] == 'Y')
        print(f'Expectation {rx.pattern} -> {"|".join(sorted(want))}: {ok}/{len(m)} pages OK')
    faq = [r for r in rows if r['faq_like_content']]
    print(f'FAQ-like visible content: {len(faq)} pages; of those without FAQPage markup: {sum(1 for r in faq if r["faq_markup"] == "N")}')
    for r in faq[:15]:
        print(f'  {path_of(r["url"])}  markup={r["faq_markup"]}  «{r["faq_like_content"][:110]}»')
    vids = [r for r in rows if r['video_embed']]
    print(f'Pages with a video embed/thumbnail: {len(vids)}; with VideoObject: {sum(1 for r in vids if r["video_markup"] == "Y")}')
    probs = collections.Counter()
    for r in rows:
        for p in filter(None, r['problems'].split(' | ')):
            probs[p] += 1
    print('Problems (pages):')
    for p, c in probs.most_common(25):
        print(f'  {c:4}  {p}')
    print(f'File: {out}-jsonld.csv; network requests this run: {F.network_requests}')


if __name__ == '__main__':
    main()
