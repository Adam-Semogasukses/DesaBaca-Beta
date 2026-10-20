"""
DESA BACA — pengambil METADATA katalog F15 Library (stdlib saja, tanpa pip).

Hanya membaca halaman koleksi (/collections/{slug}?sort=title&page=N). Kartu di halaman
itu sudah memuat judul, penulis, dan URL sampul (hanya tiga data itu yang disimpan), jadi halaman /books/{slug}
(yang berisi teks ringkasan) TIDAK pernah dibuka. Gambar sampul tidak diunduh.

Sopan ke server: 1 request sekaligus, jeda 2,0-2,5 detik (syarat izin F15), User-Agent jelas,
semua respons disimpan di cache/ sehingga menjalankan ulang = lanjut dari titik berhenti.

  python scrape_f15.py --dry-run     # 20 buku (3 koleksi + 1 tambahan), keluaran *_sample.*
  python scrape_f15.py --full        # semua koleksi & halaman (BUTUH PERSETUJUAN)
"""
import argparse, html, json, random, re, sys, time, urllib.error, urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = 'https://www.f15library.com'
UA = 'DesaBacaMetadataBot/0.2 (proyek Desa Baca; izin F15 Library: 1 req/2 dtk, tanpa paralel)'
HERE = Path(__file__).resolve().parent
CACHE = HERE / 'cache'
DELAY = (2.0, 2.5)  # izin F15: maks 1 request per 2 detik, tanpa paralel
PER_PAGE = 24

# slug F15 -> nama tampilan Desa Baca. Urutan = urutan tampil.
CATEGORIES = [
    ('biography-memoir', 'Biografi & Memoar'),
    ('business-leadership', 'Kepemimpinan'),
    ('communication-skills', 'Skill Komunikasi'),
    ('editorial-picks', 'Pilihan Editor'),
    ('future-innovation', 'Masa Depan & Inovasi'),
    ('health-wellbeing', 'Kesehatan & Kesejahteraan'),
    ('high-performance', 'Performa & Produktivitas'),
    ('meaningful-stories', 'Cerita Inspiratif'),
    ('mind-behavior', 'Pikiran & Perilaku'),
    ('mindfulness-wisdom', 'Mindfulness & Kebijaksanaan'),
    ('personal-growth', 'Pengembangan Diri'),
    ('relationships-parenting', 'Hubungan & Keluarga'),
    ('wealth-finance', 'Keuangan'),
    ('world-culture', 'Dunia & Budaya'),
    ('dongeng-cerita-rakyat', 'Dongeng & Cerita Rakyat'),  # lokal, belum ada data
]
LOCAL_ONLY = {'dongeng-cerita-rakyat'}
DRY_RUN_PLAN = [('world-culture', 7), ('meaningful-stories', 6), ('business-leadership', 6)]  # 19 + 1 tambahan = 20
# Buku tambahan yang dicari per slug (halaman koleksi urut judul, maks 4 halaman). Ditambahkan atas permintaan pemilik proyek.
DRY_RUN_EXTRA = [('personal-growth', 'atomic-habits')]
# slug lama di Desa Baca -> slug F15 (baris lama diubah di import.sql, bukan diduplikasi)
LEGACY_SLUGS = {'atomic_habits': 'atomic-habits'}

log_lines = []
stats = {'request': 0, 'cache_hit': 0, 'gagal': 0, 'kartu_ok': 0, 'kartu_dilewati': 0, 'halaman_gagal': []}


def log(msg):
    line = f'[{datetime.now():%Y-%m-%d %H:%M:%S}] {msg}'
    log_lines.append(line)
    print(line, flush=True)


def fetch(path):
    """GET dengan cache. Kembalikan HTML atau None bila gagal."""
    key = re.sub(r'[^A-Za-z0-9]+', '_', path).strip('_') + '.html'
    f = CACHE / key
    if f.exists() and f.stat().st_size > 0:
        stats['cache_hit'] += 1
        return f.read_text(encoding='utf-8')
    time.sleep(random.uniform(*DELAY))
    req = urllib.request.Request(BASE + path, headers={'User-Agent': UA, 'Accept-Language': 'id'})
    for attempt in range(1, 7):  # jaringan/DNS bisa putus sesaat: jeda makin panjang (maks ±2 menit)
        stats['request'] += 1
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                body = r.read().decode('utf-8')
            CACHE.mkdir(exist_ok=True)
            f.write_text(body, encoding='utf-8')
            log(f'GET {path} -> 200 ({len(body)} B)')
            return body
        except urllib.error.HTTPError as e:
            log(f'GET {path} -> HTTP {e.code} (percobaan {attempt})')
            if e.code in (403, 404, 410):
                break
            if e.code == 429:
                time.sleep(30 * attempt)
        except Exception as e:  # jaringan putus, timeout
            log(f'GET {path} -> ERROR {e!r} (percobaan {attempt})')
        time.sleep(10 * attempt)
    stats['gagal'] += 1
    stats['halaman_gagal'].append(path)
    return None


def attr(tag_html, name):
    m = re.search(name + r'="([^"]*)"', tag_html)
    return html.unescape(m.group(1)).strip() if m else ''


def parse_collection(page_html, coll_slug, page_no):
    """Kembalikan (total_di_situs, halaman_terakhir, [buku])."""
    m = re.search(r'Koleksi ini berisi\s*([\d.]+)\s*buku', page_html)
    total = int(m.group(1).replace('.', '')) if m else None
    pages = [int(p) for p in re.findall(r'href="/collections/%s\?[^"]*page=(\d+)' % re.escape(coll_slug), page_html)]
    last_page = max(pages + [page_no])

    books = []
    for cm in re.finditer(r'<a [^>]*href="/books/([^"?#]+)"[^>]*>(.*?)</a>', page_html, re.S):
        slug, card = cm.group(1), cm.group(2)
        h3 = re.search(r'<h3[^>]*>', card)
        if not h3:  # tautan /books/ lain (bukan kartu)
            continue
        title = attr(h3.group(0), 'title')
        ps = [attr(p, 'title') for p in re.findall(r'<p[^>]*>', card)]
        author = next((p[5:].strip() for p in ps if p.lower().startswith('oleh ')), '')
        img = re.search(r'<img[^>]*>', card)
        cover = attr(img.group(0), 'src') if img else ''
        if not title:
            stats['kartu_dilewati'] += 1
            log(f'  DILEWATI {coll_slug} p{page_no}: kartu /books/{slug} tanpa judul')
            continue
        books.append({
            'slug': slug, 'title': title, 'author': author or None,
            'cover_url': cover or None,
            'source_url': f'{BASE}/books/{slug}',
            'categories': [coll_slug],
        })
        stats['kartu_ok'] += 1
    return total, last_page, books


def merge(into, books):
    """Gabung berdasarkan slug; kategori jadi banyak-ke-banyak."""
    for b in books:
        cur = into.get(b['slug'])
        if not cur:
            into[b['slug']] = b
            continue
        for c in b['categories']:
            if c not in cur['categories']:
                cur['categories'].append(c)
        for k in ('author', 'cover_url'):
            cur[k] = cur[k] or b[k]


def sql_str(v):
    if v is None:
        return 'NULL'
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace('\\', '\\\\').replace("'", "''") + "'"


def build_sql(books, categories, title):
    name_of = dict(CATEGORIES)
    out = [
        f'-- {title}',
        f'-- Dibuat {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC oleh data-import/scrape_f15.py. JANGAN dijalankan otomatis.',
        '-- Tidak mengubah tabel yang sudah ada: books hanya di-INSERT IGNORE (baris lama tidak ditimpa).',
        '-- Tabel baru: categories, book_categories (banyak-ke-banyak), book_sources (URL sumber,',
        '-- karena tabel books belum punya kolom untuk itu).',
        'USE desabaca;', '',
        '-- Slug F15 bisa sampai ~140 karakter (judul + subjudul), sedangkan kolom lama hanya 80.',
        'ALTER TABLE books MODIFY slug VARCHAR(255) NOT NULL;', '',
        'CREATE TABLE IF NOT EXISTS categories (',
        '  id INT AUTO_INCREMENT PRIMARY KEY,',
        '  slug VARCHAR(80) NOT NULL UNIQUE,',
        '  name VARCHAR(120) NOT NULL,',
        "  status ENUM('aktif','segera_datang') NOT NULL DEFAULT 'aktif',",
        '  sort_order TINYINT UNSIGNED DEFAULT 0',
        ');', '',
        'CREATE TABLE IF NOT EXISTS book_categories (',
        '  book_id INT NOT NULL,',
        '  category_id INT NOT NULL,',
        '  PRIMARY KEY (book_id, category_id),',
        '  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,',
        '  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE',
        ');', '',
        'CREATE TABLE IF NOT EXISTS book_sources (',
        '  book_id INT NOT NULL PRIMARY KEY,',
        "  source VARCHAR(40) NOT NULL DEFAULT 'f15library',",
        '  source_url VARCHAR(255) NOT NULL,',
        '  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
        '  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE',
        ');', '',
        'START TRANSACTION;', '',
        '-- Kategori',
    ]
    for i, c in enumerate(categories, 1):
        out.append('INSERT INTO categories (slug,name,status,sort_order) VALUES (%s,%s,%s,%d) '
                   'ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);'
                   % (sql_str(c['slug']), sql_str(c['name']), sql_str(c['status']), i))
    by_slug = {b['slug']: b for b in books}
    out += ['', '-- Baris lama Desa Baca diubah ke slug F15 (progres/bookmark pengguna ikut karena id tetap)']
    for old, new in LEGACY_SLUGS.items():
        b = by_slug.get(new)
        if b:
            out.append("UPDATE books SET slug=%s, title=%s, author=%s, cover=%s WHERE slug=%s AND "
                       "(SELECT COUNT(*) FROM (SELECT id FROM books WHERE slug=%s) t)=0;"
                       % (sql_str(new), sql_str(b['title']), sql_str(b['author']), sql_str(b['cover_url']),
                          sql_str(old), sql_str(new)))
    out += ['', '-- Buku (description NULL: isi ringkasan sengaja tidak diambil; chapters memakai default 6)']
    for b in books:
        cats = [c for c in b['categories'] if c != 'editorial-picks'] or b['categories']
        primary = name_of.get(cats[0]) if cats else None  # 'Pilihan Editor' = kurasi, bukan genre utama
        out.append('INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES '
                   '(%s,%s,%s,NULL,%s,%s,0);' % (sql_str(b['slug']), sql_str(b['title']),
                                                  sql_str(b['author'] or '(tanpa penulis)'),
                                                  sql_str(b['cover_url']), sql_str(primary)))
    out += ['', '-- Relasi buku <-> kategori']
    for b in books:
        for c in b['categories']:
            out.append('INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b '
                       'JOIN categories c ON c.slug=%s WHERE b.slug=%s;' % (sql_str(c), sql_str(b['slug'])))
    out += ['', '-- Sumber']
    for b in books:
        out.append('INSERT INTO book_sources (book_id,source_url) SELECT id,%s FROM books '
                   'WHERE slug=%s ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);'
                   % (sql_str(b['source_url']), sql_str(b['slug'])))
    out += ['', 'COMMIT;', '']
    return '\n'.join(out)


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--dry-run', action='store_true')
    g.add_argument('--full', action='store_true')
    args = ap.parse_args()
    suffix = '_sample' if args.dry_run else ''
    log(f'=== MULAI {"DRY RUN" if args.dry_run else "FULL"} ===')

    books, site_counts, all_cards = {}, {}, {}
    if args.dry_run:
        for coll, take in DRY_RUN_PLAN:
            page = fetch(f'/collections/{coll}?sort=title')
            if page is None:
                continue
            total, _, found = parse_collection(page, coll, 1)
            site_counts[coll] = total
            merge(all_cards, [dict(b, categories=list(b['categories'])) for b in found])
            merge(books, found[:take])
            log(f'  {coll}: {len(found)} kartu di halaman 1 (situs: {total} buku), diambil {take}')
        for coll, want in DRY_RUN_EXTRA:
            hit = None
            for pn in range(1, 5):
                pg = fetch(f'/collections/{coll}?sort=title' + (f'&page={pn}' if pn > 1 else ''))
                if pg is None:
                    break
                _, _, found = parse_collection(pg, coll, pn)
                hit = next((b for b in found if b['slug'] == want), None)
                if hit:
                    merge(books, [hit])
                    log(f'  tambahan: {want} ditemukan di {coll} halaman {pn}')
                    break
            if not hit:
                log(f'  tambahan: {want} TIDAK ditemukan di {coll}')
    else:
        for coll, _ in CATEGORIES:
            if coll in LOCAL_ONLY:
                continue
            page_no, last = 1, 1
            while page_no <= last:
                q = '?sort=title' + (f'&page={page_no}' if page_no > 1 else '')
                page = fetch(f'/collections/{coll}{q}')
                if page is None:
                    page_no += 1
                    continue
                total, last_seen, found = parse_collection(page, coll, page_no)
                if page_no == 1:
                    site_counts[coll] = total
                    last = max(last_seen, -(-(total or 0) // PER_PAGE))
                merge(books, found)
                page_no += 1
            got = sum(1 for b in books.values() if coll in b['categories'])
            log(f'  {coll}: {got} buku terkumpul (situs: {site_counts.get(coll)})')
            if site_counts.get(coll) and got != site_counts[coll]:
                log(f'  PERINGATAN {coll}: jumlah tidak cocok, jalankan ulang --full (cache melanjutkan)')

    categories = [{
        'slug': s, 'name': n, 'f15_collection': None if s in LOCAL_ONLY else s,
        'status': 'segera_datang' if s in LOCAL_ONLY else 'aktif',
        'site_count': site_counts.get(s),
        'collected': sum(1 for b in books.values() if s in b['categories']),
    } for s, n in CATEGORIES]

    blist = sorted(books.values(), key=lambda b: b['slug'])
    meta = {'source': BASE, 'mode': 'dry-run' if args.dry_run else 'full',
            'fetched_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
            'count': len(blist)}
    (HERE / f'f15_books{suffix}.json').write_text(
        json.dumps({'meta': meta, 'books': blist}, ensure_ascii=False, indent=2), encoding='utf-8')
    (HERE / 'categories.json').write_text(json.dumps(categories, ensure_ascii=False, indent=2), encoding='utf-8')
    (HERE / f'import{suffix}.sql').write_text(
        build_sql(blist, categories, 'DESA BACA - import katalog F15' + (' (SAMPEL DRY RUN)' if suffix else '')),
        encoding='utf-8')

    if args.dry_run:
        multi = [s for s, b in all_cards.items() if len(b['categories']) > 1]
        log(f'  cek tumpang-tindih: {len(all_cards)} kartu unik dari 3 halaman, {len(multi)} muncul di >1 koleksi')
    log(f'Ringkasan: buku={len(blist)} request={stats["request"]} cache={stats["cache_hit"]} '
        f'gagal={stats["gagal"]} kartu_ok={stats["kartu_ok"]} dilewati={stats["kartu_dilewati"]}')
    if stats['halaman_gagal']:
        log(f'  HALAMAN GAGAL ({len(stats["halaman_gagal"])}): {stats["halaman_gagal"]}')
    for k, fn in (('tanpa_penulis', lambda b: not b['author']), ('tanpa_sampul', lambda b: not b['cover_url']), ('slug>80', lambda b: len(b['slug']) > 80),
                  ('judul>150', lambda b: len(b['title']) > 150)):
        bad = [b['slug'] for b in blist if fn(b)]
        log(f'  {k}: {len(bad)} {bad[:10]}')
    with open(HERE / 'scrape_log.txt', 'a', encoding='utf-8') as f:
        f.write('\n'.join(log_lines) + '\n\n')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
