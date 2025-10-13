-- =====================================
-- BASELINE SCHÉMA — BLOG / ADMIN
-- =====================================
-- Hypothèse : la base a déjà DEFAULT CHARSET utf8mb4 et COLLATE utf8mb4_0900_ai_ci
-- Exécuter avec : mysql -u <user> -p --database=<ta_base> < ./baseline.sql
-- Toutes les tables InnoDB, FKs nommées, seeds idempotents, on delete et on update faites.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- =====================================
-- BLOC 1 — RÉFÉRENTIELS (sans dépendances)
-- =====================================

-- 1) role_users
CREATE TABLE IF NOT EXISTS role_users (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_users_name (name)
);

-- 2) status_users
CREATE TABLE IF NOT EXISTS status_users (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_status_users_name (name)
);

-- 3) status_posts
CREATE TABLE IF NOT EXISTS status_posts (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_status_posts_name (name)
);

-- 4) status_comments
CREATE TABLE IF NOT EXISTS status_comments (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_status_comments_name (name)
);

-- 5) status_newsletter_campaigns
CREATE TABLE IF NOT EXISTS status_newsletter_campaigns (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_status_newsletter_campaigns_name (name)
);

-- 6) sections_types
CREATE TABLE IF NOT EXISTS sections_types (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sections_types_name (name)
);

-- 7) list_diffusion
CREATE TABLE IF NOT EXISTS list_diffusion (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_list_diffusion_name (name)
);

-- 8) categories (indépendant, utilisé par posts_categories)
CREATE TABLE IF NOT EXISTS categories (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(50)  NOT NULL,
  slug VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name),
  UNIQUE KEY uq_categories_slug (slug)
);

-- =====================================
-- BLOC 2 — COMPTES & LOGS
-- =====================================

-- 9) users (id = CHAR(50), hash nullable, emails/pseudo uniques)
CREATE TABLE IF NOT EXISTS users (
  id                CHAR(50)      NOT NULL,
  role_id           INT UNSIGNED  NOT NULL,
  status_id         INT UNSIGNED  NOT NULL,
  list_diffusion_id INT UNSIGNED  NULL,
  email             VARCHAR(70)   NOT NULL,
  hash              VARCHAR(255)  NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login        DATETIME      NULL,
  url_profil_picture VARCHAR(255) NULL,
  pseudonyme        VARCHAR(50)   NULL,
  confirm_token     VARCHAR(255)  NOT NULL,
  confirm_token_expires_at      DATETIME      NULL,
  confirmed_at      DATETIME      NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_pseudonyme (pseudonyme),
  KEY ix_users_role_id (role_id),
  KEY ix_users_status_id (status_id),
  KEY ix_users_list_diffusion_id (list_diffusion_id),
  KEY ix_users_confirm_token_expires_at (confirm_token_expires_at),
  KEY ix_users_confirm_token (confirm_token),
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES role_users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_users_status
    FOREIGN KEY (status_id) REFERENCES status_users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_users_list_diffusion
    FOREIGN KEY (list_diffusion_id) REFERENCES list_diffusion(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- 10) audit_logs (user_id nullable, meta JSON, entity/entity_id pour traçage)
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    CHAR(50)     NULL,
  entity_id  INT UNSIGNED NULL,
  action     VARCHAR(50)  NOT NULL,
  entity     VARCHAR(50)  NOT NULL,
  meta       JSON         NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_audit_logs_user_id (user_id),
  KEY ix_audit_logs_entity (entity),
  KEY ix_audit_logs_entity_id (entity_id),
  KEY ix_audit_logs_created_at (created_at),
  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- =====================================
-- BLOC 3 — CONTENU & TAXONOMIE
-- =====================================

-- 11) posts (status FK, user FK, slug unique)
CREATE TABLE IF NOT EXISTS posts (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       CHAR(50)     NOT NULL,
  status        INT UNSIGNED NOT NULL,
  title         VARCHAR(100) NOT NULL,
  slug          VARCHAR(100) NOT NULL,
  excerpt       TEXT         NULL,
  cover_img_url VARCHAR(255) NULL,
  html_content  TEXT         NOT NULL,
  scheduled_at  DATETIME     NULL,
  published_at  DATETIME     NULL,
  is_featured   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NULL,
  views_count   INT          NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_posts_slug (slug),
  KEY ix_posts_user_id (user_id),
  KEY ix_posts_status (status),
  KEY ix_posts_published_at (published_at),
  KEY ix_posts_scheduled_at (scheduled_at),
  CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_posts_status
    FOREIGN KEY (status) REFERENCES status_posts(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 12) posts_categories (jointure n-n)
CREATE TABLE IF NOT EXISTS posts_categories (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id     INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_posts_categories_pair (post_id, category_id),
  KEY ix_posts_categories_post_id (post_id),
  KEY ix_posts_categories_category_id (category_id),
  CONSTRAINT fk_posts_categories_post
    FOREIGN KEY (post_id) REFERENCES posts(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_posts_categories_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =====================================
-- BLOC 4 — COMMENTAIRES
-- =====================================

-- 13) comments (parent nullable)
CREATE TABLE IF NOT EXISTS comments (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id           INT UNSIGNED NOT NULL,
  user_id           CHAR(50)     NOT NULL,
  status_id         INT UNSIGNED NOT NULL,
  comment_parent_id INT UNSIGNED NULL,
  content           TEXT         NOT NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_comments_post_id (post_id),
  KEY ix_comments_user_id (user_id),
  KEY ix_comments_status_id (status_id),
  KEY ix_comments_parent_id (comment_parent_id),
  CONSTRAINT fk_comments_post
    FOREIGN KEY (post_id) REFERENCES posts(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_comments_status
    FOREIGN KEY (status_id) REFERENCES status_comments(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_comments_parent
    FOREIGN KEY (comment_parent_id) REFERENCES comments(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- =====================================
-- BLOC 5 — NEWSLETTER
-- =====================================

-- 14) newsletter_campaigns
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  status_id       INT UNSIGNED NOT NULL,
  created_by_user CHAR(50)     NOT NULL,
  list_id_brevo   VARCHAR(50)  NULL,
  subject         VARCHAR(100) NOT NULL,
  body_html       TEXT         NOT NULL,
  body_text       TEXT         NOT NULL,
  scheduled_at    DATETIME     NULL,
  PRIMARY KEY (id),
  KEY ix_newsletter_campaigns_status_id (status_id),
  KEY ix_newsletter_campaigns_created_by (created_by_user),
  CONSTRAINT fk_newsletter_campaigns_status
    FOREIGN KEY (status_id) REFERENCES status_newsletter_campaigns(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_newsletter_campaigns_user
    FOREIGN KEY (created_by_user) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 15) newsletter_campaigns_list_diffusion (n-n entre campagnes et listes)
CREATE TABLE IF NOT EXISTS newsletter_campaigns_list_diffusion (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  newsletter_campaigns_id INT UNSIGNED NOT NULL,
  list_diffusion_id       INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nc_ld_pair (newsletter_campaigns_id, list_diffusion_id),
  KEY ix_nc_ld_nc_id (newsletter_campaigns_id),
  KEY ix_nc_ld_ld_id (list_diffusion_id),
  CONSTRAINT fk_nc_ld_nc
    FOREIGN KEY (newsletter_campaigns_id) REFERENCES newsletter_campaigns(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_nc_ld_ld
    FOREIGN KEY (list_diffusion_id) REFERENCES list_diffusion(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =====================================
-- BLOC 6 — SECTIONS
-- =====================================

-- 16) sections (FK vers sections_types)
CREATE TABLE IF NOT EXISTS sections (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type_id  INT UNSIGNED NOT NULL,
  name     VARCHAR(50)  NOT NULL,
  content  TEXT         NOT NULL,
  created_at DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sections_name (name),
  KEY ix_sections_type_id (type_id),
  CONSTRAINT fk_sections_type
    FOREIGN KEY (type_id) REFERENCES sections_types(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =====================================
-- SEEDS — IDÉMPOTENTS (référentiels uniquement)
-- =====================================

-- role_users
INSERT IGNORE INTO role_users (id, name) VALUES
  (1, 'admin'),
  (2, 'user');

-- status_users (d’après ton besoin : professionnel, candidat, curieux)
INSERT IGNORE INTO status_users (id, name) VALUES
  (1, 'professionnel'),
  (2, 'candidat'),
  (3, 'curieux'),
  (4, 'admin');

-- status_posts
INSERT IGNORE INTO status_posts (id, name) VALUES
  (1, 'draft'),
  (2, 'in review'),
  (3, 'scheduled'),
  (4, 'published');

-- status_comments
INSERT IGNORE INTO status_comments (id, name) VALUES
  (1, 'pending'),
  (2, 'approved'),
  (3, 'rejected');

-- status_newsletter_campaigns
INSERT IGNORE INTO status_newsletter_campaigns (id, name) VALUES
  (1, 'draft'),
  (2, 'scheduled'),
  (3, 'sent'),
  (4, 'canceled');

-- sections_types (exemples)
INSERT IGNORE INTO sections_types (id, name) VALUES
  (1, 'hero'),
  (2, 'text'),
  (3, 'image_gallery'),
  (4,'promotional_professionnel'),
  (5, 'promotional_candidate'),
  (6, 'promotional_admin'),
  (7, 'cta');

-- list_diffusion
INSERT IGNORE INTO list_diffusion (id, name) VALUES
  (1, 'general'),
  (2, 'professionnels'),
  (3, 'candidats'),
  (4, 'curieux'),
  (5, 'admins');

