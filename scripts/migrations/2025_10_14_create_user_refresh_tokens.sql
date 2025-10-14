-- ============================================
-- Migration idempotente : table user_refresh_tokens
-- ============================================

-- 1) Créer la table si elle n'existe pas (SANS la FK)
SET @tbl_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_refresh_tokens'
);

SET @sql := IF(
  @tbl_exists = 0,
  "CREATE TABLE user_refresh_tokens (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id      CHAR(50)     NOT NULL,
    token_hash   VARCHAR(255) NOT NULL,
    expires_at   DATETIME     NOT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at   DATETIME     NULL,
    user_agent   VARCHAR(255) NULL,
    ip           VARCHAR(45)  NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_urt_token_hash (token_hash),
    KEY ix_urt_user_id (user_id),
    KEY ix_urt_expires_at (expires_at)
  ) ENGINE=InnoDB",
  "SELECT 0"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Assurer les index si la table existait déjà sans eux

-- 2.a) UNIQUE sur token_hash
SET @idx_token_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME  = 'user_refresh_tokens'
    AND INDEX_NAME  = 'uq_urt_token_hash'
);
SET @sql := IF(
  @idx_token_exists = 0,
  "CREATE UNIQUE INDEX uq_urt_token_hash ON user_refresh_tokens (token_hash)",
  "SELECT 0"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.b) INDEX sur user_id
SET @idx_uid_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME  = 'user_refresh_tokens'
    AND INDEX_NAME  = 'ix_urt_user_id'
);
SET @sql := IF(
  @idx_uid_exists = 0,
  "CREATE INDEX ix_urt_user_id ON user_refresh_tokens (user_id)",
  "SELECT 0"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2.c) INDEX sur expires_at
SET @idx_exp_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME  = 'user_refresh_tokens'
    AND INDEX_NAME  = 'ix_urt_expires_at'
);
SET @sql := IF(
  @idx_exp_exists = 0,
  "CREATE INDEX ix_urt_expires_at ON user_refresh_tokens (expires_at)",
  "SELECT 0"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Ajouter la FK vers users(id) SI la table users existe et si la FK est absente
SET @users_tbl_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'users'
);

SET @fk_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME   = 'fk_urt_user'
);

SET @sql := IF(
  @users_tbl_exists = 1 AND @fk_exists = 0,
  "ALTER TABLE user_refresh_tokens
     ADD CONSTRAINT fk_urt_user
     FOREIGN KEY (user_id) REFERENCES users(id)
     ON UPDATE CASCADE ON DELETE CASCADE",
  "SELECT 0"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
