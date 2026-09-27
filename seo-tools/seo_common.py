#!/usr/bin/env python3
"""seo_common — shared helpers for the seo-tools audit scripts (stdlib only, Python 3.8+).

Why this exists (see "Script fixes" in the audit report):
  * The four original scripts each re-downloaded every sitemap URL (4 full crawls per audit).
    Fetcher keeps an on-disk cache, so one crawl feeds every script (--cache DIR).
  * The originals had no timeouts, crashed on the first 4xx/5xx (urllib raises HTTPError),
    and silently followed redirects (so a sitemap URL that 301s looked like a 200).
  * Regex parsing missed React's camelCase attributes (hrefLang, fetchPriority), did not decode
    HTML entities (&amp; counted as 5 title characters) and counted the string
    'application/ld+json' inside the Next.js RSC payload as an extra JSON-LD block.
    parse_html() uses the stdlib HTMLParser: attribute names are lower-cased, entities decoded,
    <script> bodies kept raw, and every <a>/<img> carries its landmark context
    (header/nav/footer/main) so "content links" can be separated from site chrome.
"""
import gzip
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zlib
from html.parser import HTMLParser

DEFAULT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
BROWSER_UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
              '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36')


# --------------------------------------------------------------------------- fetching
class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: D401
        return None  # let 3xx surface as HTTPError so we can record every hop


_OPENER = urllib.request.build_opener(_NoRedirect)


class Resp:
    """One HTTP exchange (after optional redirect following)."""

    def __init__(self, url):
        self.url = url            # requested URL
        self.final_url = url      # URL of the last hop
        self.status = 0           # status of the last hop (0 = network error)
        self.first_status = 0     # status of the first hop (3xx means the URL itself redirects)
        self.chain = []           # [(url, status, location)]
        self.headers = {}         # last hop, lower-case keys
        self.body = b''           # decoded (un-gzipped) body of the last hop
        self.wire_bytes = 0       # bytes on the wire (compressed) of the last hop
        self.elapsed = 0.0        # seconds, summed over hops
        self.error = None
        self.from_cache = False

    @property
    def text(self):
        ctype = self.headers.get('content-type', '')
        m = re.search(r'charset=([\w-]+)', ctype, re.I)
        enc = m.group(1) if m else 'utf-8'
        try:
            return self.body.decode(enc, 'replace')
        except LookupError:
            return self.body.decode('utf-8', 'replace')


class Fetcher:
    """Sequential, polite fetcher with timeouts, retries, manual redirects and an on-disk cache.

    cache_dir: directory for cached hops (None = no cache). refresh=True ignores cached entries.
    delay: seconds to sleep before every *network* request (cache hits are free).
    """

    def __init__(self, cache_dir=None, ua=DEFAULT_UA, delay=0.3, timeout=30, retries=2,
                 refresh=False, verbose=False, accept_encoding='gzip'):
        self.cache_dir = cache_dir
        self.ua = ua
        self.delay = delay
        self.timeout = timeout
        self.retries = retries
        self.refresh = refresh
        self.verbose = verbose
        self.accept_encoding = accept_encoding
        self.network_requests = 0
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)

    # -- cache helpers
    def _key(self, method, url, extra=''):
        return hashlib.sha1(f'{method} {url} {self.ua} {extra}'.encode()).hexdigest()

    def _cache_load(self, key):
        if not self.cache_dir or self.refresh:
            return None
        meta = os.path.join(self.cache_dir, key + '.json')
        if not os.path.exists(meta):
            return None
        with open(meta, encoding='utf-8') as f:
            d = json.load(f)
        bodyf = os.path.join(self.cache_dir, key + '.body')
        d['body'] = open(bodyf, 'rb').read() if os.path.exists(bodyf) else b''
        return d

    def _cache_save(self, key, d):
        if not self.cache_dir:
            return
        body = d.pop('body', b'')
        with open(os.path.join(self.cache_dir, key + '.json'), 'w', encoding='utf-8') as f:
            json.dump(d, f, ensure_ascii=False)
        with open(os.path.join(self.cache_dir, key + '.body'), 'wb') as f:
            f.write(body)
        d['body'] = body

    # -- one hop
    def _hop(self, method, url, headers=None):
        key = self._key(method, url, json.dumps(headers or {}, sort_keys=True))
        d = self._cache_load(key)
        if d is not None:
            d['from_cache'] = True
            return d
        hdrs = {'User-Agent': self.ua, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'hu,en;q=0.8'}
        if self.accept_encoding:
            hdrs['Accept-Encoding'] = self.accept_encoding
        hdrs.update(headers or {})
        last_err = None
        for attempt in range(self.retries + 1):
            if self.delay:
                time.sleep(self.delay)
            t0 = time.time()
            self.network_requests += 1
            try:
                req = urllib.request.Request(_iri_to_uri(url), headers=hdrs, method=method)
                try:
                    r = _OPENER.open(req, timeout=self.timeout)
                    status, rh, raw = r.status, r.headers, (r.read() if method != 'HEAD' else b'')
                except urllib.error.HTTPError as e:  # 3xx (no-redirect), 4xx, 5xx
                    status, rh = e.code, e.headers
                    try:
                        raw = e.read() if method != 'HEAD' else b''
                    except Exception:
                        raw = b''
                elapsed = time.time() - t0
                h = {}
                for k, v in rh.items():
                    k = k.lower()
                    h[k] = (h[k] + ', ' + v) if k in h else v
                enc = h.get('content-encoding', '').lower()
                body = raw
                try:
                    if enc == 'gzip':
                        body = gzip.decompress(raw)
                    elif enc == 'deflate':
                        body = zlib.decompress(raw)
                except Exception:
                    pass
                if status in (429, 503) and attempt < self.retries:
                    wait = min(int(h.get('retry-after', '5') or 5), 30) if str(h.get('retry-after', '5')).isdigit() else 5
                    time.sleep(wait)
                    continue
                d = {'url': url, 'method': method, 'status': status, 'headers': h,
                     'location': urllib.parse.urljoin(url, h['location']) if 'location' in h else None,
                     'elapsed': round(elapsed, 4), 'wire_bytes': len(raw), 'body': body,
                     'fetched_at': time.strftime('%Y-%m-%dT%H:%M:%S'), 'error': None}
                if self.verbose:
                    print(f'  [{status}] {elapsed:.2f}s {url}', file=sys.stderr)
                self._cache_save(key, d)
                d['from_cache'] = False
                return d
            except Exception as e:  # timeout, DNS, TLS, connection reset...
                last_err = f'{type(e).__name__}: {e}'
                time.sleep(1 + attempt * 2)
        return {'url': url, 'method': method, 'status': 0, 'headers': {}, 'location': None,
                'elapsed': 0, 'wire_bytes': 0, 'body': b'', 'error': last_err, 'from_cache': False}

    def get(self, url, method='GET', follow=True, max_hops=6, headers=None):
        r = Resp(url)
        cur = url
        for i in range(max_hops + 1):
            d = self._hop(method, cur, headers)
            r.chain.append((cur, d['status'], d.get('location')))
            r.elapsed += d.get('elapsed', 0)
            if i == 0:
                r.first_status = d['status']
                r.from_cache = d.get('from_cache', False)
            r.status, r.headers, r.body = d['status'], d['headers'], d['body']
            r.wire_bytes, r.error, r.final_url = d.get('wire_bytes', 0), d.get('error'), cur
            if follow and d['status'] in (301, 302, 303, 307, 308) and d.get('location'):
                cur = d['location']
                continue
            break
        return r

    def head(self, url, follow=True):
        return self.get(url, method='HEAD', follow=follow)


def _iri_to_uri(url):
    """Percent-encode non-ASCII characters (urllib refuses raw Unicode in the path)."""
    return urllib.parse.quote(url, safe=":/?#[]@!$&'()*+,;=%~")


# --------------------------------------------------------------------------- sitemap
SM_NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
XHTML_NS = '{http://www.w3.org/1999/xhtml}'


def load_sitemap(fetcher, sitemap_url, _depth=0, problems=None):
    """Return list of dicts {loc, lastmod, alternates:{hreflang: href}, sitemap}.
    Follows <sitemapindex> recursively; decodes XML entities (&amp;) properly."""
    problems = problems if problems is not None else []
    r = fetcher.get(sitemap_url)
    if r.status != 200:
        problems.append(f'sitemap {sitemap_url} -> HTTP {r.status}')
        return []
    xml = r.body
    try:
        root = ET.fromstring(xml)
    except ET.ParseError as e:
        problems.append(f'sitemap {sitemap_url} is not well-formed XML: {e}; falling back to regex')
        return [{'loc': _xml_unescape(m.strip()), 'lastmod': None, 'alternates': {}, 'sitemap': sitemap_url}
                for m in re.findall(r'<loc>\s*(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?\s*</loc>', r.text, re.S)]
    out = []
    if root.tag.endswith('sitemapindex'):
        if _depth > 3:
            problems.append('sitemap index nesting too deep')
            return []
        for sm in root.iter(SM_NS + 'sitemap'):
            loc = (sm.findtext(SM_NS + 'loc') or '').strip()
            if loc:
                out += load_sitemap(fetcher, loc, _depth + 1, problems)
        return out
    for u in root.iter(SM_NS + 'url'):
        loc = (u.findtext(SM_NS + 'loc') or '').strip()
        if not loc:
            continue
        alts = {}
        for link in u.findall(XHTML_NS + 'link'):
            if (link.get('rel') or '').lower() == 'alternate' and link.get('hreflang'):
                alts[link.get('hreflang').lower()] = link.get('href')
        out.append({'loc': loc, 'lastmod': u.findtext(SM_NS + 'lastmod'), 'alternates': alts,
                    'sitemap': sitemap_url})
    return out


def _xml_unescape(s):
    return (s.replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
             .replace('&apos;', "'").replace('&amp;', '&'))


# --------------------------------------------------------------------------- URL helpers
def norm_url(u, base=None):
    """Normalise for comparison: resolve relative, lower-case scheme/host, drop default port and
    fragment, empty path -> '/', percent-decoding differences ignored. Trailing slash is KEPT
    (on most sites /x and /x/ are different URLs; one of them redirects)."""
    if u is None:
        return None
    u = u.strip()
    if base:
        u = urllib.parse.urljoin(base, u)
    p = urllib.parse.urlsplit(u)
    host = (p.hostname or '').lower()
    if p.port and not ((p.scheme == 'https' and p.port == 443) or (p.scheme == 'http' and p.port == 80)):
        host += f':{p.port}'
    path = urllib.parse.unquote(p.path) or '/'
    return urllib.parse.urlunsplit((p.scheme.lower(), host, path, urllib.parse.unquote(p.query), ''))


def same_url(a, b):
    return a is not None and b is not None and norm_url(a) == norm_url(b)


def path_of(u):
    p = urllib.parse.urlsplit(norm_url(u))
    return p.path + (('?' + p.query) if p.query else '')


# --------------------------------------------------------------------------- HTML parsing
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track',
        'wbr', 'param', 'keygen', 'command'}
LANDMARK_ROLES = {'banner': 'header', 'navigation': 'nav', 'contentinfo': 'footer', 'main': 'main',
                  'complementary': 'aside'}
CTX_TAGS = {'header', 'nav', 'footer', 'main', 'aside', 'article', 'figure', 'picture', 'a', 'button',
            'details', 'summary', 'noscript', 'svg', 'dialog', 'template', 'dl', 'dt', 'dd', 'section', 'li'}
SKIP_TEXT = {'script', 'style', 'noscript', 'template', 'svg', 'title'}
# visible labels that announce an FAQ block (full text-node match, case-insensitive)
FAQ_LABEL_RE = re.compile(r'^\s*(GYIK|Gyakori kérdések|Gyakran ismételt kérdések|Kérdés\s*[–—-]\s*válasz|'
                          r'Kérdések és válaszok|FAQs?|Frequently asked questions|Common questions|'
                          r'Questions (?:and|&) answers|Q\s*&\s*A)\s*[:.]?\s*$', re.I)
# elements that typically hold one FAQ question (class names like faq-row__q, accordion-item, question)
QA_CLASS_RE = re.compile(r'faq|accordion|question|kerdes', re.I)


class Page(HTMLParser):
    """Collects everything the audits need in one pass. Attribute names are lower-cased by
    HTMLParser (so React's hrefLang/charSet/fetchPriority are found), entities are decoded."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []          # list of (tag, attrs dict)
        self.html_lang = None
        self.titles = []         # (text, where)
        self.metas = []          # attrs dict + _where
        self.links = []          # attrs dict + _where
        self.jsonld = []         # raw text of <script type=application/ld+json>
        self.inline_script_bytes = 0
        self.anchors = []        # {href, rel, text, ctx:set, attrs}
        self.imgs = []           # {attrs, ctx:set, link_text?}
        self.headings = []       # (level, text, ctx)
        self.paragraphs = []     # (text, ctx) first 40
        self.summaries = []      # <summary> texts (accordion FAQ pattern)
        self.qa_items = []       # text of summary/dt/button[aria-expanded]/.faq*/.accordion*/.question* elements
        self.faq_labels = []     # visible text nodes such as "Gyakori kérdések", "Kérdés–válasz", "Q&A", "FAQ"
        self.buttons = []        # {text, attrs, ctx}
        self.dts = 0
        self.text_chars = 0
        self.main_text_chars = 0
        self._caps = []          # open text captures: [tag, buf, record, depth]
        self._script = None      # (type, [chunks])
        self._title_buf = None

    # context of the current position
    def ctx(self):
        c = set()
        for t, a in self.stack:
            if t in CTX_TAGS:
                c.add(t)
            role = (a.get('role') or '').lower()
            if role in LANDMARK_ROLES:
                c.add(LANDMARK_ROLES[role])
            if (a.get('aria-hidden') or '').lower() == 'true' or 'hidden' in a:
                c.add('hidden')
            if t == 'head':
                c.add('head')
        return c

    def handle_starttag(self, tag, attrs):
        a = {k: (v if v is not None else '') for k, v in attrs}
        where = 'head' if any(t == 'head' for t, _ in self.stack) else 'body'
        if tag == 'html' and a.get('lang'):
            self.html_lang = a['lang']
        in_svg = any(t == 'svg' for t, _ in self.stack)
        if tag == 'title' and not in_svg:
            self._title_buf = []
        elif tag == 'meta':
            a['_where'] = where
            self.metas.append(a)
        elif tag == 'link':
            a['_where'] = where
            self.links.append(a)
        elif tag == 'script':
            self._script = ((a.get('type') or '').lower(), [])
        elif tag == 'a':
            rec = {'href': a.get('href'), 'rel': a.get('rel', ''), 'text': '', 'ctx': self.ctx(), 'attrs': a,
                   'img_alts': []}
            self.anchors.append(rec)
            self._caps.append(['a', [], rec, len(self.stack)])
        elif tag == 'img':
            rec = {'attrs': a, 'ctx': self.ctx(), 'where': where, 'link': None, 'button': None,
                   'index_in_main': sum(1 for i in self.imgs if 'main' in i['ctx']) if 'main' in self.ctx() else None}
            self.imgs.append(rec)
            for cap in reversed(self._caps):  # innermost enclosing <a>/<button> (its text is known once it closes)
                if cap[0] == 'a' and rec['link'] is None:
                    rec['link'] = cap[2]
                    cap[2]['img_alts'].append(a.get('alt'))   # alt contributes to the link's accessible name
                elif cap[0] == 'button' and rec['button'] is None:
                    rec['button'] = cap[2]
        elif tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            rec = {'level': int(tag[1]), 'text': '', 'ctx': self.ctx()}
            self.headings.append(rec)
            self._caps.append([tag, [], rec, len(self.stack)])
        elif tag == 'p' and len(self.paragraphs) < 40:
            rec = {'text': '', 'ctx': self.ctx()}
            self.paragraphs.append(rec)
            self._caps.append(['p', [], rec, len(self.stack)])
        elif tag == 'summary':
            rec = {'text': '', 'tag': 'summary', 'class': a.get('class', ''), 'ctx': self.ctx()}
            self.summaries.append(rec)
            self.qa_items.append(rec)
            self._caps.append(['summary', [], rec, len(self.stack)])
        elif tag == 'button':
            rec = {'text': '', 'attrs': a, 'ctx': self.ctx()}
            self.buttons.append(rec)
            self._caps.append(['button', [], rec, len(self.stack)])
        elif tag == 'dt':
            self.dts += 1
        if tag not in VOID and tag not in ('a', 'p', 'summary', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6') and (
                tag == 'dt' or (tag == 'button' and 'aria-expanded' in a)
                or QA_CLASS_RE.search(a.get('class', ''))):
            rec = {'text': '', 'tag': tag, 'class': a.get('class', ''), 'ctx': self.ctx()}
            self.qa_items.append(rec)
            self._caps.append([tag, [], rec, len(self.stack)])
        if tag not in VOID:
            self.stack.append((tag, a))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack and self.stack[-1][0] == tag:
            self.stack.pop()
            self._close_caps()

    def _close_caps(self):
        # a capture ends when the element it started on is no longer on the stack (depth-aware,
        # so a nested <div> inside <div class="faq-row__q"> cannot close it early)
        while self._caps and self._caps[-1][3] >= len(self.stack):
            cap = self._caps.pop()
            cap[2]['text'] = re.sub(r'\s+', ' ', ''.join(cap[1])).strip()

    def handle_endtag(self, tag):
        if tag == 'title' and self._title_buf is not None:
            where = 'head' if any(t == 'head' for t, _ in self.stack) else 'body'
            self.titles.append((re.sub(r'\s+', ' ', ''.join(self._title_buf)).strip(), where))
            self._title_buf = None
        if tag == 'script' and self._script is not None:
            typ, chunks = self._script
            txt = ''.join(chunks)
            if typ == 'application/ld+json':
                self.jsonld.append(txt)
            else:
                self.inline_script_bytes += len(txt.encode('utf-8'))
            self._script = None
        if any(t == tag for t, _ in self.stack):
            while self.stack:
                t, _ = self.stack.pop()
                if t == tag:
                    break
        self._close_caps()

    def handle_data(self, data):
        if self._script is not None:
            self._script[1].append(data)
            return
        if self._title_buf is not None:
            self._title_buf.append(data)
            return
        tags = [t for t, _ in self.stack]
        if any(t in SKIP_TEXT for t in tags):
            return
        for cap in self._caps:
            cap[1].append(data)
        if 'head' not in tags and len(data) < 80 and FAQ_LABEL_RE.match(data):
            self.faq_labels.append(data.strip())
        n = len(data.strip())
        self.text_chars += n
        if 'main' in tags:
            self.main_text_chars += n

    # convenience accessors ------------------------------------------------
    def meta(self, key):
        """content of <meta name=key> or <meta property=key> (first match, case-insensitive key)."""
        key = key.lower()
        for m in self.metas:
            if (m.get('name') or m.get('property') or '').lower() == key:
                return m.get('content')
        return None

    def meta_all(self, key):
        key = key.lower()
        return [m.get('content') for m in self.metas if (m.get('name') or m.get('property') or '').lower() == key]

    def canonicals(self):
        return [l.get('href') for l in self.links if 'canonical' in (l.get('rel') or '').lower().split()]

    def hreflangs(self):
        out = {}
        for l in self.links:
            if 'alternate' in (l.get('rel') or '').lower().split() and l.get('hreflang'):
                out.setdefault(l['hreflang'].lower(), []).append(l.get('href'))
        return out

    def icons(self):
        return [l for l in self.links if any(r in ('icon', 'shortcut', 'apple-touch-icon', 'mask-icon')
                                             for r in (l.get('rel') or '').lower().split())]


def parse_html(text):
    p = Page()
    try:
        p.feed(text)
        p.close()
    except Exception as e:  # never let one malformed page kill a whole audit
        print(f'  parse error: {e}', file=sys.stderr)
    return p


# --------------------------------------------------------------------------- CLI helpers
def common_args(ap):
    ap.add_argument('--cache', default=None, help='cache directory shared by all scripts (recommended)')
    ap.add_argument('--refresh', action='store_true', help='ignore cached responses')
    ap.add_argument('--ua', default=DEFAULT_UA, help='User-Agent for page fetches')
    ap.add_argument('--delay', type=float, default=0.3, help='seconds between network requests')
    ap.add_argument('--timeout', type=float, default=30)
    ap.add_argument('--limit', type=int, default=0, help='only the first N sitemap URLs (0 = all)')
    ap.add_argument('--sitemap-url', default=None, help='sitemap URL (default BASE/sitemap.xml; sitemap indexes are followed)')
    ap.add_argument('-v', '--verbose', action='store_true')
    return ap


def make_fetcher(args):
    return Fetcher(cache_dir=args.cache, ua=args.ua, delay=args.delay, timeout=args.timeout,
                   refresh=args.refresh, verbose=args.verbose)


def base_of(arg):
    arg = arg.strip().rstrip('/')
    return arg if arg.startswith('http') else 'https://' + arg


def sitemap_entries(fetcher, base, args, problems=None):
    entries = load_sitemap(fetcher, args.sitemap_url or base + '/sitemap.xml', problems=problems)
    if args.limit:
        entries = entries[:args.limit]
    return entries
