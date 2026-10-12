CREATE DATABASE IF NOT EXISTS desabaca CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE desabaca;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  display_name VARCHAR(120) NULL,
  email VARCHAR(150) NULL UNIQUE,
  password VARCHAR(255) NULL,
  google_id VARCHAR(100) NULL UNIQUE,
  avatar VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  author VARCHAR(120) NOT NULL,
  description TEXT,
  cover VARCHAR(255),
  category VARCHAR(80),
  chapters TINYINT UNSIGNED DEFAULT 6,
  readers INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_bookmark (user_id, book_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reading_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  progress TINYINT UNSIGNED DEFAULT 0,
  current_chapter TINYINT UNSIGNED DEFAULT 1,
  done_chapters VARCHAR(64) DEFAULT '',
  minutes_read INT UNSIGNED DEFAULT 0,
  status ENUM('reading','completed') DEFAULT 'reading',
  first_read_at TIMESTAMP NULL,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_progress (user_id, book_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reading_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  event_type ENUM('open','chapter_done','finish') NOT NULL,
  chapter TINYINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_time (user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

INSERT INTO books (slug,title,author,description,cover,category,chapters,readers) VALUES
('atomic-habits','Atomic Habits','James Clear','Perubahan kecil yang dilakukan secara konsisten setiap hari dapat berakumulasi menghasilkan transformasi besar dalam hidup.','https://f15-api.imajikreasi.com/assets/covers/83cf990e0373464d.avif','Pengembangan Diri',6,44),
('hujan','Hujan','Tere Liye','Perjalanan hidup Lail dalam menghadapi kehilangan, cinta, dan kenangan setelah bencana alam dahsyat.','images/v259_152.png','Fiksi',6,95),
('filosofi_teras','Filosofi Teras','Henry Manampiring','Ajaran Stoik untuk membedakan hal yang dapat dan tidak dapat dikendalikan demi ketenangan batin.','images/filosofi_teras.jpg','Pengembangan Diri',6,99)
ON DUPLICATE KEY UPDATE title=VALUES(title);

