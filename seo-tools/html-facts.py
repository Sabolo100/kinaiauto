#!/usr/bin/env python3
"""Print the SEO-relevant facts of a saved HTML file (used by site-checks.sh).

Usage: python3 html-facts.py FILE [--tsv]        (--tsv prints one TAB-separated line:
       title_where;desc_where;canonical_where;h1_count;og_tags;jsonld;main_text_chars;h1;first_p)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seo_common import parse_html  # noqa: E402


def where(items):
    ws = sorted({i.get('_where', '?') for i in items})
    return '+'.join(ws) if ws else '-'


def main():
    f = sys.argv[1]
    txt = open(f, encoding='utf-8', errors='replace').read()
    pg = parse_html(txt)
    title_where = '+'.join(sorted({w for _, w in pg.titles})) or '-'
    desc = [m for m in pg.metas if (m.get('name') or '').lower() == 'description']
    canon = [l for l in pg.links if 'canonical' in (l.get('rel') or '').lower().split()]
    h1 = [h['text'] for h in pg.headings if h['level'] == 1]
    og = [m for m in pg.metas if (m.get('property') or m.get('name') or '').lower().startswith(('og:', 'twitter:'))]
    first_p = next((p['text'] for p in pg.paragraphs if 'main' in p['ctx'] and len(p['text']) > 40), '')
    if '--tsv' in sys.argv:
        clean = lambda s: s.replace('\t', ' ').replace('\n', ' ')[:160]  # noqa: E731
        print('\t'.join([title_where, where(desc), where(canon), str(len(h1)), str(len(og)), str(len(pg.jsonld)),
                        str(pg.main_text_chars), clean(' / '.join(h1)), clean(first_p)]))
        return
    print(f'title: {pg.titles} | description in {where(desc)} | canonical in {where(canon)}')
    print(f'H1 count: {len(h1)} -> {h1}')
    print(f'first <main> paragraph: {first_p[:300]}')
    print(f'<main> text chars: {pg.main_text_chars}; og/twitter tags: {len(og)}; JSON-LD blocks: {len(pg.jsonld)}')
    icons = pg.icons()
    print('icon links:', [{k: v for k, v in i.items() if k != '_where'} for i in icons])


if __name__ == '__main__':
    main()
