-- =============================================================================
-- DESA BACA — Database Update Script
-- Mengupgrade database lama ke skema terbaru. AMAN DIJALANKAN BERULANG:
-- kolom/tabel yang sudah ada dilewati (database baru dari database.sql tidak perlu
-- script ini, tetapi menjalankannya tidak menimbulkan error).
-- Kompatibel dengan MySQL 8.0+
-- =============================================================================

USE desabaca;

DROP PROCEDURE IF EXISTS add_col_if_missing;
DELIMITER $$
CREATE PROCEDURE add_col_if_missing(IN tbl VARCHAR(64), IN col VARCHAR(64), IN def TEXT)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @ddl = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', def);
    PREPARE s FROM @ddl;
    EXECUTE s;
    DEALLOCATE PREPARE s;
  END IF;
END$$
DELIMITER ;

-- Tambah kolom chapters ke tabel books
CALL add_col_if_missing('books', 'chapters', 'TINYINT UNSIGNED DEFAULT 6');

-- Tambah kolom extended ke reading_progress
CALL add_col_if_missing('reading_progress', 'current_chapter', 'TINYINT UNSIGNED DEFAULT 1');
CALL add_col_if_missing('reading_progress', 'done_chapters',   'VARCHAR(64) DEFAULT ''''');
CALL add_col_if_missing('reading_progress', 'minutes_read',    'INT UNSIGNED DEFAULT 0');
CALL add_col_if_missing('reading_progress', 'seconds_read',    'INT UNSIGNED NOT NULL DEFAULT 0');
CALL add_col_if_missing('reading_progress', 'status',          'ENUM(''reading'',''completed'') DEFAULT ''reading''');
CALL add_col_if_missing('reading_progress', 'first_read_at',   'TIMESTAMP NULL');

-- Tambah kolom display_name ke users (nama tampilan, boleh berbeda dari username/login)
CALL add_col_if_missing('users', 'display_name', 'VARCHAR(120) NULL');

DROP PROCEDURE add_col_if_missing;

-- Update display_name agar sama dengan username untuk user lama
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- Slug F15 bisa sampai ~140 karakter (kolom lama hanya 80)
ALTER TABLE books MODIFY slug VARCHAR(255) NOT NULL;

-- Tabel riwayat baca
CREATE TABLE IF NOT EXISTS reading_history (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  book_id     INT NOT NULL,
  event_type  ENUM('open','chapter_done','finish') NOT NULL,
  chapter     TINYINT UNSIGNED NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_time (user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);
