-- Ajouter la FK user_refresh_tokens.user_id -> users.id si absente
-- + sécuriser charset/collation/type pour compatibilité

-- Harmoniser (au cas où)
ALTER TABLE user_refresh_tokens
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

ALTER TABLE user_refresh_tokens
  MODIFY user_id CHAR(50) NOT NULL;

-- Vérifier existence table parente
SET @users_tbl_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
);

-- Vérifier si la FK existe déjà
SET @fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME   = 'fk_urt_user'
);

-- Ajouter la FK seulement si users existe et FK absente
SET @sql := IF(
  @users_tbl_exists = 1 AND @fk_exists = 0,
  'ALTER TABLE user_refresh_tokens
     ADD CONSTRAINT fk_urt_user
     FOREIGN KEY (user_id) REFERENCES users(id)
     ON UPDATE CASCADE ON DELETE CASCADE',
  'SELECT 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
