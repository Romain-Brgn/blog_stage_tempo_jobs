-- 1) Ajouter la colonne confirm_token_expires_at SI elle n'existe pas
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'confirm_token_expires_at'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN confirm_token_expires_at DATETIME NULL AFTER confirm_token',
  'SELECT 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Créer l’index sur confirm_token_expires_at SI absent
SET @idx1_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'ix_users_confirm_token_expires_at'
);
SET @sql := IF(
  @idx1_exists = 0,
  'CREATE INDEX ix_users_confirm_token_expires_at ON users (confirm_token_expires_at)',
  'SELECT 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Créer l’index sur confirm_token SI absent
SET @idx2_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'ix_users_confirm_token'
);
SET @sql := IF(
  @idx2_exists = 0,
  'CREATE INDEX ix_users_confirm_token ON users (confirm_token)',
  'SELECT 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
