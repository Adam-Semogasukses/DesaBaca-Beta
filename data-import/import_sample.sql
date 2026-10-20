-- DESA BACA - import katalog F15 (SAMPEL DRY RUN)
-- Dibuat 2026-10-20 03:50 UTC oleh data-import/scrape_f15.py. JANGAN dijalankan otomatis.
-- Tidak mengubah tabel yang sudah ada: books hanya di-INSERT IGNORE (baris lama tidak ditimpa).
-- Tabel baru: categories, book_categories (banyak-ke-banyak), book_sources (URL sumber,
-- karena tabel books belum punya kolom untuk itu).
USE desabaca;

-- Slug F15 bisa sampai ~140 karakter (judul + subjudul), sedangkan kolom lama hanya 80.
ALTER TABLE books MODIFY slug VARCHAR(255) NOT NULL;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  status ENUM('aktif','segera_datang') NOT NULL DEFAULT 'aktif',
  sort_order TINYINT UNSIGNED DEFAULT 0
);

CREATE TABLE IF NOT EXISTS book_categories (
  book_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (book_id, category_id),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS book_sources (
  book_id INT NOT NULL PRIMARY KEY,
  source VARCHAR(40) NOT NULL DEFAULT 'f15library',
  source_url VARCHAR(255) NOT NULL,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

START TRANSACTION;

-- Kategori
INSERT INTO categories (slug,name,status,sort_order) VALUES ('biography-memoir','Biografi & Memoar','aktif',1) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('business-leadership','Kepemimpinan','aktif',2) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('communication-skills','Skill Komunikasi','aktif',3) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('editorial-picks','Pilihan Editor','aktif',4) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('future-innovation','Masa Depan & Inovasi','aktif',5) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('health-wellbeing','Kesehatan & Kesejahteraan','aktif',6) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('high-performance','Performa & Produktivitas','aktif',7) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('meaningful-stories','Cerita Inspiratif','aktif',8) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('mind-behavior','Pikiran & Perilaku','aktif',9) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('mindfulness-wisdom','Mindfulness & Kebijaksanaan','aktif',10) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('personal-growth','Pengembangan Diri','aktif',11) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('relationships-parenting','Hubungan & Keluarga','aktif',12) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('wealth-finance','Keuangan','aktif',13) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('world-culture','Dunia & Budaya','aktif',14) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);
INSERT INTO categories (slug,name,status,sort_order) VALUES ('dongeng-cerita-rakyat','Dongeng & Cerita Rakyat','segera_datang',15) ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), sort_order=VALUES(sort_order);

-- Baris lama Desa Baca diubah ke slug F15 (progres/bookmark pengguna ikut karena id tetap)
UPDATE books SET slug='atomic-habits', title='Atomic Habits', author='James Clear', cover='https://f15-api.imajikreasi.com/assets/covers/83cf990e0373464d.avif' WHERE slug='atomic_habits' AND (SELECT COUNT(*) FROM (SELECT id FROM books WHERE slug='atomic-habits') t)=0;

-- Buku (description NULL: isi ringkasan sengaja tidak diambil; chapters memakai default 6)
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('100m-leads','$100M Leads','Alex Hormozi',NULL,'https://f15-api.imajikreasi.com/assets/covers/43e097d5cf2a5fba.avif','Kepemimpinan',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('100m-offers','$100M Offers','Alex Hormozi',NULL,'https://f15-api.imajikreasi.com/assets/covers/9278cebc8f5a820c.avif','Kepemimpinan',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('1491','1491','Charles C. Mann',NULL,'https://f15-api.imajikreasi.com/assets/covers/3ac679d1a9e98d54.avif','Dunia & Budaya',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('1493','1493','Charles C. Mann',NULL,'https://f15-api.imajikreasi.com/assets/covers/8fbb34a2de850fdd.avif','Dunia & Budaya',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('17-kualitas-penting-seorang-team-player','17 Essential Qualities of a Team Player','John C. Maxwell',NULL,'https://f15-api.imajikreasi.com/assets/covers/c83d30bfdd0b6493.avif','Kepemimpinan',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('1776','1776','David McCullough',NULL,'https://f15-api.imajikreasi.com/assets/covers/95cc01c4cb95a9f7.avif','Dunia & Budaya',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('1968','1968','Mark Kurlansky',NULL,'https://f15-api.imajikreasi.com/assets/covers/e9f4842387b8136f.avif','Dunia & Budaya',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('1984','1984','George Orwell',NULL,'https://f15-api.imajikreasi.com/assets/covers/cfe51aa6b41b632a.avif','Cerita Inspiratif',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('21-lessons-for-the-21st-century','21 Lessons for the 21st Century','Yuval Noah Harari',NULL,'https://f15-api.imajikreasi.com/assets/covers/eddfff22908d4d23.avif','Dunia & Budaya',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('24-assets','24 Assets','Daniel Priestley',NULL,'https://f15-api.imajikreasi.com/assets/covers/2b9efdccc1347ad1.avif','Kepemimpinan',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('7-powers-the-foundations-of-business-strategy','7 Powers','Hamilton Helmer',NULL,'https://f15-api.imajikreasi.com/assets/covers/2d4dff108e6681e2.avif','Kepemimpinan',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('7-principles-of-transformational-leadership','7 Principles of Transformational Leadership','Hugh Blane',NULL,'https://f15-api.imajikreasi.com/assets/covers/c1b407533eb92625.avif','Kepemimpinan',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('a-brief-history-of-indonesia','A Brief History of Indonesia','Tim Hannigan',NULL,'https://f15-api.imajikreasi.com/assets/covers/f43c93c665fd3c92.avif','Dunia & Budaya',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('atomic-habits','Atomic Habits','James Clear',NULL,'https://f15-api.imajikreasi.com/assets/covers/83cf990e0373464d.avif','Pengembangan Diri',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('bell-adano','A Bell for Adano','John Hersey',NULL,'https://f15-api.imajikreasi.com/assets/covers/9c522b681bf61672.avif','Cerita Inspiratif',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('book-mediterranean-food','A Book of Mediterranean Food','Elizabeth David',NULL,'https://f15-api.imajikreasi.com/assets/covers/2541d6c0a301056f.avif','Dunia & Budaya',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('boy-called-christmas','A Boy Called Christmas','Matt Haig',NULL,'https://f15-api.imajikreasi.com/assets/covers/29775b64ed6869ef.avif','Cerita Inspiratif',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('brief-history-seven-killings','A Brief History of Seven Killings','Marlon James',NULL,'https://f15-api.imajikreasi.com/assets/covers/7e462fa8b8ae52ac.avif','Cerita Inspiratif',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('clergyman-s-daughter','A Clergyman''s Daughter','George Orwell',NULL,'https://f15-api.imajikreasi.com/assets/covers/9602698155d947b6.avif','Cerita Inspiratif',0);
INSERT IGNORE INTO books (slug,title,author,description,cover,category,readers) VALUES ('clockwork-orange','A Clockwork Orange','Anthony Burgess',NULL,'https://f15-api.imajikreasi.com/assets/covers/09e1be020b4f8e7a.avif','Cerita Inspiratif',0);

-- Relasi buku <-> kategori
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='business-leadership' WHERE b.slug='100m-leads';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='business-leadership' WHERE b.slug='100m-offers';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='world-culture' WHERE b.slug='1491';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='world-culture' WHERE b.slug='1493';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='business-leadership' WHERE b.slug='17-kualitas-penting-seorang-team-player';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='world-culture' WHERE b.slug='1776';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='world-culture' WHERE b.slug='1968';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='meaningful-stories' WHERE b.slug='1984';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='world-culture' WHERE b.slug='21-lessons-for-the-21st-century';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='business-leadership' WHERE b.slug='24-assets';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='business-leadership' WHERE b.slug='7-powers-the-foundations-of-business-strategy';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='business-leadership' WHERE b.slug='7-principles-of-transformational-leadership';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='world-culture' WHERE b.slug='a-brief-history-of-indonesia';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='personal-growth' WHERE b.slug='atomic-habits';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='meaningful-stories' WHERE b.slug='bell-adano';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='world-culture' WHERE b.slug='book-mediterranean-food';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='meaningful-stories' WHERE b.slug='boy-called-christmas';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='meaningful-stories' WHERE b.slug='brief-history-seven-killings';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='meaningful-stories' WHERE b.slug='clergyman-s-daughter';
INSERT IGNORE INTO book_categories (book_id,category_id) SELECT b.id, c.id FROM books b JOIN categories c ON c.slug='meaningful-stories' WHERE b.slug='clockwork-orange';

-- Sumber
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/100m-leads' FROM books WHERE slug='100m-leads' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/100m-offers' FROM books WHERE slug='100m-offers' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/1491' FROM books WHERE slug='1491' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/1493' FROM books WHERE slug='1493' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/17-kualitas-penting-seorang-team-player' FROM books WHERE slug='17-kualitas-penting-seorang-team-player' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/1776' FROM books WHERE slug='1776' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/1968' FROM books WHERE slug='1968' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/1984' FROM books WHERE slug='1984' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/21-lessons-for-the-21st-century' FROM books WHERE slug='21-lessons-for-the-21st-century' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/24-assets' FROM books WHERE slug='24-assets' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/7-powers-the-foundations-of-business-strategy' FROM books WHERE slug='7-powers-the-foundations-of-business-strategy' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/7-principles-of-transformational-leadership' FROM books WHERE slug='7-principles-of-transformational-leadership' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/a-brief-history-of-indonesia' FROM books WHERE slug='a-brief-history-of-indonesia' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/atomic-habits' FROM books WHERE slug='atomic-habits' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/bell-adano' FROM books WHERE slug='bell-adano' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/book-mediterranean-food' FROM books WHERE slug='book-mediterranean-food' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/boy-called-christmas' FROM books WHERE slug='boy-called-christmas' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/brief-history-seven-killings' FROM books WHERE slug='brief-history-seven-killings' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/clergyman-s-daughter' FROM books WHERE slug='clergyman-s-daughter' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);
INSERT INTO book_sources (book_id,source_url) SELECT id,'https://www.f15library.com/books/clockwork-orange' FROM books WHERE slug='clockwork-orange' ON DUPLICATE KEY UPDATE source_url=VALUES(source_url);

COMMIT;
