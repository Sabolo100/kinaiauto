#!/usr/bin/env python3
"""robots.txt: print it in full and evaluate it per crawler the way Google does (RFC 9309:
most specific user-agent group, longest matching rule wins, Allow wins ties, * and $ wildcards).
Python's urllib.robotparser is NOT used: it applies rules in file order (first match), so
"Allow: /" followed by "Disallow: /admin" would wrongly report /admin as allowed.

Usage: python3 robots-check.py https://DOMAIN [--paths / /admin /api/x] [--bots GPTBot,ClaudeBot,...]
"""
import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seo_common import Fetcher, base_of  # noqa: E402

BOTS = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'ClaudeBot', 'Claude-SearchBot',
        'Claude-User', 'PerplexityBot', 'Perplexity-User', 'CCBot', 'Google-Extended', 'Applebot-Extended',
        'Bytespider', 'meta-externalagent']


def parse(text):
    groups, cur, last_was_ua, sitemaps, other = [], None, False, [], []
    for raw in text.splitlines():
        line = raw.split('#', 1)[0].strip()
        if not line or ':' not in line:
            continue
        k, v = [x.strip() for x in line.split(':', 1)]
        k = k.lower()
        if k == 'user-agent':
            if not last_was_ua:
                cur = {'agents': [], 'rules': []}
                groups.append(cur)
            cur['agents'].append(v.lower())
            last_was_ua = True
        elif k in ('allow', 'disallow'):
            last_was_ua = False
            if cur is not None:
                cur['rules'].append((k, v))
        elif k == 'sitemap':
            sitemaps.append(v)
        else:
            other.append((k, v))
    return groups, sitemaps, other


def group_for(groups, bot):
    b = bot.lower()
    best, best_len = None, -1
    for g in groups:
        for a in g['agents']:
            if a != '*' and a in b and len(a) > best_len:
                best, best_len = g, len(a)
    if best is None:
        best = next((g for g in groups if '*' in g['agents']), None)
    return best


def rule_re(pattern):
    rx = re.escape(pattern).replace(r'\*', '.*')
    if rx.endswith(r'\$'):
        rx = rx[:-2] + '$'
    return re.compile(rx)


def allowed(group, path):
    if group is None:
        return True, '(no group)'
    best = None
    for k, v in group['rules']:
        if v == '':
            continue                      # "Disallow:" (empty) allows everything
        if rule_re(v).match(path):
            L = len(v)
            if best is None or L > best[0] or (L == best[0] and k == 'allow'):
                best = (L, k, v)
    if best is None:
        return True, '(no matching rule)'
    return best[1] == 'allow', f'{best[1]}: {best[2]}'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('base')
    ap.add_argument('--paths', nargs='*', default=['/', '/admin', '/api/x'])
    ap.add_argument('--bots', default=','.join(BOTS))
    args = ap.parse_args()
    base = base_of(args.base)
    F = Fetcher(delay=0)
    r = F.get(base + '/robots.txt')
    print(f'robots.txt: HTTP {r.status}, {len(r.body)} bytes, content-type {r.headers.get("content-type", "?")}'
          + (f', redirect chain {r.chain}' if len(r.chain) > 1 else ''))
    text = r.text if r.status == 200 else ''
    print('----- full content -----')
    print(text.rstrip() or '(empty)')
    print('------------------------')
    groups, sitemaps, other = parse(text)
    host = base.split('//')[1]
    if not sitemaps:
        print('WARNING: no Sitemap: line')
    for s in sitemaps:
        if host not in s:
            print(f'WARNING: Sitemap on another host: {s}')
    if other:
        print('Other directives:', other)
    star = group_for(groups, 'SomeUnknownBot')
    if star and any(k == 'disallow' and v == '/' for k, v in star['rules']):
        print('WARNING: "Disallow: /" for User-agent: *')
    bots = [b.strip() for b in args.bots.split(',') if b.strip()]
    print(f'\n{"bot":20} {"group":14} ' + ' '.join(f'{p[:14]:14}' for p in args.paths))
    for b in bots:
        g = group_for(groups, b)
        label = ','.join(g['agents'])[:14] if g else '-'
        cells = []
        for p in args.paths:
            ok, why = allowed(g, p)
            cells.append(f'{"allow" if ok else "BLOCK":14}')
        print(f'{b:20} {label:14} ' + ' '.join(cells))
    named = sorted({a for g in groups for a in g['agents'] if a != '*'})
    print('\nUser-agents with their own group:', named or 'none (all bots follow the * group)')


if __name__ == '__main__':
    main()
