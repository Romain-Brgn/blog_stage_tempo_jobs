# ⚙️ Mise en place locale du projet (environnement de développement)

Ce guide explique comment chaque membre de l’équipe peut créer sa propre base de données locale et lancer le projet sans conflit.

---

## 🧱 1. Pré-requis

- **WAMP** installé et **MySQL actif**
- **Node.js** installé (v22 minimum)
- **VS Code** (terminal PowerShell)
- **Git** pour cloner le projet

---

## 🗃️ 2. Création de votre base de données et utilisateur MySQL

> ⚠️ Chaque membre doit créer **sa propre base** et **son propre utilisateur MySQL**, pour éviter les conflits.

### ① Ouvrir le terminal PowerShell dans VS Code

Tapez :

```
& "C:\wamp64\bin\mysql\mysql9.1.0\bin\mysql.exe" -u root -p
```

> Si erreur :
>
> - Vérifiez la **version exacte** de MySQL dans `C:\wamp64\bin\mysql\`
> - Adaptez le chemin (par ex. `mysql8.0.31` si vous êtes sur une version différente)

Entrez votre mot de passe **root** si vous en avez un.  
Le terminal bascule alors en mode **MySQL** (invite `mysql>`).

---

### ② Vérifier que vous êtes bien connecté en root

```
SELECT CURRENT_USER(), USER();
```

Le résultat doit afficher :

```
root@localhost
```

---

### ③ Créer votre base et votre utilisateur

> ⚠️ Remplacez **prenom** par votre prénom dans toutes les lignes ci-dessous.

```
CREATE DATABASE IF NOT EXISTS `stage_blog_prenom` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'app_admin_prenom'@'localhost' IDENTIFIED BY 'ChangeMe!2025';

GRANT ALL PRIVILEGES ON `stage_blog_prenom`.* TO 'app_admin_prenom'@'localhost';

FLUSH PRIVILEGES;

SHOW GRANTS FOR 'app_admin_prenom'@'localhost';
```

Vérifiez que le `GRANT` a bien fonctionné.

---

### ④ Quitter MySQL root

```
exit
```

---

### ⑤ Se reconnecter avec votre utilisateur personnel (remplacer prenom)

Toujours dans PowerShell :

```
& "C:\wamp64\bin\mysql\mysql9.1.0\bin\mysql.exe" -u app_admin_prenom -p
```

Entrez votre mot de passe (`ChangeMe!2025` par défaut).  
Vous êtes maintenant connecté avec votre propre utilisateur.

---

## 🌱 3. Configuration du projet Node.js

### ① Installer les dépendances

Dans le terminal VS Code, à la racine du projet :

```
npm install
```

Cela installe automatiquement dotenv-cli qui permettra de run les migrations en une ligne de commande

---

### ② Créer votre fichier `.env.local`

À la racine du projet, créez un fichier `.env.local`  
et remplissez-le avec **vos infos personnelles** :

```env
DB_NAME=stage_blog_prenom
DB_USER=app_admin_prenom
DB_PASSWORD=ChangeMe!2025
```

(Vous pouvez copier coller le fichier .env.example et remplacer les données)

---

## 🧩 4. Exécution des migrations

Les scripts SQL du projet sont dans :

```
scripts/
  baseline.sql        ← structure complète de la base
  migrations/         ← fichiers SQL d’évolution (vides pour l’instant)
```

---

### ① Créer / mettre à jour votre base

Lancez simplement :

```
npm run migrate
```

👉 Cette commande :

1. charge automatiquement vos variables depuis `.env.local`
2. exécute le `baseline.sql`
3. exécute ensuite **toutes les migrations** du dossier `scripts/migrations`

---

### ② Si vous ne voulez lancer que le baseline :

```
npm run migrate:baseline
```

### ③ Si vous ne voulez lancer que les migrations :

```
npm run migrate:migrations
```

---

## 🧰 5. Vérification dans MySQL

Pour confirmer que tout s’est bien créé :

```
& "C:\wamp64\bin\mysql\mysql9.1.0\bin\mysql.exe" -u app_admin_prenom -p
```

Puis :

```
USE stage_blog_prenom;
SHOW TABLES;
```

Vous devriez voir les **16 tables** du projet.

---

## ✅ En résumé rapide

| Étape | Commande                                                      | Objectif                         |
| ----- | ------------------------------------------------------------- | -------------------------------- |
| 1     | `& "C:\wamp64\bin\mysql\mysql9.1.0\bin\mysql.exe" -u root -p` | Se connecter en root             |
| 2     | `CREATE DATABASE...`                                          | Créer sa base + user             |
| 3     | `npm install`                                                 | Installer les dépendances        |
| 4     | `.env.local`                                                  | Configurer ses accès             |
| 5     | `npm run migrate`                                             | Créer les tables automatiquement |

# =================================================================================================================================

# 📦 Processus d’ajout de migrations SQL (équipe)

## 0) Principe

- **Baseline** : `scripts/baseline.sql` (ne plus le modifier après merge).
- **Migrations** : `scripts/migrations/*.sql` (une évolution = un fichier).
- **Ordre** : garanti par **le nom du fichier** (timestamp).

---

## 1) Nommage (timestamp + description)

- Format recommandé : `YYYYMMDD_HHmm_description.sql`
  - Exemples :
    - `20251010_0915_users_add_last_login.sql`
    - `20251012_1802_posts_add_index_published_at.sql`
    - `20251013_1010_comments_add_parent_fk.sql`
- **Règles d’équipe**
  1. **Pull avant de créer** ta migration (pour prendre un timestamp plus récent que le dernier).
  2. **Une modif = un fichier = une PR** (ne pas retoucher une migration déjà mergée).
  3. **Pas de fichiers vides** dans `main`.

---

## 2) Où créer le fichier

- Dossier : `scripts/migrations/`
- Nom : `YYYYMMDD_HHmm_description.sql` (voir format ci-dessus)

---

## 3) Contenu type d’une migration

> Adapte selon ton besoin. L’objectif est de rester **idempotent** autant que possible.

### 3.1. En-tête standard

```sql
-- Migration: 20251010_0915_users_add_last_login.sql
-- Auteur: <ton_prenom>
-- Objet: ajout colonne last_login sur users
-- Remarque: utilise DESACTIVE/ACTIVE FK si besoin d’ALTER en série
SET time_zone = '+00:00';
SET NAMES utf8mb4;


```

=============================================================================================================
EXEMPLE AJOUT DE COLONNE
=============================================================================================================
-- Ajout de colonne si elle n'existe pas
-- (MySQL ne supporte pas IF NOT EXISTS partout → on vérifie via information_schema)
SET @col_exists := (
SELECT COUNT(\*)
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'users'
AND COLUMN_NAME = 'last_login'
);

-- Si la colonne n'existe pas, on l'ajoute
-- NB: le IF(@col_exists = 0) nécessite un PREPARE/EXECUTE en MySQL si on veut être 100% idempotent.
-- Variante simple (non idempotente, à exécuter une seule fois) :
-- ALTER TABLE users ADD COLUMN last_login DATETIME NULL;

-- Variante idempotente (avec PREPARE) :
SET @ddl := IF(@col_exists = 0,
'ALTER TABLE users ADD COLUMN last_login DATETIME NULL',
'SELECT "users.last_login déjà présent"');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index éventuel (même logique)
SET @idx_exists := (
SELECT COUNT(\*)
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'users'
AND INDEX_NAME = 'ix_users_last_login'
);
SET @ddl := IF(@idx_exists = 0,
'CREATE INDEX ix_users_last_login ON users (last_login)',
'SELECT "index ix_users_last_login déjà présent"');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

=============================================================================================================
EXEMPLE AJOUT DE TABLE
=============================================================================================================

CREATE TABLE IF NOT EXISTS notifications (
id INT UNSIGNED NOT NULL AUTO_INCREMENT,
user_id CHAR(50) NOT NULL,
title VARCHAR(100) NOT NULL,
body TEXT NOT NULL,
is_read BOOLEAN NOT NULL DEFAULT FALSE,
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (id),
KEY ix_notifications_user_id (user_id),
CONSTRAINT fk_notifications_user
FOREIGN KEY (user_id) REFERENCES users(id)
ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Seed idempotent éventuel (si référentiel)
-- INSERT IGNORE INTO notifications_types (id, name) VALUES (1,'info');
